
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from models.budget_response_optimizer import optimize_budget


# FastAPI application
app = FastAPI(
    title="Campaign Budget Optimizer API",
    description="AI-powered campaign budget allocation API",
    version="0.1.0"
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
     allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://campaign-budget-optimizer-cznq.vercel.app",
    ],
    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request model
class BudgetRequest(BaseModel):
    total_budget: float = Field(
        ge=10000,
        le=60000,
        description="Total campaign budget"
    )

    market: str = Field(
        default="Global",
        description="Campaign market: India or Global"
    )


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "Campaign Budget Optimizer API is running"
    }


# Optimization endpoint
@app.post("/optimize")
def optimize(request: BudgetRequest):
    # Validate market
    if request.market not in ["India", "Global"]:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="Market must be either India or Global"
        )

    # Run optimizer
    allocation, predictions, total_revenue = optimize_budget(
        request.total_budget,
        market=request.market
    )

    # Return result
    return {
        "total_budget": request.total_budget,
        "market": request.market,
        "allocation": allocation,
        "predicted_revenue": predictions,
        "total_predicted_revenue": total_revenue
    }
