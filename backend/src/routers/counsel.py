from fastapi import APIRouter, HTTPException, Request, Header
# from src.llms.groq_llm import GroqLLM  # <-- REMOVED
from src.llms.google_llm import GoogleLLM # <-- ADDED
from src.nodes.career_node import CareerNode
from src.firestore_db import db
from src.utils import get_current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/career", tags=["career"])

# --- NEW CORRECTED CODE ---
# This matches the final version of GoogleLLM
llm_obj = GoogleLLM()
llm_model = llm_obj.get_model(model_name="gemini-2.5-flash") 
# --------------------------


# GENERATE NEW COUNSEL REPORT 
@router.post("/counsel/")
async def counsel_student(request: Request, authorization: str = Header(...)):
    # ... (user_input setup) ...
    username = get_current_user(authorization)
    data = await request.json()
    user_input = {
        "education": data.get("education"),
        "field": data.get("field"),
        "skills": data.get("skills"),
        "intent": data.get("intent"),
        "target_role":data.get("target_role")
    }
    
    try:
        # --- This must pass the 'llm_model' ---
        career_node = CareerNode(llm_model) 
        counseling_report = career_node.generate_guidance(user_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ... (Rest of your endpoint) ...
    timestamp = datetime.utcnow().date().isoformat()
    report_data = {
        "counsel_id": str(uuid.uuid4()),
        "created_at": timestamp,
        "input": user_input,
        "report": counseling_report
    }
    doc_ref = db.collection("career_reports").document(username)
    doc = doc_ref.get()
    if doc.exists:
        reports = doc.to_dict().get("reports", [])
    else:
        reports = []
    reports.append(report_data)
    doc_ref.set({
        "user_id": username,
        "reports": reports
    })
    return {
        "message": "Career counseling completed successfully",
        "response": report_data
    }

# RETRIEVE ALL COUNSEL REPORTS 
@router.get("/")
async def get_counsel_reports(authorization: str = Header(...)):
    username = get_current_user(authorization)

    doc = db.collection("career_reports").document(username).get()
    if not doc.exists:
        return {"message": "No counseling reports found", "reports": []}

    data = doc.to_dict()
    return {
        "message": "Counseling reports retrieved successfully",
        "reports": data.get("reports", [])
    }


# RETRIEVE SINGLE COUNSEL REPORT
@router.get("/{counsel_id}/")
async def get_single_counsel_report(counsel_id: str, authorization: str = Header(...)):
    username = get_current_user(authorization)
    doc_ref = db.collection("career_reports").document(username)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="No counseling reports found for this user")

    reports = doc.to_dict().get("reports", [])
    report = next((r for r in reports if r.get("counsel_id") == counsel_id), None)

    if not report:
        raise HTTPException(status_code=404, detail="Specified counseling report not found")

    return {
        "message": "Counseling report retrieved successfully",
        "response": report
    }


# DELETE SINGLE COUNSEL REPORT 
@router.delete("/{counsel_id}/")
async def delete_counsel_report(counsel_id: str, authorization: str = Header(...)):
    username = get_current_user(authorization)
    doc_ref = db.collection("career_reports").document(username)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="No counseling reports found for this user")

    reports = doc.to_dict().get("reports", [])
    updated_reports = [r for r in reports if r.get("counsel_id") != counsel_id]

    if len(reports) == len(updated_reports):
        raise HTTPException(status_code=404, detail="Specified counseling report not found")

    doc_ref.update({"reports": updated_reports})

    return {"message": "Counseling report deleted successfully"}