from fastapi import APIRouter, HTTPException, Header
from src.states.user_state import User, UserResponse
from src.firestore_db import db
from src.utils import create_access_token, get_current_user
import bcrypt

router = APIRouter(prefix="/users", tags=["Users"])

# hash password
def encrypt_password(password: str):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

# verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# CREATE NEW USER
@router.post("/create/", response_model=UserResponse)
async def create_user(user: User):
    user_ref = db.collection("users")
    if user_ref.where("email", "==", user.email.lower()).limit(1).get():
        raise HTTPException(status_code=400, detail="Email already exists!")
    if user_ref.where("username", "==", user.username.lower()).limit(1).get():
        raise HTTPException(status_code=400, detail="Username already exists!")

    user_doc = {
        "username": user.username,
        "email": user.email.lower(),
        "password": encrypt_password(user.password),
        "reward_points": 0,
        "streak": 0
    }

    user_ref.document(user.username).set(user_doc)

    return UserResponse(
        message="User Created Successfully!",
        username=user_doc["username"],
        email=user_doc["email"],
        reward_points=user_doc["reward_points"],
        streak=user_doc["streak"]
    )

# Login user (return only access token)
@router.post("/login/")
async def login_user(user: User):
    user_ref = db.collection("users")
    query = None
    if user.email:
        query = user_ref.where("email", "==", user.email.lower()).limit(1).get()
    elif user.username:
        query = user_ref.where("username", "==", user.username).limit(1).get()

    if not query:
        raise HTTPException(status_code=400, detail="User not found")

    existing_user = query[0].to_dict()
    username = existing_user["username"]

    if "password" not in existing_user or not verify_password(user.password, existing_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    access_token = create_access_token({"username": username})

    return {
        "message": "Login successful!",
        "access_token": access_token
    }

# Get user details
@router.get("/user-details/")
async def get_user_details(authorization: str = Header(...)):
    username = get_current_user(authorization)

    user_doc = db.collection("users").document(username).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    data = user_doc.to_dict()
    return {
        "username": data["username"],
        "email": data["email"],
        "reward_points": data.get("reward_points", 0),
        "streak": data.get("streak", 0)
    }
