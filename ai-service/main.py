import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any

from matcher import match_descriptions, detect_cross_cpse_duplicates, get_transformer_model
from classifier import classify_material_description

app = FastAPI(
    title="NUMM AI Matching & Deduplication Microservice",
    description="Microservice powering sentence-transformers embeddings, UNSPSC zero-shot classification, and cross-CPSE duplicate detection for the National Unified Material Master.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MaterialItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    cpseCode: Optional[str] = Field(None, alias="cpse_code")
    materialNumber: Optional[str] = Field(None, alias="material_number")
    description: str
    unspscClass: Optional[str] = Field(None, alias="unspsc_class")

class MatchRequest(BaseModel):
    queries: List[MaterialItem]
    catalog: Optional[List[MaterialItem]] = None
    top_k: Optional[int] = 5

class ClassifyRequest(BaseModel):
    description: str

class DuplicateRequest(BaseModel):
    materials: List[Dict[str, Any]]
    threshold: Optional[float] = 0.60

class GenerateNmcRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    unspscClass: str = Field(..., alias="unspsc_class")
    sequenceNumber: Optional[int] = Field(None, alias="sequence_number")


@app.get("/health")
def health_check():
    model_active = get_transformer_model() is not None
    return {
        "status": "HEALTHY",
        "service": "NUMM FastAPI AI Service",
        "engine": "SentenceTransformer (all-MiniLM-L6-v2)" if model_active else "Scikit-Learn TF-IDF Cosine",
        "version": "1.0.0"
    }


@app.post("/match")
def match_materials(req: MatchRequest):
    queries_dict = [q.model_dump(by_alias=False) for q in req.queries]
    catalog_dict = [c.model_dump(by_alias=False) for c in req.catalog] if req.catalog else queries_dict
    
    matches = match_descriptions(queries_dict, catalog_dict, top_k=req.top_k or 5)
    return {
        "count": len(matches),
        "results": matches
    }


@app.post("/classify")
def classify_material(req: ClassifyRequest):
    result = classify_material_description(req.description)
    return result


@app.post("/detect-duplicates")
def detect_duplicates(req: DuplicateRequest):
    pairs = detect_cross_cpse_duplicates(req.materials, threshold=req.threshold or 0.60)
    return {
        "duplicate_pairs": pairs,
        "count": len(pairs),
        "threshold": req.threshold or 0.60
    }


@app.post("/generate-nmc")
def generate_nmc(req: GenerateNmcRequest):
    cls_clean = req.unspscClass.replace("-", "").strip()
    if len(cls_clean) < 8:
        cls_clean = cls_clean.ljust(8, "0")
    else:
        cls_clean = cls_clean[:8]

    seq = req.sequenceNumber or (abs(hash(req.unspscClass + str(os.urandom(4)))) % 9000 + 1000)
    nmc_code = f"NMC-{cls_clean}-{seq:04d}"

    return {
        "nmc_code": nmc_code,
        "unspsc_class": cls_clean,
        "sequence_number": seq,
        "format": "NMC-{UNSPSC_CLASS}-{SEQUENCE_NUMBER}"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
