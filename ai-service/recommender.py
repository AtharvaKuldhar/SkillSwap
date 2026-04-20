"""
SkillSwap Hybrid Recommendation Engine
=======================================

Three-signal fusion architecture:

  1. Content-Based Filtering (TF-IDF + Cosine Similarity)
     ‑ Skill titles, descriptions, and categories are vectorised using TF-IDF
       with bigram support and sublinear term-frequency dampening.
     ‑ Cosine similarity between a user's skill vector and every other skill
       determines content affinity.  Max-pooling across a user's own skills
       ensures the best overlap is captured.

  2. Collaborative Filtering (Truncated SVD / Matrix Factorisation)
     ‑ A User x Skill interaction matrix is built from completed trade history.
       Cell values = review rating (1-5) if reviewed, else 1.0 for completed.
     ‑ Truncated SVD decomposes this matrix into latent skill and user factors.
     ‑ In the latent space, cosine similarity between the target user's row
       and all skill rows surfaces implicit preference patterns not visible
       in skill text alone.

  3. Graph-Based Trust Scoring (PageRank)
     ‑ A weighted directed graph is built: nodes = users,
       edges = completed trades weighted by review rating / 5.
     ‑ NetworkX PageRank (α = 0.85) assigns each user a trust score reflecting
       their standing in the community's trade network.
     ‑ Skills offered by high-trust users receive a proportional boost.

Score Fusion (weighted linear combination):
  final_score = 0.50 × content_score
              + 0.30 × collaborative_score
              + 0.20 × trust_score

Explainability:
  The top-N TF-IDF terms driving the cosine similarity between the user's
  aggregate skill vector and the target skill are extracted and returned as a
  human-readable "Why this match?" string.
"""

from __future__ import annotations

import logging
from typing import Optional

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
PROFICIENCY_WEIGHT: dict[str, float] = {
    "beginner":     0.60,
    "intermediate": 0.80,
    "advanced":     0.90,
    "expert":       1.00,
}

SCORE_WEIGHTS = {"content": 0.50, "collaborative": 0.30, "trust": 0.20}
SVD_COMPONENTS = 10          # latent dimensions for collaborative filtering
PAGERANK_ALPHA  = 0.85       # damping factor
TOP_TERMS       = 3          # number of explanation terms to surface


class SkillRecommender:
    """
    Hybrid recommendation engine: TF-IDF content filtering +
    SVD collaborative filtering + PageRank trust scoring.
    """

    def __init__(self) -> None:
        self._tfidf = TfidfVectorizer(
            max_features=800,
            stop_words="english",
            ngram_range=(1, 2),    # unigrams + bigrams
            sublinear_tf=True,     # log(1 + tf) dampening
            min_df=1,
        )
        self._tfidf_matrix    = None
        self._svd             = None
        self._skill_latent    = None  # (n_skills, k)
        self._user_latent     = None  # (n_users,  k)
        self._trust_scores:    dict[str, float] = {}
        self._skills_df:       Optional[pd.DataFrame] = None
        self._users_df:        Optional[pd.DataFrame] = None
        self._trades_df:       Optional[pd.DataFrame] = None
        self._skill_idx:       dict[str, int] = {}
        self._user_idx:        dict[str, int] = {}
        self.is_fitted         = False

    # ── Corpus construction ───────────────────────────────────────────────────

    def _build_corpus(self, skills: list[dict]) -> list[str]:
        """
        Convert a skill record into a weighted text document.
        Title and category are repeated proportional to proficiency weight so
        that expert-level skills carry more signal in the TF-IDF space.
        """
        docs: list[str] = []
        for s in skills:
            level  = (s.get("proficiency_level") or "").lower()
            weight = PROFICIENCY_WEIGHT.get(level, 0.75)
            reps   = max(1, round(weight * 3))

            title    = " ".join([s.get("title", "")] * reps)
            category = " ".join([s.get("category", "")] * 2)
            desc     = s.get("description", "")

            doc = f"{title} {category} {desc}".strip()
            docs.append(doc if doc else " ")
        return docs

    # ── Interaction matrix ────────────────────────────────────────────────────

    def _build_interaction_matrix(self) -> Optional[np.ndarray]:
        """
        Build an (n_users × n_skills) interaction matrix from completed trades.
        Rating values are used when available; default is 3.0 (midpoint).
        """
        if self._trades_df is None or self._trades_df.empty:
            return None
        n_u = len(self._users_df)
        n_s = len(self._skills_df)
        if n_u < 2 or n_s < 2:
            return None

        mat = np.zeros((n_u, n_s), dtype=np.float32)
        completed = self._trades_df[self._trades_df["status"] == "COMPLETED"]

        for _, t in completed.iterrows():
            req_i     = self._user_idx.get(str(t["requester_id"]))
            rec_i     = self._user_idx.get(str(t["receiver_id"]))
            offered_i = self._skill_idx.get(str(t["offered_skill_id"]))
            wanted_i  = self._skill_idx.get(str(t["requested_skill_id"]))
            rating    = float(t.get("rating") or 3.0)

            if req_i is not None and wanted_i is not None:
                mat[req_i, wanted_i] = max(mat[req_i, wanted_i], rating)
            if rec_i is not None and offered_i is not None:
                mat[rec_i, offered_i] = max(mat[rec_i, offered_i], rating)

        return mat

    # ── Trust graph ───────────────────────────────────────────────────────────

    def _build_trust_graph(self) -> dict[str, float]:
        """
        Construct a weighted directed trade graph and run PageRank.
        Edge weight = review_rating / 5 (capped at 1.0).
        Falls back to uniform 0.5 for all users if graph is trivial.
        """
        G = nx.DiGraph()
        if self._users_df is not None:
            for uid in self._users_df["id"].tolist():
                G.add_node(str(uid))

        if self._trades_df is not None and not self._trades_df.empty:
            completed = self._trades_df[self._trades_df["status"] == "COMPLETED"]
            for _, t in completed.iterrows():
                req = str(t["requester_id"])
                rec = str(t["receiver_id"])
                w   = float(t.get("rating") or 3.0) / 5.0

                for src, dst in [(req, rec), (rec, req)]:
                    if G.has_edge(src, dst):
                        G[src][dst]["weight"] = (G[src][dst]["weight"] + w) / 2
                    else:
                        G.add_edge(src, dst, weight=w)

        if len(G.nodes) == 0:
            return {}

        try:
            pr = nx.pagerank(G, alpha=PAGERANK_ALPHA, weight="weight", max_iter=300)
        except nx.PowerIterationFailedConvergence:
            logger.warning("PageRank did not converge – using uniform trust")
            pr = {n: 1.0 / len(G.nodes) for n in G.nodes}

        # Normalise to [0, 1]
        vals = list(pr.values())
        lo, hi = min(vals), max(vals)
        if hi - lo > 1e-9:
            pr = {k: (v - lo) / (hi - lo) for k, v in pr.items()}
        else:
            pr = {k: 0.5 for k in pr}

        return pr

    # ── Fit ───────────────────────────────────────────────────────────────────

    def fit(self, skills: list[dict], users: list[dict], trades: list[dict]) -> None:
        """Re-train the recommender on fresh data from the database."""
        if not skills:
            self.is_fitted = False
            logger.warning("No skills available – recommender not fitted")
            return

        self._skills_df = pd.DataFrame(skills)
        self._users_df  = pd.DataFrame(users) if users else pd.DataFrame(columns=["id"])
        self._trades_df = pd.DataFrame(trades) if trades else pd.DataFrame()

        self._skill_idx = {str(s["id"]): i for i, s in enumerate(skills)}
        self._user_idx  = {str(u["id"]): i for i, u in enumerate(users)} if users else {}

        # ── Step 1: TF-IDF ────────────────────────────────────────────
        corpus            = self._build_corpus(skills)
        self._tfidf_matrix = self._tfidf.fit_transform(corpus)
        logger.info("TF-IDF matrix: %s", self._tfidf_matrix.shape)

        # ── Step 2: Collaborative Filtering (SVD) ─────────────────────
        mat = self._build_interaction_matrix()
        if mat is not None:
            n_comp = min(SVD_COMPONENTS, mat.shape[0] - 1, mat.shape[1] - 1)
            if n_comp >= 1:
                self._svd          = TruncatedSVD(n_components=n_comp, random_state=42)
                self._skill_latent = self._svd.fit_transform(mat.T)  # (n_skills, k)
                self._user_latent  = self._svd.components_.T          # (n_users,  k)
                expl = self._svd.explained_variance_ratio_.sum()
                logger.info("SVD: %d components, %.1f%% variance explained", n_comp, expl * 100)

        # ── Step 3: PageRank Trust Scores ─────────────────────────────
        self._trust_scores = self._build_trust_graph()
        logger.info("PageRank computed for %d users", len(self._trust_scores))

        self.is_fitted = True

    # ── Score helpers ─────────────────────────────────────────────────────────

    def _content_scores(self, user_skill_idxs: list[int]) -> np.ndarray:
        """Max-pool cosine similarity from all user skills to every other skill."""
        n = len(self._skills_df)
        if not user_skill_idxs or self._tfidf_matrix is None:
            return np.zeros(n)
        user_vecs = self._tfidf_matrix[user_skill_idxs]
        sim = cosine_similarity(user_vecs, self._tfidf_matrix)  # (m, n)
        return sim.max(axis=0)                                   # best match per skill

    def _collaborative_scores(self, user_id: str) -> np.ndarray:
        """Cosine similarity in SVD latent space between user and all skills."""
        n = len(self._skills_df)
        if self._skill_latent is None or self._user_latent is None:
            return np.zeros(n)
        u_idx = self._user_idx.get(str(user_id))
        if u_idx is None or u_idx >= self._user_latent.shape[0]:
            return np.zeros(n)
        if self._skill_latent.shape[0] != n:
            return np.zeros(n)

        u_vec  = self._user_latent[u_idx].reshape(1, -1)
        sims   = cosine_similarity(u_vec, self._skill_latent)[0]
        lo, hi = sims.min(), sims.max()
        if hi - lo > 1e-9:
            sims = (sims - lo) / (hi - lo)
        return sims

    # ── Explainability ────────────────────────────────────────────────────────

    def _top_terms(self, user_skill_idxs: list[int], target_idx: int) -> list[str]:
        """Extract top TF-IDF terms contributing to content similarity."""
        if not user_skill_idxs or self._tfidf_matrix is None:
            return []
        features    = self._tfidf_vectorizer_feature_names()
        user_vec    = np.asarray(self._tfidf_matrix[user_skill_idxs].mean(axis=0))
        target_vec  = np.asarray(self._tfidf_matrix[target_idx].todense())
        contrib     = np.multiply(user_vec, target_vec).flatten()
        top_idxs    = contrib.argsort()[-TOP_TERMS:][::-1]
        return [features[i] for i in top_idxs if contrib[i] > 1e-8]

    def _tfidf_vectorizer_feature_names(self) -> np.ndarray:
        return self._tfidf.get_feature_names_out()

    def _reason_string(self, terms: list[str], score: float) -> str:
        if not terms:
            return ("High compatibility across skill areas" if score > 0.65
                    else "Compatible skill profiles" if score > 0.35
                    else "Potential exchange opportunity")
        if len(terms) == 1:
            return f"Shared expertise in {terms[0]}"
        if len(terms) == 2:
            return f"Matched on {terms[0]} and {terms[1]}"
        return f"Aligned in {terms[0]}, {terms[1]}, and {terms[2]}"

    # ── Public API ────────────────────────────────────────────────────────────

    def recommend(self, user_id: str, top_n: int = 20) -> list[dict]:
        """
        Return the top-N skills ranked by hybrid match score for *user_id*.
        Skills owned by *user_id* are excluded.
        """
        if not self.is_fitted or self._skills_df is None:
            return []

        user_mask       = self._skills_df["user_id"].astype(str) == str(user_id)
        user_skill_idxs = self._skills_df.index[user_mask].tolist()
        other_mask      = ~user_mask
        other_df        = self._skills_df[other_mask]

        if other_df.empty:
            return []

        n_all   = len(self._skills_df)
        c_scores  = self._content_scores(user_skill_idxs)
        cf_scores = self._collaborative_scores(user_id)

        results: list[dict] = []
        for idx, row in other_df.iterrows():
            owner_id = str(row["user_id"])
            c  = float(c_scores[idx])
            cf = float(cf_scores[idx])
            t  = float(self._trust_scores.get(owner_id, 0.5))

            score = (SCORE_WEIGHTS["content"]       * c +
                     SCORE_WEIGHTS["collaborative"]  * cf +
                     SCORE_WEIGHTS["trust"]          * t)

            terms  = self._top_terms(user_skill_idxs, idx)
            reason = self._reason_string(terms, c)

            u_row  = self._users_df[self._users_df["id"].astype(str) == owner_id]
            u_info = u_row.iloc[0].to_dict() if not u_row.empty else {}

            results.append({
                "skill_id":            str(row["id"]),
                "user_id":             owner_id,
                "user_name":           u_info.get("name", "Unknown"),
                "user_avatar":         u_info.get("avatar"),
                "user_reputation":     int(u_info.get("reputation_points", 0) or 0),
                "skill_title":         str(row["title"]),
                "skill_description":   str(row["description"]),
                "skill_category":      str(row["category"]),
                "proficiency_level":   str(row["proficiency_level"]),
                "match_score":         round(score * 100, 1),
                "match_reason":        reason,
                "content_score":       round(c  * 100, 1),
                "collaborative_score": round(cf * 100, 1),
                "trust_score":         round(t  * 100, 1),
            })

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results[:top_n]

    def match_score(self, user_a_id: str, user_b_id: str) -> dict:
        """Bidirectional compatibility between two users (geometric mean)."""
        if not self.is_fitted or self._skills_df is None:
            return {"score": 0.0, "reason": "No data available"}

        mask_a = self._skills_df["user_id"].astype(str) == str(user_a_id)
        mask_b = self._skills_df["user_id"].astype(str) == str(user_b_id)
        idx_a  = self._skills_df.index[mask_a].tolist()
        idx_b  = self._skills_df.index[mask_b].tolist()

        if not idx_a or not idx_b:
            return {"score": 0.0, "reason": "One or both users have no skills listed"}

        a_to_all = self._content_scores(idx_a)
        b_to_all = self._content_scores(idx_b)

        a_wants_b = float(np.mean([a_to_all[i] for i in idx_b]))
        b_wants_a = float(np.mean([b_to_all[i] for i in idx_a]))

        # Geometric mean rewards mutual interest; one-sided matches score lower
        bidir  = float(np.sqrt(a_wants_b * b_wants_a))
        terms  = self._top_terms(idx_a, idx_b[0]) if idx_b else []
        return {
            "score":  round(bidir * 100, 1),
            "reason": self._reason_string(terms, bidir),
        }

    def skill_insights(self, user_id: str) -> dict:
        """Skill gap analysis, trending categories, and demand areas for a user."""
        if not self.is_fitted or self._skills_df is None:
            return {
                "trending_categories":   [],
                "skill_gap_suggestions": [],
                "your_unique_skills":    [],
                "demand_areas":          [],
            }

        user_skills  = self._skills_df[self._skills_df["user_id"].astype(str) == str(user_id)]
        other_skills = self._skills_df[self._skills_df["user_id"].astype(str) != str(user_id)]
        user_cats    = set(user_skills["category"].str.lower().tolist())

        # Trending: most offered categories by others
        trending: list[str] = []
        if not other_skills.empty:
            counts   = other_skills["category"].value_counts()
            trending = [c for c in counts.index.tolist()[:7] if c.lower() not in user_cats]

        # Skill gap = trending categories the user doesn't offer
        gap = trending[:3]

        # Unique = user's categories not offered by anyone else
        other_cats = set(other_skills["category"].str.lower().tolist()) if not other_skills.empty else set()
        unique     = [c for c in user_cats if c not in other_cats]

        # Demand = categories most requested in completed trades
        demand: list[str] = []
        if self._trades_df is not None and not self._trades_df.empty:
            comp = self._trades_df[self._trades_df["status"] == "COMPLETED"]
            if not comp.empty and "requested_skill_id" in comp.columns:
                top_ids          = comp["requested_skill_id"].value_counts().index[:5]
                demanded_skills  = self._skills_df[self._skills_df["id"].astype(str).isin(top_ids.astype(str))]
                demand           = demanded_skills["category"].unique().tolist()[:3]

        return {
            "trending_categories":   trending[:5],
            "skill_gap_suggestions": gap,
            "your_unique_skills":    unique[:3],
            "demand_areas":          demand,
        }
