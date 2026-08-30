"""
WildShield AI — Autonomous AI Threat & Decision Engine
Evaluates species, geofence status, zone risk, and calculates deterrence actions.
"""

from typing import Dict, Any, List, Tuple
from backend.wildshield_classifier import get_species_metadata


def evaluate_decision(
    species: str,
    confidence: float,
    inside_geofence: bool = True,
    zone: str = "North Field",
    is_night: bool = True
) -> Dict[str, Any]:
    """
    Generate deterministic, rule-based AI decisions based on detected species,
    geofence position, and farm zone sensitivity.
    """
    meta = get_species_metadata(species)
    base_threat = meta.get("threat", "LOW")
    risk_level = meta.get("risk_level", "MODERATE")
    is_wildlife = meta.get("domain") == "Wildlife"

    # Geofence & Zone risk weighting
    is_intrusion = is_wildlife and inside_geofence
    
    # Calculate Threat Level
    if not is_intrusion:
        threat_level = "LOW"
        threat_reason = f"{species} outside protected crop perimeter or non-threatening."
        action = "Log Only"
        actuators = {"siren": False, "floodlight": False, "speaker": False, "sprinkler": False}
        behaviour_activity = "Passing perimeter boundary"
        possible_damage = "None"
        risk_score = 15
    else:
        if base_threat == "HIGH":
            threat_level = "CRITICAL" if confidence >= 0.85 else "HIGH"
            threat_reason = f"{species} detected inside protected crop area ({zone}) with high breach risk."
            action = "Siren + Floodlight"
            actuators = {"siren": True, "floodlight": True, "speaker": True, "sprinkler": False}
            behaviour_activity = "Moving toward central crop zone"
            possible_damage = "Severe crop root destruction and trampling"
            risk_score = int(confidence * 100)
        elif base_threat == "MEDIUM":
            threat_level = "MEDIUM"
            threat_reason = f"{species} grazing near {zone} buffer boundary."
            action = "Floodlight + Speaker"
            actuators = {"siren": False, "floodlight": True, "speaker": True, "sprinkler": False}
            behaviour_activity = "Grazing on boundary foliage"
            possible_damage = "Foliage and sapling damage"
            risk_score = int(confidence * 80)
        else: # LOW wildlife (e.g. Macaque, Langur)
            threat_level = "LOW"
            threat_reason = f"{species} active near orchard canopy."
            action = "Sprinkler + Warning Buzzer"
            actuators = {"siren": False, "floodlight": False, "speaker": False, "sprinkler": True}
            behaviour_activity = "Foraging in canopy"
            possible_damage = "Fruit and pod plucking"
            risk_score = 40

    return {
        "threat_level": threat_level,
        "threat_reason": threat_reason,
        "action": action,
        "actuators": actuators,
        "is_intrusion": is_intrusion,
        "behaviour": {
            "activity": behaviour_activity,
            "possible_damage": possible_damage,
            "risk_score": risk_score
        }
    }
