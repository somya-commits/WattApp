
from fastapi import FastAPI
from pydantic import BaseModel
from recommendation import generate_recommendations

app = FastAPI(title="WattWise AI Recommendation API")


class EnergyData(BaseModel):
    average_power: float
    daily_energy: float
    monthly_energy: float
    target_percentage: float


@app.get("/")
def home():
    return {
        "message": "WattWise AI Recommendation API is running"
    }


@app.post("/recommend")
def recommend(data: EnergyData):

    recommendations = generate_recommendations(
        data.average_power,
        data.daily_energy,
        data.monthly_energy,
        data.target_percentage
    )

    return {
        "success": True,
        "recommendations": recommendations
    }
