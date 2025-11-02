from fastapi import APIRouter, HTTPException, Request, Header
from datetime import date
from src.firestore_db import db
from src.nodes.quiz_node import QuizNode
from src.llms.google_llm import GoogleLLM  # ✅ use GoogleLLM now
from src.utils import get_current_user
from typing import List, Dict
import uuid

router = APIRouter(prefix="/quiz", tags=["quiz"])

MAX_ATTEMPTS_PER_STAGE = 4
PASS_THRESHOLD = 50  # percent
QUESTIONS_PER_QUIZ = 15
SCORE_PER_QUESTION = 150 / QUESTIONS_PER_QUIZ
REWARD_PASS = 30
REWARD_STREAK_3 = 15
MAJOR_REWARD_FOR_COMPLETING_ROADMAP = 100

llm = GoogleLLM().get_model()
quiz_node = QuizNode(llm)  # QuizNode now works like CounselNode

# ========================== HELPERS ==========================
def get_user_quiz_document(username: str) -> Dict:
    """Retrieve the single document storing all quizzes for the user."""
    quiz_doc = db.collection("quizzes").document(username).get()
    return quiz_doc.to_dict() or {}

def get_stage_aggregate_score(submitted_quizzes: List[Dict]):
    """Calculate the aggregate score for a stage."""
    if not submitted_quizzes:
        return 0, 0
    total_score = sum(q.get("score", 0) for q in submitted_quizzes)
    total_submitted_attempts = len(submitted_quizzes)
    avg_score = total_score / total_submitted_attempts
    return avg_score, total_submitted_attempts


# QUIZ GENERATION ROUTE
@router.post("/generate/{roadmap_id}/")
async def generate_quiz(roadmap_id: str, authorization: str = Header(...)):
    username = get_current_user(authorization)
    today_str = date.today().isoformat()

    # Validate roadmap
    roadmap_doc = db.collection("roadmaps").document(username).get()
    if not roadmap_doc.exists:
        raise HTTPException(status_code=400, detail="Roadmap must be generated first")

    roadmap_list = roadmap_doc.to_dict().get("roadmaps", [])
    roadmap_data = next((r for r in roadmap_list if r["roadmap_id"] == roadmap_id), None)
    if not roadmap_data:
        raise HTTPException(status_code=404, detail="Selected roadmap not found")

    roadmap_plan = roadmap_data.get("roadmap", {}).get("plan", [])
    user_quiz_ref = db.collection("quizzes").document(username)
    user_quiz_doc_data = get_user_quiz_document(username)

    # Create roadmap entry if not exists
    if roadmap_id not in user_quiz_doc_data:
        user_quiz_doc_data[roadmap_id] = {"current_stage": 0}

    roadmap_quizzes = user_quiz_doc_data[roadmap_id]
    current_stage = roadmap_quizzes.get("current_stage", 0)

    # If new roadmap -> start stage 1
    if current_stage == 0:
        current_stage = 1
        roadmap_quizzes["current_stage"] = current_stage

    # Get all quizzes list
    all_quizzes_list = [q for q in roadmap_quizzes.values() if isinstance(q, dict)]
    current_stage_quizzes = [q for q in all_quizzes_list if q.get("stage") == current_stage]
    attempts_made = len(current_stage_quizzes)

    # Block quiz generation if previous quiz (in current stage) is still unattempted
    pending_quiz = next(
        (q for q in current_stage_quizzes if not q.get("submitted", False)),
        None
    )
    if pending_quiz:
        raise HTTPException(
            status_code=400,
            detail=f"You still have an unattempted quiz (Attempt {pending_quiz.get('attempt')}) for Stage {current_stage}. Please submit it before generating a new quiz."
        )

    # Prevent multiple quizzes per day
    last_generated_quiz = next(
        (q for q in all_quizzes_list if q.get("generated_date") == today_str),
        None
    )
    if last_generated_quiz:
        raise HTTPException(
            status_code=429,
            detail=f"A quiz has already been generated today. Please try again tomorrow."
        )

    # Handle stage completion and retry logic
    if attempts_made >= MAX_ATTEMPTS_PER_STAGE:
        submitted_quizzes = [q for q in current_stage_quizzes if q.get("submitted", False)]
        avg_score, _ = get_stage_aggregate_score(submitted_quizzes)

        if avg_score < PASS_THRESHOLD:
            # Reset stage attempts
            for q in current_stage_quizzes:
                roadmap_quizzes.pop(q["quiz_id"], None)
            attempts_made = 0
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Stage {current_stage} already passed with {round(avg_score)}%. Wait until tomorrow to proceed."
            )

    # Validate roadmap stage content
    stage_content = next((p for p in roadmap_plan if p.get("stage") == current_stage), None)
    if not stage_content:
        num_stages = len(roadmap_plan)
        if current_stage > num_stages:
            raise HTTPException(status_code=200, detail="🎉 Congratulations! You’ve completed all stages.")
        raise HTTPException(status_code=404, detail=f"Stage {current_stage} content not found in roadmap.")

    focus_topics = stage_content.get("focus", [])
    if not focus_topics:
        raise HTTPException(status_code=404, detail=f"No focus topics found for Stage {current_stage}.")

    # Generate quiz using QuizNode (via Google Gemini)
    try:
        quiz_questions = quiz_node.generate_quiz_for_stage(focus_topics, current_stage)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

    quiz_id = str(uuid.uuid4())
    new_attempt = attempts_made + 1
    new_quiz_doc = {
        "quiz_id": quiz_id,
        "roadmap_id": roadmap_id,
        "stage": current_stage,
        "attempt": new_attempt,
        "questions": quiz_questions,
        "user_answers": {},
        "score": 0,
        "submitted": False,
        "generated_date": today_str
    }

    roadmap_quizzes[quiz_id] = new_quiz_doc
    user_quiz_doc_data[roadmap_id] = roadmap_quizzes
    user_quiz_ref.set(user_quiz_doc_data)

    return {
        "message": f"Generated Quiz for Stage {current_stage}, Attempt {new_attempt}/{MAX_ATTEMPTS_PER_STAGE}.",
        "quiz_id": quiz_id,
        "stage": current_stage,
        "attempt": new_attempt,
        "quiz": new_quiz_doc
    }

@router.post("/submit/{roadmap_id}/{quiz_id}/")
async def submit_quiz(roadmap_id: str, quiz_id: str, request: Request, authorization: str = Header(...)):
    username = get_current_user(authorization)
    data = await request.json()
    user_answers_dict = data.get("answers", {})

    if not isinstance(user_answers_dict, dict):
        raise HTTPException(status_code=400, detail="Answers must be a dictionary.")

    # ----------- FETCH QUIZ DATA ----------- #
    quiz_doc_ref = db.collection("quizzes").document(username)
    user_quiz_data = quiz_doc_ref.get().to_dict() or {}
    if roadmap_id not in user_quiz_data:
        raise HTTPException(status_code=404, detail="Roadmap ID not found")

    roadmap_dict = user_quiz_data[roadmap_id]
    quiz_data = roadmap_dict.get(quiz_id)
    if not quiz_data:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if quiz_data.get("submitted"):
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    # ----------- SCORE CALCULATION ----------- #
    questions = quiz_data.get("questions", [])
    total_questions = len(questions)
    score_per_question = 100 / total_questions if total_questions else 0
    total_score = 0.0

    for q_idx, q in enumerate(questions):
        correct = str(q.get("answer", "")).strip().lower()
        user_ans = str(user_answers_dict.get(str(q_idx), "")).strip().lower()
        if user_ans == correct:
            total_score += score_per_question

    total_score = round(total_score, 2)
    passed = total_score >= PASS_THRESHOLD

    # ----------- UPDATE QUIZ DATA ----------- #
    quiz_data.update({
        "score": total_score,
        "user_answers": user_answers_dict,
        "submitted": True,
        "submitted_at": date.today().isoformat()
    })
    roadmap_dict[quiz_id] = quiz_data

    # ----------- METRICS LOGIC ----------- #
    current_stage = roadmap_dict.get("current_stage", 1)
    metrics_list = roadmap_dict.get("metrics", [])
    existing_metric = next((m for m in metrics_list if m.get("stage") == current_stage), None)

    if existing_metric:
        total_attempts = existing_metric["attempts"] + 1
        new_avg_score = round(
            ((existing_metric["average_score"] * existing_metric["attempts"]) + total_score) / total_attempts, 2
        )
        existing_metric.update({
            "attempts": total_attempts,
            "average_score": new_avg_score,
            "last_score": total_score,
            "passed": passed
        })
    else:
        metrics_list.append({
            "stage": current_stage,
            "attempts": 1,
            "average_score": total_score,
            "last_score": total_score,
            "passed": passed
        })
    roadmap_dict["metrics"] = metrics_list

    # ----------- USER DATA FETCH ----------- #
    user_ref = db.collection("users").document(username)
    user_doc = user_ref.get().to_dict() or {}
    streak = user_doc.get("streak", 0)
    reward_points = user_doc.get("reward_points", 0)

    # ----------- STAGE PROGRESSION + REWARDS ----------- #
    roadmap_doc = db.collection("roadmaps").document(username).get()
    total_stages = 0
    if roadmap_doc.exists:
        roadmap_list = roadmap_doc.to_dict().get("roadmaps", [])
        roadmap_info = next((r for r in roadmap_list if r["roadmap_id"] == roadmap_id), None)
        if roadmap_info:
            total_stages = len(roadmap_info.get("roadmap", {}).get("plan", []))

    roadmap_completed = False
    message = ""

    if passed:
        # Reward for passing the quiz
        reward_points += REWARD_PASS
        streak += 1

        # Every 3rd successful quiz gives a bonus
        if streak % 3 == 0:
            reward_points += REWARD_STREAK_3

        # Check if last stage completed
        if current_stage < total_stages:
            roadmap_dict["current_stage"] = current_stage + 1
            message = f"Quiz passed! Proceeding to Stage {current_stage + 1}."
        else:
            roadmap_dict["current_stage"] = total_stages
            reward_points += MAJOR_REWARD_FOR_COMPLETING_ROADMAP
            roadmap_completed = True
            message = "🎉 Congratulations! You've completed your entire roadmap journey!"
    else:
        # Reset streak on failure
        streak = 0
        message = "Quiz failed. Try again to proceed!"
        roadmap_dict["current_stage"] = current_stage

    # ----------- SAVE CHANGES TO FIRESTORE ----------- #
    user_quiz_data[roadmap_id] = roadmap_dict
    quiz_doc_ref.set(user_quiz_data)

    user_ref.update({
        "streak": streak,
        "reward_points": reward_points
    })

    # ----------- FINAL RESPONSE ----------- #
    return {
        "status": "success",
        "message": message,
        "score": total_score,
        "passed": passed,
        "current_stage": roadmap_dict["current_stage"],
        "total_stages": total_stages,
        "streak": streak,
        "reward_points": reward_points,
        "metrics": metrics_list,
        "roadmap_completed": roadmap_completed
    }


# QUIZ RETRIEVAL ROUTE (Fixed Order + Stage from DB)
@router.get("/{roadmap_id}/")
async def get_quizzes(roadmap_id: str, authorization: str = Header(...)):
    username = get_current_user(authorization)

    # Fetch user's quiz data document
    user_quiz_doc_data = get_user_quiz_document(username)

    # If user has never taken a quiz for this roadmap
    if not user_quiz_doc_data or roadmap_id not in user_quiz_doc_data:
        return {
            "message": "No quizzes found for this roadmap",
            "current_stage": 0,
            "response": [],
            "metrics": []
        }

    roadmap_data = user_quiz_doc_data.get(roadmap_id, {})

    current_stage = roadmap_data.get("current_stage", 0)
    metrics_data = roadmap_data.get("metrics", [])

    all_quizzes_list = [
        quiz for quiz in roadmap_data.values()
        if isinstance(quiz, dict) and "quiz_id" in quiz
    ]

    def sort_key(q):
        stage = q.get("stage", 0)
        attempt = q.get("attempt", 0)
        return (stage, attempt)

    all_quizzes_list.sort(key=sort_key)

    return {
        "message": "Quizzes retrieved successfully",
        "current_stage": current_stage,
        "response": all_quizzes_list,
        "metrics": metrics_data
    }


# GET SINGLE QUIZ ROUTE (Based on roadmap_id and quiz_id)
@router.get("/{roadmap_id}/{quiz_id}/")
async def get_single_quiz(roadmap_id: str, quiz_id: str, authorization: str = Header(...)):
    username = get_current_user(authorization)

    # Fetch user's quiz data
    user_quiz_doc_data = get_user_quiz_document(username)
    if not user_quiz_doc_data or roadmap_id not in user_quiz_doc_data:
        raise HTTPException(status_code=404, detail="No quizzes found for this roadmap")

    roadmap_data = user_quiz_doc_data.get(roadmap_id, {})
    quiz_data = roadmap_data.get(quiz_id)

    if not quiz_data or not isinstance(quiz_data, dict):
        raise HTTPException(status_code=404, detail="Quiz not found")

    current_stage = roadmap_data.get("current_stage", 0)
    metrics_data = roadmap_data.get("metrics", [])

    return {
        "message": "Quiz retrieved successfully",
        "roadmap_id": roadmap_id,
        "quiz_id": quiz_id,
        "current_stage": current_stage,
        "response": quiz_data,
        "metrics": metrics_data
    }
