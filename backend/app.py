from fastapi import FastAPI
from src.routers.users import router as user_router
from src.routers.roadmap import router as roadmap_router
from src.routers.quiz import router as quiz_router
from src.routers.counsel import router as counsel_router

from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(redirect_slashes=True)

origins = [
    "*",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "https://birju-frontend-2.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(roadmap_router)
app.include_router(quiz_router)
app.include_router(counsel_router)


# @app.get("/")
# async def root():
#     return {"message": "BirjuRam AI backend running successfully 🚀"}


@app.api_route("/", methods=["GET", "HEAD"], tags=["Health"])
def root():
    return {"message": "Backend running successfully"}


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8080)
