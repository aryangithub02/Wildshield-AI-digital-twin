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
    is_intrusion = meta.get("intrusion", True) and inside_geofence
    
    # Calculate Threat Level & Deterrence Response from taxonomy matrix
    if not is_intrusion and meta.get("domain") not in ["Human", "Vehicle"]:
        threat_level = "LOW"
        threat_reason = f"{species} outside protected crop perimeter."
        action = "Log Only"
        actuators = {"siren": False, "floodlight": False, "predator_speaker": False, "sprinkler": False, "speaker": False}
        behaviour_activity = "Passing perimeter boundary"
        possible_damage = "None"
        risk_score = 15
    else:
        threat_level = base_threat
        threat_reason = f"{species} detected inside protected area ({zone}). Threat score: {base_threat}."
        action = meta.get("recommended_action") or ", ".join(meta.get("responses", ["Warning"]))
        actuators = meta.get("actuators", {"siren": False, "floodlight": False, "predator_speaker": False, "sprinkler": False})
        behaviour_activity = f"Active in {zone}"
        possible_damage = meta.get("description", "Potential crop activity")
        risk_score = int(confidence * 100) if threat_level in ["CRITICAL", "HIGH"] else int(confidence * 70)

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
