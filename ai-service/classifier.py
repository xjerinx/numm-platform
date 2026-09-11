import os
import csv
import numpy as np
from typing import Dict, Any, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

UNSPSC_REFERENCE: List[Dict[str, str]] = []
_vectorizer = None
_unspsc_matrix = None

DEFAULT_UNSPSC_SAMPLES = [
    {"code": "41115202", "name": "Feed horns", "class": "41115200", "desc": "radar sonar feed horns transmission horn microwave waveguide antenna"},
    {"code": "31111513", "name": "Stainless steel profile extrusions", "class": "31111500", "desc": "stainless steel profile extrusions 316l metal channel structural rod"},
    {"code": "41111711", "name": "Electron microscopes", "class": "41111700", "desc": "transmission scanning electron microscope tem sem laboratory optical"},
    {"code": "47101502", "name": "Ammonia removal equipment", "class": "47101500", "desc": "ammonia removal scrubber stripping absorption column gas cleaning"},
    {"code": "40151735", "name": "Pump column assembly", "class": "40151700", "desc": "pump column vertical turbine centrifugal pump column assembly casing"},
    {"code": "31111904", "name": "Permanent magnets", "class": "31111900", "desc": "ferrous magnet alnico neodymium rare earth magnet magnetic assembly"},
    {"code": "41112401", "name": "Air velocity monitors", "class": "41112400", "desc": "air velocity and temperature monitors anemometer pitot tube airflow measuring"},
    {"code": "40141604", "name": "Industrial ball valves", "class": "40141600", "desc": "flanged stainless steel ball valve high pressure shutoff valve"},
    {"code": "39121406", "name": "Electrical junction boxes", "class": "39121400", "desc": "flameproof explosion proof terminal electrical junction box enclosure"},
    {"code": "23151507", "name": "Centrifugal gas compressor rotor", "class": "23151500", "desc": "gas compressor rotor impeller shaft turbine high speed compression"},
    {"code": "44121708", "name": "Highlighters and markers", "class": "44121700", "desc": "highlighters markers writing office stationary pens fluorescent marker"},
    {"code": "40151503", "name": "Centrifugal pumps", "class": "40151500", "desc": "horizontal end suction multistage centrifugal water industrial pump"}
]

def load_unspsc_reference():
    global UNSPSC_REFERENCE, _vectorizer, _unspsc_matrix
    if UNSPSC_REFERENCE:
        return

    csv_paths = [
        os.path.join(os.path.dirname(__file__), "../backend/data/unspsc_trimmed.csv"),
        os.path.join(os.path.dirname(__file__), "../data/unspsc_trimmed.csv"),
    ]

    loaded = []
    for p in csv_paths:
        if os.path.exists(p):
            try:
                with open(p, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for i, row in enumerate(reader):
                        if i >= 1500:
                            break
                        commodity = row.get("Commodity") or ""
                        name = row.get("Commodity Name") or ""
                        cls_code = row.get("Class") or ""
                        seg_name = row.get("Segment Name") or ""
                        if commodity and name:
                            loaded.append({
                                "code": commodity,
                                "name": name,
                                "class": cls_code,
                                "desc": f"{name} {seg_name} {row.get('Family Name', '')}".lower()
                            })
                print(f"[OK] Loaded {len(loaded)} UNSPSC commodities from CSV reference.")
                break
            except Exception as e:
                print(f"[WARN] Error reading UNSPSC CSV: {e}")

    UNSPSC_REFERENCE = loaded if loaded else DEFAULT_UNSPSC_SAMPLES

    descriptions = [f"{item['name']} {item.get('desc', '')}" for item in UNSPSC_REFERENCE]
    _vectorizer = TfidfVectorizer(ngram_range=(1, 2), token_pattern=r"(?u)\b\w+\b")
    _unspsc_matrix = _vectorizer.fit_transform(descriptions)


def classify_material_description(description: str) -> Dict[str, Any]:
    load_unspsc_reference()

    if not description or not description.strip():
        return {
            "unspsc_code": "40151700",
            "unspsc_name": "General Industrial Equipment",
            "unspsc_class": "40151700",
            "confidence_score": 0.50
        }

    query_vec = _vectorizer.transform([description.lower()])
    scores = cosine_similarity(query_vec, _unspsc_matrix)[0]

    best_idx = int(np.argmax(scores))
    best_score = float(scores[best_idx])
    best_match = UNSPSC_REFERENCE[best_idx]

    conf = min(0.98, max(0.55, best_score * 1.5))

    return {
        "unspsc_code": best_match["code"],
        "unspsc_name": best_match["name"],
        "unspsc_class": best_match.get("class") or best_match["code"][:6] + "00",
        "confidence_score": round(conf, 2)
    }
