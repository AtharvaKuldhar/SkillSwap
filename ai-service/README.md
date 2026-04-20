# SkillSwap AI Service

Standalone Python microservice providing hybrid skill recommendations to the SkillSwap platform.

## Architecture

```
Browser → Node.js (:5000) → Python FastAPI (:8000) → PostgreSQL (Neon)
```

All requests from the frontend go through the Node backend (which holds the JWT auth layer). The Node backend proxies AI calls to this service via `/api/ai/*`.

## Algorithm Overview

The engine is a **three-signal hybrid recommendation system**:

| Signal | Technique | Weight |
|---|---|---|
| Content similarity | TF-IDF (bigrams, sublinear TF) + Cosine Similarity | **50%** |
| Collaborative filtering | Truncated SVD on user-skill interaction matrix | **30%** |
| Trust scoring | Weighted PageRank on the trade/review graph | **20%** |

### Content-Based Filtering
Skill titles, descriptions, and categories are vectorised using `TfidfVectorizer` with bigram support and `sublinear_tf=True` (log dampening). Expert-level skills have their title/category repeated to increase their signal weight in the TF-IDF space. Cosine similarity is computed between each user's aggregate skill vector and all other skills.

### Collaborative Filtering
A `User × Skill` interaction matrix is built from completed trade history (with review ratings as values). `TruncatedSVD` decomposes this into `k=10` latent dimensions, capturing implicit preference patterns not visible in text alone. In the latent space, cosine similarity surfaces skills popular among users with similar trading histories.

### Trust Scoring (PageRank)
A directed weighted graph is constructed: nodes = users, edges = completed trades, edge weight = `review_rating / 5`. NetworkX `pagerank(alpha=0.85)` computes a trust score for each user reflecting their reputation in the community's trade network. This boosts recommendations from high-trust users.

### Explainability
The top-3 TF-IDF terms contributing to the content score are extracted and returned as a `match_reason` string e.g. *"Aligned in python, machine learning, and backend"*.

## Setup

```bash
cd ai-service

# Copy env
cp .env.example .env  # then fill in DATABASE_URL

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# or: source venv/bin/activate  (macOS/Linux)

# Install dependencies
pip install -r requirements.txt

# Start the service
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check + model status |
| `POST` | `/recommend` | Ranked skill feed for a user |
| `GET` | `/match-score/{a}/{b}` | Bidirectional compatibility score |
| `GET` | `/skill-insights/{userId}` | Skill gap analysis + trending categories |
| `POST` | `/retrain` | Re-train model from latest DB data (async) |

Interactive API docs available at `http://localhost:8000/docs` (Swagger UI).

## Notes

- The model is re-trained **on every startup** from fresh database data.
- Call `POST /retrain` after a burst of new users/skills/trades to refresh recommendations without restarting the service.
- Collaborative filtering degrades gracefully when trade history is sparse — the engine falls back to pure content similarity.
