from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str

class UserResponse(BaseModel):
    # message : Optional[str] = None
    username: str
    email: EmailStr
    reward_points: int
    streak: int