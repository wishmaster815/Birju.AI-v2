from typing import TypedDict, Optional
from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import date

class Stage(BaseModel):
    overview_stage: str = Field(description="The stage of the roadmap (e.g., Beginner, Intermediate, Advanced)")
    skills: List[str] = Field(description="List of skills to acquire at this stage")
    actions: List[str] = Field(description="Practical actions, exercises, or projects for this stage")

class Plan(BaseModel):
    stage:int = Field(description="Week number of the roadmap")
    approx_days:int = Field(description="Extimated number of days to complete the stage")
    focus:List[str] = Field(description="Skills/topics covered in this week")

class Roadmap(BaseModel):
    overview_stages: List[Stage] = Field(description="A structured roadmap with progressive stages")
    plan: List[Plan] = Field(description="stage-by-stage plan")

class RoadmapState(TypedDict):
    roadmap_id:str
    start_date:date
    role: str
    level: str
    skills: List[str]
    duration:int
    roadmap: List[Optional[Roadmap]]
    status: str

class QuizQuestion(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(description="List of 4 answer options")
    answer: str = Field(description="Correct answer option (A/B/C/D)")

# for submission of quiz (used in routing)
class QuizSubmission(BaseModel):
    username:str
    week: int
    answers: Dict[str, str]