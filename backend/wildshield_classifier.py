"""
WildShield AI — Classifier, Taxonomy & Threat Response Engine
Conforms to WILDSHIELD_ID_SPECIFICATION_REPORT.md
"""

from typing import Dict, List, Any, Optional
import datetime

# Master taxonomy and response rules conforming strictly to animal_action_matrix
SPECIES_CONFIG = {
    "Wild Boar": {
        "code": "WS-WL-WB",
        "domain": "Wildlife",
        "scientific_name": "Sus scrofa",
        "emoji": "🐗",
        "threat": "HIGH",
        "intrusion": True,
        "recommended_action": "Siren + Floodlight",
        "responses": ["Siren", "Floodlight"],
        "actuators": {"siren": True, "floodlight": True, "speaker": False, "predator_speaker": False, "sprinkler": False},
        "description": "Wild Boar breach detected. Recommended action: Siren + Floodlight.",
        "risk_level": "HIGH"
    },
    "Nilgai": {
        "code": "WS-WL-NG",
        "domain": "Wildlife",
        "scientific_name": "Boselaphus tragocamelus",
        "emoji": "🐂",
        "threat": "HIGH",
        "intrusion": True,
        "recommended_action": "Floodlight + Siren",
        "responses": ["Floodlight", "Siren"],
        "actuators": {"siren": True, "floodlight": True, "speaker": False, "predator_speaker": False, "sprinkler": False},
        "description": "Nilgai detected. Recommended action: Floodlight + Siren.",
        "risk_level": "HIGH"
    },
    "Spotted Deer": {
        "code": "WS-WL-SD",
        "domain": "Wildlife",
        "scientific_name": "Axis axis",
        "emoji": "🦌",
        "threat": "MEDIUM",
        "intrusion": True,
        "recommended_action": "Floodlight + Mild Alarm",
        "responses": ["Floodlight", "Mild Alarm"],
        "actuators": {"siren": True, "floodlight": True, "speaker": False, "predator_speaker": False, "sprinkler": False},
        "description": "Spotted Deer detected. Recommended action: Floodlight + Mild Alarm.",
        "risk_level": "MEDIUM"
    },
    "Rhesus Macaque": {
        "code": "WS-WL-RM",
        "domain": "Wildlife",
        "scientific_name": "Macaca mulatta",
        "emoji": "🐒",
        "threat": "HIGH",
        "intrusion": True,
        "recommended_action": "Predator Audio + Floodlight",
        "responses": ["Predator Audio", "Floodlight"],
        "actuators": {"siren": False, "floodlight": True, "speaker": True, "predator_speaker": True, "sprinkler": False},
        "description": "Rhesus Macaque troop detected. Recommended action: Predator Audio + Floodlight.",
        "risk_level": "HIGH"
    },
    "Langur": {
        "code": "WS-WL-LG",
        "domain": "Wildlife",
        "scientific_name": "Semnopithecus entellus",
        "emoji": "🐒",
        "threat": "MEDIUM",
        "intrusion": True,
        "recommended_action": "Predator Audio + Floodlight",
        "responses": ["Predator Audio", "Floodlight"],
        "actuators": {"siren": False, "floodlight": True, "speaker": True, "predator_speaker": True, "sprinkler": False},
        "description": "Gray Langur detected. Recommended action: Predator Audio + Floodlight.",
        "risk_level": "MEDIUM"
    },
    "Gaur": {
        "code": "WS-WL-GR",
        "domain": "Wildlife",
        "scientific_name": "Bos gaurus",
        "emoji": "🦬",
        "threat": "CRITICAL",
        "intrusion": True,
        "recommended_action": "Siren + Floodlight + Farmer Alert",
        "responses": ["Siren", "Floodlight", "Farmer Alert"],
        "actuators": {"siren": True, "floodlight": True, "speaker": False, "predator_speaker": False, "sprinkler": False},
        "description": "Indian Bison / Gaur detected. Recommended action: Siren + Floodlight + Farmer Alert.",
        "risk_level": "CRITICAL"
    },
    "Cattle": {
        "code": "WS-DM-CT",
        "domain": "Domestic",
        "scientific_name": "Bos taurus",
        "emoji": "🐄",
        "threat": "LOW",
        "intrusion": False,
        "recommended_action": "Farmer Notification Only",
        "responses": ["Farmer Notification Only"],
        "actuators": {"siren": False, "floodlight": False, "speaker": False, "predator_speaker": False, "sprinkler": False},
        "description": "Domestic Cattle detected. Recommended action: Farmer Notification Only.",
        "risk_level": "LOW"
    },
    "Goat": {
        "code": "WS-DM-GT",
        "domain": "Domestic",
        "scientific_name": "Capra hircus",
        "emoji": "🐐",
        "threat": "LOW",
        "intrusion": False,
        "recommended_action": "Farmer Notification Only",
        "responses": ["Farmer Notification Only"],
        "actuators": {"siren": False, "floodlight": False, "speaker": False, "predator_speaker": False, "sprinkler": False},
        "description": "Domestic Goat detected. Recommended action: Farmer Notification Only.",
        "risk_level": "LOW"
    },
    "Human": {
        "code": "WS-SEC-HM",
        "domain": "Human",
        "scientific_name": "Homo sapiens",
        "emoji": "🚶",
        "threat": "CRITICAL",
        "intrusion": True,
        "recommended_action": "Emergency Farmer Alert + Floodlight",
        "responses": ["Emergency Farmer Alert", "Floodlight"],
        "actuators": {"siren": False, "floodlight": True, "speaker": False, "predator_speaker": False, "sprinkler": False},
        "description": "Human security detection. Recommended action: Emergency Farmer Alert + Floodlight.",
        "risk_level": "CRITICAL"
    },
    "Vehicle": {
        "code": "WS-SEC-VE",
        "domain": "Vehicle",
        "scientific_name": "Automobile",
        "emoji": "🚜",
        "threat": "MEDIUM",
        "intrusion": False,
        "recommended_action": "Warning + Farmer Alert",
        "responses": ["Warning", "Farmer Alert"],
        "actuators": {"siren": True, "floodlight": True, "speaker": False, "predator_speaker": False, "sprinkler": False},
        "description": "Vehicle detection. Recommended action: Warning + Farmer Alert.",
        "risk_level": "MEDIUM"
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
