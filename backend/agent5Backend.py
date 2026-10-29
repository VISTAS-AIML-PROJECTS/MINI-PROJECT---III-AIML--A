from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from agent5 import router as agent5_router


app = FastAPI()


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Handle browser preflight requests
@app.options("/{path:path}")
async def options_handler(path: str, request: Request):
    return {
        "status": "ok"
    }


# Agent 5 routes
app.include_router(
    agent5_router,
    prefix="/api/agent5"
)


@app.get("/")
def home():
    return {
        "message": "Agent 5 Backend is Running!"
    }