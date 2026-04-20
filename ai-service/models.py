from pydantic import BaseModel
from typing import Optional


class RecommendRequest(BaseModel):
    user_id: str
    top_n: int = 20


class SkillRecommendation(BaseModel):
    skill_id:            str
    user_id:             str
    user_name:           str
    user_avatar:         Optional[str]
    user_reputation:     int
    skill_title:         str
    skill_description:   str
    skill_category:      str
    proficiency_level:   str
    match_score:         float   # 0–100
    match_reason:        str
    content_score:       float   # TF-IDF cosine
    collaborative_score: float   # SVD latent space
    trust_score:         float   # PageRank


class RecommendResponse(BaseModel):
    user_id:          str
    recommendations:  list[SkillRecommendation]
    ai_available:     bool = True


class MatchScoreResponse(BaseModel):
    user_a: str
    user_b: str
    score:  float
    reason: str


class InsightResponse(BaseModel):
    user_id:               str
    trending_categories:   list[str]
    skill_gap_suggestions: list[str]
    your_unique_skills:    list[str]
    demand_areas:          list[str]
