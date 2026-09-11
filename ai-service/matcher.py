import re
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import os
import certifi
os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['CURL_CA_BUNDLE'] = certifi.where()

_transformer_model = None
_model_name = "all-MiniLM-L6-v2"

def get_transformer_model():
    global _transformer_model
    if _transformer_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print(f"[INFO] Loading SentenceTransformer model: {_model_name}...")
            _transformer_model = SentenceTransformer(_model_name)
            print("[OK] SentenceTransformer loaded successfully.")
        except Exception as e:
            print(f"[WARN] Could not load SentenceTransformer ({e}). Using Scikit-Learn TF-IDF Engine.")
            _transformer_model = False
    return _transformer_model if _transformer_model is not False else None


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip().lower()


def compute_similarity_matrix(descriptions_a: List[str], descriptions_b: List[str]) -> np.ndarray:
    model = get_transformer_model()
    if model is not None:
        try:
            emb_a = model.encode(descriptions_a, convert_to_tensor=False, show_progress_bar=False)
            emb_b = model.encode(descriptions_b, convert_to_tensor=False, show_progress_bar=False)
            return cosine_similarity(emb_a, emb_b)
        except Exception as e:
            print(f"[WARN] Transformer inference error: {e}. Falling back to TF-IDF.")

    # Scikit-Learn TF-IDF fallback
    vectorizer = TfidfVectorizer(ngram_range=(1, 3), token_pattern=r"(?u)\b\w+\b")
    all_texts = [clean_text(t) for t in descriptions_a + descriptions_b]
    if not any(all_texts):
        return np.zeros((len(descriptions_a), len(descriptions_b)))
    
    vectorizer.fit(all_texts)
    vec_a = vectorizer.transform([clean_text(t) for t in descriptions_a])
    vec_b = vectorizer.transform([clean_text(t) for t in descriptions_b])
    return cosine_similarity(vec_a, vec_b)


def match_descriptions(
    queries: List[Dict[str, Any]], 
    catalog: List[Dict[str, Any]], 
    top_k: int = 5
) -> List[Dict[str, Any]]:
    if not queries or not catalog:
        return []

    query_texts = [q.get("description", "") for q in queries]
    catalog_texts = [c.get("description", "") for c in catalog]

    sim_matrix = compute_similarity_matrix(query_texts, catalog_texts)
    results = []

    for i, q in enumerate(queries):
        scores = sim_matrix[i]
        top_indices = np.argsort(scores)[::-1][:top_k]

        matches = []
        for idx in top_indices:
            score = float(scores[idx])
            if score > 0.0:
                cat_item = catalog[idx]
                matches.append({
                    "id": cat_item.get("id"),
                    "cpse_code": cat_item.get("cpse_code"),
                    "material_number": cat_item.get("material_number"),
                    "description": cat_item.get("description"),
                    "similarity_score": round(score, 4),
                })

        results.append({
            "query_id": q.get("id"),
            "query_description": q.get("description"),
            "query_cpse": q.get("cpse_code"),
            "matches": matches,
        })

    return results


def detect_cross_cpse_duplicates(
    materials: List[Dict[str, Any]], 
    threshold: float = 0.6
) -> List[Dict[str, Any]]:
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for m in materials:
        cls_code = m.get("unspscClass") or m.get("unspsc_class") or "40151700"
        groups.setdefault(cls_code, []).append(m)

    duplicate_pairs = []

    for cls_code, group in groups.items():
        if len(group) < 2:
            continue

        descriptions = [m.get("description", "") for m in group]
        sim_matrix = compute_similarity_matrix(descriptions, descriptions)

        n = len(group)
        for i in range(n):
            for j in range(i + 1, n):
                mat_a = group[i]
                mat_b = group[j]

                # Cross-CPSE pairs
                if mat_a.get("cpseCode") != mat_b.get("cpseCode"):
                    score = float(sim_matrix[i][j])
                    if score >= threshold:
                        seq = abs(hash(f"{mat_a.get('id')}_{mat_b.get('id')}")) % 9000 + 1000
                        suggested_nmc = f"NMC-{cls_code[:8]}-{seq}"

                        duplicate_pairs.append({
                            "material_a_id": mat_a.get("id"),
                            "material_a_cpse": mat_a.get("cpseCode"),
                            "material_a_number": mat_a.get("materialNumber"),
                            "material_a_desc": mat_a.get("description"),
                            "material_b_id": mat_b.get("id"),
                            "material_b_cpse": mat_b.get("cpseCode"),
                            "material_b_number": mat_b.get("materialNumber"),
                            "material_b_desc": mat_b.get("description"),
                            "similarity": round(score, 4),
                            "similarity_pct": int(round(score * 100)),
                            "unspsc_class": cls_code,
                            "suggested_nmc": suggested_nmc,
                            "status": "PENDING"
                        })

    duplicate_pairs.sort(key=lambda x: x["similarity"], reverse=True)
    return duplicate_pairs
