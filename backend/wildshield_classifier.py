"""
WildShield AI — Classifier, Taxonomy & Threat Response Engine
Conforms to WILDSHIELD_ID_SPECIFICATION_REPORT.md
"""

from typing import Dict, List, Any, Optional
import datetime

# Master taxonomy and response rules
SPECIES_CONFIG = {
    "Wild Boar": {
        "code": "WS-WL-WB",
        "domain": "Wildlife",
        "scientific_name": "Sus scrofa",
        "emoji": "🐗",
        "threat": "HIGH",
        "intrusion": True,
        "responses": ["Siren", "Floodlight"],
        "actuators": {"siren": True, "floodlight": True, "speaker": True, "sprinkler": False},
        "description": "Wild Boar breach detected. High risk of crop damage.",
        "risk_level": "CRITICAL"
    },
    "Nilgai": {
        "code": "WS-WL-NG",
        "domain": "Wildlife",
        "scientific_name": "Boselaphus tragocamelus",
        "emoji": "🐂",
        "threat": "MEDIUM",
        "intrusion": True,
        "responses": ["Floodlight", "Alarm"],
        "actuators": {"siren": False, "floodlight": True, "speaker": True, "sprinkler": False},
        "description": "Nilgai / Blue Bull detected. Grazing risk in crop fields.",
        "risk_level": "WARNING"
    },
    "Spotted Deer": {
        "code": "WS-WL-SD",
        "domain": "Wildlife",
        "scientific_name": "Axis axis",
        "emoji": "🦌",
        "threat": "MEDIUM",
        "intrusion": True,
        "responses": ["Floodlight", "Alarm"],
        "actuators": {"siren": False, "floodlight": True, "speaker": True, "sprinkler": False},
        "description": "Spotted Deer (Chital) detected. Herbivore crop grazing threat.",
        "risk_level": "WARNING"
    },
    "Rhesus Macaque": {
        "code": "WS-WL-RM",
        "domain": "Wildlife",
        "scientific_name": "Macaca mulatta",
        "emoji": "🐒",
        "threat": "LOW",
        "intrusion": True,
        "responses": ["Sprinkler", "Warning"],
        "actuators": {"siren": False, "floodlight": False, "speaker": False, "sprinkler": True},
        "description": "Rhesus Macaque troop detected. Fruit and crop plucking risk.",
        "risk_level": "MODERATE"
    },
    "Langur": {
        "code": "WS-WL-LG",
        "domain": "Wildlife",
        "scientific_name": "Semnopithecus entellus",
        "emoji": "🐒",
        "threat": "LOW",
        "intrusion": True,
        "responses": ["Sprinkler", "Warning"],
        "actuators": {"siren": False, "floodlight": False, "speaker": False, "sprinkler": True},
        "description": "Gray Langur detected in perimeter canopy.",
        "risk_level": "MODERATE"
    },
    "Gaur": {
        "code": "WS-WL-GR",
        "domain": "Wildlife",
        "scientific_name": "Bos gaurus",
        "emoji": "🦬",
        "threat": "HIGH",
        "intrusion": True,
        "responses": ["Siren", "Floodlight"],
        "actuators": {"siren": True, "floodlight": True, "speaker": True, "sprinkler": True},
        "description": "Indian Bison / Gaur detected. Severe structural perimeter risk.",
        "risk_level": "CRITICAL"
    },
    "Cattle": {
        "code": "WS-DM-CT",
        "domain": "Domestic",
        "scientific_name": "Bos taurus",
        "emoji": "🐄",
        "threat": "LOW",
        "intrusion": False,
        "responses": ["Sprinkler", "Warning"],
        "actuators": {"siren": False, "floodlight": False, "speaker": True, "sprinkler": True, "buzzer": True},
        "description": "Domestic / Stray Cattle detected. Non-hostile deterrent.",
        "risk_level": "LOW"
    },
    "Goat": {
        "code": "WS-DM-GT",
        "domain": "Domestic",
        "scientific_name": "Capra hircus",
        "emoji": "🐐",
        "threat": "LOW",
        "intrusion": False,
        "responses": ["Warning"],
        "actuators": {"siren": False, "floodlight": False, "speaker": False, "sprinkler": False, "buzzer": True},
        "description": "Domestic livestock (Goat/Sheep) detected near boundary.",
        "risk_level": "LOW"
    },
    "Human": {
        "code": "WS-HM-HM",
        "domain": "Human",
        "scientific_name": "Homo sapiens",
        "emoji": "🚶",
        "threat": "LOW",
        "intrusion": False,
        "responses": ["Security Alert"],
        "actuators": {"siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
        "description": "Human detected in surveillance zone.",
        "risk_level": "ALERT"
    },
    "Vehicle": {
        "code": "WS-VH-VH",
        "domain": "Vehicle",
        "scientific_name": "Automobile",
        "emoji": "🚜",
        "threat": "LOW",
        "intrusion": False,
        "responses": ["Log Only"],
        "actuators": {"siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
        "description": "Farm vehicle / Tractor in transit.",
        "risk_level": "SAFE"
    }
}

DEFAULT_CONFIG = {
    "code": "WS-WL-UN",
    "domain": "Wildlife",
    "scientific_name": "Unknown species",
    "emoji": "🐾",
    "threat": "LOW",
    "intrusion": True,
    "responses": ["Warning"],
    "actuators": {"siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
    "description": "Unclassified entity detected by surveillance model.",
    "risk_level": "WARNING"
}

def get_species_metadata(class_name: str) -> Dict[str, Any]:
    """Retrieve metadata and deterrence protocol for a recognized YOLO class name."""
    for key, val in SPECIES_CONFIG.items():
        if key.lower() == class_name.lower():
            return {**val, "name": key}
        
    for key, val in SPECIES_CONFIG.items():
        if key.lower() in class_name.lower() or class_name.lower() in key.lower():
            return {**val, "name": key}
            
    return {**DEFAULT_CONFIG, "name": class_name}

def format_detection_payload(
    detection_id: str,
    class_name: str,
    confidence: float,
    bbox: List[float],
    normalized_bbox: List[float],
    camera_id: str = "FN-1",
    node_name: str = "North Field",
    img_width: int = 640,
    img_height: int = 640
) -> Dict[str, Any]:
    """Format single detection to standard WildShield JSON schema."""
    meta = get_species_metadata(class_name)
    now = datetime.datetime.now()
    
    return {
        "detection_id": detection_id,
        "class": meta["name"],
        "code": meta["code"],
        "domain": meta["domain"],
        "scientific_name": meta["scientific_name"],
        "emoji": meta["emoji"],
        "confidence": round(confidence, 4),
        "confidence_pct": round(confidence * 100, 1),
        "threat": meta["threat"],
        "risk_level": meta["risk_level"],
        "intrusion": meta["intrusion"],
        "responses": meta["responses"],
        "actuators": meta["actuators"],
        "description": meta["description"],
        "bbox": [round(coord, 2) for coord in bbox], # [x1, y1, x2, y2]
        "normalized_bbox": [round(coord, 4) for coord in normalized_bbox],
        "camera_id": camera_id,
        "node_name": node_name,
        "timestamp": now.isoformat(),
        "time_formatted": now.strftime("%I:%M:%S %p"),
        "date_formatted": now.strftime("%d %b %Y")
    }
