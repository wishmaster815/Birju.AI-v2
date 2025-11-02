from fastapi import APIRouter, Request, HTTPException, Header
from datetime import datetime, timedelta
from src.llms.google_llm import GoogleLLM
from src.nodes.roadmap_node import RoadmapNode
from src.firestore_db import db
from src.utils import get_current_user
import uuid

router = APIRouter(prefix="/roadmap", tags=["roadmap"])

# --- Initialize Google Gemini LLM ---
llm_obj = GoogleLLM()
llm_model = llm_obj.get_model(model_name="gemini-2.5-flash")  # ✅ use Gemini
roadmap_node = RoadmapNode(llm_model)  # ✅ Node using Gemini model


# --- HELPER FUNCTION ---
def calculate_status(roadmap: dict) -> str:
    start_date_str = roadmap.get("start_date")
    duration = roadmap.get("duration", 0)

    try:
        duration = int(duration)
    except (TypeError, ValueError):
        duration = 0

    if not start_date_str:
        return "active"

    try:
        if "T" in start_date_str:
            start_date = datetime.fromisoformat(start_date_str)
        else:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    except ValueError:
        return "active"

    end_date = start_date + timedelta(days=duration)
    now = datetime.utcnow()
    return "passive" if now.date() > end_date.date() else "active"


# --- GENERATE NEW ROADMAP ---
@router.post("/generate/")
async def generate_roadmap(request: Request, authorization: str = Header(...)):
    """
    Generate a personalized roadmap using Gemini LLM (no LangGraph / Groq).
    """
    username = get_current_user(authorization)
    data = await request.json()

    role = data.get("role")
    level = data.get("level", "Beginner")
    skills = data.get("skills", [])
    duration = data.get("duration", 30)

    # --- Validate required inputs ---
    if not role or not skills:
        raise HTTPException(status_code=400, detail="Both 'role' and 'skills' are required")

    try:
        duration = int(duration)
    except (TypeError, ValueError):
        duration = 30

    # --- Create state dict for LLM ---
    state = {
        "roadmap_id": str(uuid.uuid4()),
        "role": role,
        "level": level,
        "skills": skills,
        "duration": duration,
        "roadmap": None,
        "status": None,
    }

    # --- Generate roadmap via Gemini ---
    try:
        updated_state = roadmap_node.generate_roadmap(state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating roadmap: {str(e)}")

    # --- Convert roadmap object to dict ---
    if updated_state.get("roadmap"):
        updated_state["roadmap"] = updated_state["roadmap"].dict()

    updated_state["start_date"] = datetime.utcnow().date().isoformat()
    updated_state["status"] = calculate_status(updated_state)

    # --- Store in Firestore ---
    doc_ref = db.collection("roadmaps").document(username)
    doc = doc_ref.get()
    existing_roadmaps = doc.to_dict().get("roadmaps", []) if doc.exists else []
    existing_roadmaps.append(updated_state)

    doc_ref.set({
        "user_id": username,
        "roadmaps": existing_roadmaps
    })

    return {
        "message": "Roadmap generated successfully",
        "response": updated_state
    }

# RETRIEVE ALL ROADMAPS
@router.get("/")
async def get_roadmaps(authorization: str = Header(...)):
    username = get_current_user(authorization)
    doc = db.collection("roadmaps").document(username).get()
    if not doc.exists:
        return {"message": "No roadmap found", "roadmaps": []}

    roadmap_data = doc.to_dict()
    return {"message": "Roadmaps retrieved successfully", "response": roadmap_data.get("roadmaps", [])}

# RETRIEVE SINGLE ROADMAP
@router.get("/single/{roadmap_id}/")
async def get_single_roadmap(roadmap_id: str, authorization: str = Header(...)):
    """
    Retrieve a specific roadmap by its ID for the authenticated user.
    """
    username = get_current_user(authorization)
    doc_ref = db.collection("roadmaps").document(username)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="No roadmap found for this user")

    roadmap_list = doc.to_dict().get("roadmaps", [])
    roadmap = next((r for r in roadmap_list if r.get("roadmap_id") == roadmap_id), None)

    if not roadmap:
        raise HTTPException(status_code=404, detail="Specified roadmap not found")

    return {"message": "Roadmap retrieved successfully", "response": roadmap}

# DELETE SINGLE ROADMAP (ALONG WITH QUIZZES)
@router.delete("/{roadmap_id}/")
async def delete_roadmap(roadmap_id: str, authorization: str = Header(...)):
    """
    Delete a roadmap by its ID for the authenticated user
    and also remove all quizzes associated with that roadmap.
    """
    username = get_current_user(authorization)

    doc_ref = db.collection("roadmaps").document(username)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="No roadmap found for this user")

    roadmap_list = doc.to_dict().get("roadmaps", [])
    updated_roadmaps = [r for r in roadmap_list if r.get("roadmap_id") != roadmap_id]

    if len(roadmap_list) == len(updated_roadmaps):
        raise HTTPException(status_code=404, detail="Specified roadmap not found")

    doc_ref.update({"roadmaps": updated_roadmaps})

    # ---------- DELETE QUIZZES LINKED TO ROADMAP ----------
    quiz_doc_ref = db.collection("quizzes").document(username)
    quiz_doc = quiz_doc_ref.get()

    if quiz_doc.exists:
        quiz_data = quiz_doc.to_dict()

        if roadmap_id in quiz_data:
            # Remove quizzes related to this roadmap_id
            del quiz_data[roadmap_id]
            quiz_doc_ref.set(quiz_data)

    return {"message": "Roadmap and its quizzes deleted successfully"}
