"""
SkillSwap AI Microservice — FastAPI Entry Point
================================================
Hybrid recommendation engine exposed as a REST API.

Endpoints:
  GET  /health                       — liveness + model status
  POST /recommend                    — personalised skill feed for a user
  GET  /match-score/{userA}/{userB}  — bidirectional compatibility score
  GET  /skill-insights/{userId}      — skill gap analysis + trending categories
  POST /retrain                      — re-train model from live DB data (async)
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from db import fetch_all
from models import InsightResponse, MatchScoreResponse, RecommendRequest, RecommendResponse
from recommender import SkillRecommender

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Global recommender instance ───────────────────────────────────────────────
recommender = SkillRecommender()


def load_and_train() -> None:
    """
    Pull the latest data from PostgreSQL and re-fit the recommender.
    Called on startup and optionally via POST /retrain.
    """
    try:
        skills = fetch_all(
            '''SELECT id, title, description, category,
                      "proficiencyLevel" AS proficiency_level, "userId" AS user_id
               FROM "Skill"'''
        )
        users = fetch_all(
            '''SELECT id, name, email, location, avatar,
                      "reputationPoints" AS reputation_points,
                      "timeCredits"      AS time_credits
               FROM "User"'''
        )
        trades = fetch_all(
            '''SELECT tr.id,
                      tr."requesterId"      AS requester_id,
                      tr."receiverId"       AS receiver_id,
                      tr."offeredSkillId"   AS offered_skill_id,
                      tr."requestedSkillId" AS requested_skill_id,
                      tr.status,
                      r.rating
               FROM "TradeRequest" tr
               LEFT JOIN "Review" r ON r."tradeId" = tr.id'''
        )

        logger.info(
            "Fetched from DB — skills: %d, users: %d, trades: %d",
            len(skills), len(users), len(trades),
        )
        recommender.fit(skills, users, trades)
        logger.info("Recommender fitted successfully (is_fitted=%s)", recommender.is_fitted)
    except Exception as exc:
        logger.error("Training failed: %s", exc, exc_info=True)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SkillSwap AI Service …")
    load_and_train()
    yield
    logger.info("AI Service shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SkillSwap AI Recommendation Service",
    description=(
        "Hybrid recommendation engine combining:\n"
        "• TF-IDF content-based filtering (skill text similarity)\n"
        "• Truncated SVD collaborative filtering (trade history patterns)\n"
        "• PageRank trust scoring (weighted trade/review graph)"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("NODE_BACKEND_URL", "http://localhost:5000"),
        "http://localhost:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Liveness check — also reports whether the model is fitted."""
    return {
        "status":      "ok",
        "is_fitted":   recommender.is_fitted,
        "skill_count": len(recommender._skills_df) if recommender._skills_df is not None else 0,
        "user_count":  len(recommender._users_df)  if recommender._users_df  is not None else 0,
    }


@app.post("/recommend", response_model=RecommendResponse)
def get_recommendations(request: RecommendRequest):
    """
    Return skills ranked by hybrid match score for the given user.
    Skills already owned by the user are excluded.
    Response is sorted descending by match_score (0–100).
    """
    try:
        results = recommender.recommend(request.user_id, top_n=request.top_n)
        return RecommendResponse(
            user_id=request.user_id,
            recommendations=results,
            ai_available=recommender.is_fitted,
        )
    except Exception as exc:
        logger.error("Recommend error for user %s: %s", request.user_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/match-score/{user_a}/{user_b}", response_model=MatchScoreResponse)
def get_match_score(user_a: str, user_b: str):
    """
    Bidirectional compatibility score between two users.
    Uses geometric mean of (A wants B's skills) × (B wants A's skills)
    so that one-sided interest scores significantly lower.
    """
    try:
        result = recommender.match_score(user_a, user_b)
        return MatchScoreResponse(user_a=user_a, user_b=user_b, **result)
    except Exception as exc:
        logger.error("Match-score error (%s, %s): %s", user_a, user_b, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/skill-insights/{user_id}", response_model=InsightResponse)
def get_skill_insights(user_id: str):
    """
    Personalised skill intelligence for a user:
    • trending_categories   — most offered by the community
    • skill_gap_suggestions — trending categories the user doesn't offer
    • your_unique_skills    — rare categories where the user stands out
    • demand_areas          — categories most requested in completed trades
    """
    try:
        result = recommender.skill_insights(user_id)
        return InsightResponse(user_id=user_id, **result)
    except Exception as exc:
        logger.error("Insights error for user %s: %s", user_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/retrain")
def retrain(background_tasks: BackgroundTasks):
    """
    Re-train the model from the latest database state.
    Runs in the background so the endpoint returns immediately.
    """
    background_tasks.add_task(load_and_train)
    return {"message": "Retraining started in background"}
