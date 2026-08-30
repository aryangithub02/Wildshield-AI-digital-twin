# WildShield AI — Animal Behaviour, Farm Impact & Detection Knowledge Base

**Document Version:** 2.0.0  
**Target:** WildShield AI Edge Inference Engine & Autonomous Agricultural Protection Digital Twin  
**Reference Sources:** Wildlife Institute of India (WII) Human-Wildlife Conflict Literature, Animal Diversity Web (ADW), WildShield Edge Telemetry Benchmark.

---

## 1. Animal Classification & Farm Threat Master Matrix

| Code | Animal / Entity | Scientific Name | Type | Farm Threat | Activity Period | Typical Farm Impact | Suggested Deterrent Policy |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **`WS-WL-WB`** | **Wild Boar** | *Sus scrofa* | Wildlife | 🔴 High | Crepuscular / Night | Soil excavation, root/tuber eating, direct grain damage, repeated nocturnal raiding | `Geofence = TRUE` $\rightarrow$ High Threat $\rightarrow$ Siren + LED Floodlight $\rightarrow$ Farmer Alert |
| **`WS-WL-NG`** | **Nilgai** | *Boselaphus tragocamelus* | Wildlife | 🔴 High | Early Morning & Late Afternoon | Cereal & pulse crop grazing, vegetable feeding, structural crop trampling | `Geofence = TRUE` $\rightarrow$ High Threat $\rightarrow$ Directional Floodlight + Acoustic Alarm |
| **`WS-WL-SD`** | **Spotted Deer** | *Axis axis* | Wildlife | 🟠 Medium | Crepuscular / Variable | Herbaceous grazing, young shoot consumption, localized trampling | `Geofence = TRUE` $\rightarrow$ Medium Threat $\rightarrow$ Soft Floodlight + Alarm (Avoid siren panic) |
| **`WS-WL-RM`** | **Rhesus Macaque** | *Macaca mulatta* | Wildlife | 🔴 High | Diurnal (Daytime) | Orchard fruit plucking, stem breaking, destructive troop raiding | `Troop Size > 1` $\rightarrow$ High Threat $\rightarrow$ Sprinkler Guard + Distress Acoustic Call |
| **`WS-WL-LG`** | **Langur** | *Semnopithecus entellus* | Wildlife | 🟠 Med–High | Diurnal (Daytime) | Leaf stripping, blossom damage, canopy fruit raids, fence passage | `Geofence = TRUE` $\rightarrow$ Medium Threat $\rightarrow$ Overhead Sprinkler + Visual Strobe Flash |
| **`WS-WL-GR`** | **Gaur** | *Bos gaurus* | Wildlife | 🔴 Very High | Morning / Evening / Night | Heavy crop biomass consumption, fence flattening, severe human safety risk | `Very High Threat` $\rightarrow$ **Do NOT approach** $\rightarrow$ Non-contact deterrent $\rightarrow$ Forest Dept Alert |
| **`WS-DM-CT`** | **Cattle** | *Bos taurus / indicus* | Domestic | 🟡 Medium | Daytime grazing | Casual grazing on young crops, minor trampling, boundary passage | `Domestic Control` $\rightarrow$ Low Threat $\rightarrow$ Sprinkler / Warning Buzzer (Siren Inhibit) |
| **`WS-DM-GT`** | **Goat** | *Capra hircus* | Domestic | 🟢 Low–Med | Daytime browsing | Seedling browsing, young shrub and leaf consumption | `Domestic Control` $\rightarrow$ Low Threat $\rightarrow$ Localized Beep Buzzer $\rightarrow$ Farmer Boundary Check |
| **`WS-HM-HU`** | **Human** | *Homo sapiens* | Human | ⚠️ Context | Day / Night | Farmers, farm workers, researchers, intruders | `Human Detected` $\rightarrow$ **Deterrence INHIBITED** $\rightarrow$ Context & Timestamp Log $\rightarrow$ App Push |
| **`WS-VH-CV`** | **Vehicle** | — | Vehicle | ⚠️ Context | Any time | Tractors, road traffic, farm trucks, headlights | `Vehicle Detected` $\rightarrow$ No Wildlife Deterrence $\rightarrow$ Log Telemetry $\rightarrow$ Continue Monitoring |

---

## 2. Species Behaviour Profiles & Agricultural Threat Taxonomy

### 2.1 Wild Boar (`WS-WL-WB`)
* **Scientific Name:** *Sus scrofa*
* **Diet:** Omnivorous (Roots, tubers, grains, fallen fruits, green shoots, maize)
* **Activity Pattern:** Crepuscular and nocturnal peak foraging.
* **Social Dynamics:** Sounders of females with piglets; solitary mature males.
* **Agricultural Impact:**
  * **Direct Damage:** Consuming standing grain crops, maize cobs, and groundnuts.
  * **Physical Damage:** Snout rooting loosens root systems, overturning topsoil and destroying adjacent unconsumed crops.
  * **Repeated Intrusion:** High spatial memory; repeatedly raids high-yield zones once discovered.
* **Visual Detection Cues:** Compact dark/brown body, elongated snout, coarse bristles, low center of gravity.
* **WildShield Threat Engine:** **HIGH (92/100)** $\rightarrow$ **Siren + Strobe Floodlight + Mobile Push Alert**.

---

### 2.2 Nilgai / Blue Bull (`WS-WL-NG`)
* **Scientific Name:** *Boselaphus tragocamelus*
* **Diet:** Herbivore; grazer and browser (Cereals, pulses, vegetables, grasses).
* **Activity Pattern:** Peak feeding in early morning (05:00–08:30) and late afternoon (16:30–19:30).
* **Social Dynamics:** Herds of 5 to 15+ animals; acute vision and hearing.
* **Agricultural Impact:**
  * Heavy grazing on commercial pulses (gram, arhar), wheat, and vegetable plots.
  * Structural damage caused by heavy body weight trampling down crop canopies.
  * Dung piles foul localized grazing plots.
* **Visual Detection Cues:** Large sloping back, long legs, blue-grey males / tawny brown females, distinctive white facial and fetlock markings.
* **WildShield Threat Engine:** **HIGH (84/100)** $\rightarrow$ **Directional Floodlight + Acoustic Deterrent Alarm**.

---

### 2.3 Spotted Deer / Chital (`WS-WL-SD`)
* **Scientific Name:** *Axis axis*
* **Diet:** Herbivore; grazer (Grasses, tender shoots, flowers, fallen fruits).
* **Activity Pattern:** Crepuscular with variable daytime feeding.
* **Social Dynamics:** Gregarious herds; female-young groups and bachelor herds.
* **Agricultural Impact:**
  * Feeding on young germinating seedlings and tender vegetable foliage.
  * Trampling along perimeter boundary pathways.
* **Visual Detection Cues:** Reddish-fawn coat with white spots, white ventral surface, three-tined lyre antlers in males.
* **WildShield Threat Engine:** **MEDIUM (58/100)** $\rightarrow$ **Soft Floodlight + Low-Frequency Acoustic Tone** *(Aggressive sirens avoided to prevent panic stampedes)*.

---

### 2.4 Rhesus Macaque (`WS-WL-RM`)
* **Scientific Name:** *Macaca mulatta*
* **Diet:** Omnivorous (Fruits, vegetables, tubers, seeds, tender leaves).
* **Activity Pattern:** Strictly diurnal.
* **Social Dynamics:** Multi-male, multi-female troops with high spatial coordination and sentinel scouts.
* **Agricultural Impact:**
  * **High Waste Ratio:** Plucks unripe fruits, breaks flowering stems, and bites/discards large quantities of produce.
  * High agility allows rapid transition between tree canopy and ground crops.
* **Visual Detection Cues:** Medium quad-pedal body, pinkish face, medium-length tail, upright sitting posture.
* **WildShield Threat Engine:** **HIGH (82/100)** $\rightarrow$ **Smart Sprinkler Pulse + Primate Distress Audio Broadcast**.

---

### 2.5 Langur (`WS-WL-LG`)
* **Scientific Name:** *Semnopithecus entellus*
* **Diet:** Folivore / Herbivore (Leaves, blossoms, wild fruits, tender pods).
* **Activity Pattern:** Diurnal with morning/evening foraging peaks.
* **Social Dynamics:** Social troops of 10 to 50+ individuals; agile climbers.
* **Agricultural Impact:** Stripping canopy leaves and blossoms, feeding on legume crops.
* **Visual Detection Cues:** Slender grey body, black facial mask, long tail exceeding body length.
* **WildShield Threat Engine:** **MEDIUM–HIGH (65/100)** $\rightarrow$ **Visual Strobe Flash + Overhead Sprinkler Guard**.

---

### 2.6 Gaur / Indian Bison (`WS-WL-GR`)
* **Scientific Name:** *Bos gaurus*
* **Diet:** Herbivore (Coarse grasses, bamboo shoots, agricultural foliage).
* **Activity Pattern:** Diurnal grazing; shifts to nocturnal in human-disturbed forest buffers.
* **Social Dynamics:** Massive bovine (600–1000 kg); herds with dominant bulls.
* **Agricultural Impact:**
  * High biomass depletion in short timeframes.
  * Flattening boundary fences, stone dykes, and irrigation pipes.
  * **Critical Human Safety Hazard:** Extremely dangerous when approached or cornered.
* **Visual Detection Cues:** Massive muscular shoulder ridge, dark brown/black coat, white/yellowish stockings on lower legs.
* **WildShield Safety Rule:** **CRITICAL (98/100)** $\rightarrow$ **NON-CONTACT DETERRENCE ONLY**. **Do NOT corner or chase. Immediately notify Forest Department and Farmer Hub.**

---

### 2.7 Domestic Livestock: Cattle (`WS-DM-CT`) & Goat (`WS-DM-GT`)
* **Scientific Names:** *Bos taurus / indicus* (Cattle), *Capra hircus* (Goat)
* **Category:** Domestic Livestock (Negative / Control Class)
* **Agricultural Impact:** Non-hostile grazing of young crop foliage by escaped or stray livestock.
* **WildShield Policy:**
  * **Discriminative Non-Lethal Control:** Differentiates livestock from wildlife invaders.
  * **Response:** Low-intensity water sprinkler pulse or local warning buzzer. High-decibel predator sirens and forest department alerts are automatically **inhibited**.

---

### 2.8 Human (`WS-HM-HU`) & Vehicle (`WS-VH-CV`) Context Classes
* **Human (`WS-HM-HU`):**
  * Essential safety class. Represents farmers, workers, or night patrols.
  * **WildShield Safety Rule:** **Never activate automated wildlife deterrents when a human is detected in frame.**
* **Vehicle (`WS-VH-CV`):**
  * Background discrimination class to prevent false triggers from headlights, dust, and tractor movements.

---

## 3. Seven-Stage Autonomous AI Intelligence Pipeline

WildShield AI operates as an intelligent cognitive chain rather than a static detector:

```text
[1. What is it?]
       │ YOLOv11 Neural Tensor Inference (Species Classification)
       ▼
[2. Where is it?]
       │ Bounding Box Localization & Camera Node Coordinates (CAM-01 to CAM-05)
       ▼
[3. When is it active?]
       │ Diurnal vs Nocturnal Feeding Window Verification (Timestamp analysis)
       ▼
[4. What is it doing?]
       │ Behaviour Analysis (Rooting / Crop Grazing / Transit / Troop Raid)
       ▼
[5. Is it inside the geofence?]
       │ Virtual Geofence & Boundary Distance Vector Analysis
       ▼
[6. How serious is the threat?]
       │ Crop Sensitivity Matrix (Cotton / Rice / Sugarcane) + Threat Index (0–100)
       ▼
[7. What is the safest non-lethal response?]
       │ Autonomous Actuator Dispatch (Siren / Strobe / Directional Speaker / Sprinkler)
       │ Real-Time Digital Twin Telemetry & Farmer App Notification
```

---

## 4. Digital Twin Telemetry JSON Schema

Every detected event is recorded in the Digital Twin state ledger:

```json
{
  "event_id": "WS-EVT-17417",
  "timestamp": "2026-08-29T19:35:17Z",
  "time_formatted": "07:35:17 PM",
  "animal_code": "WS-WL-NG",
  "species": "Nilgai",
  "scientific_name": "Boselaphus tragocamelus",
  "confidence_pct": 96.2,
  "camera_id": "FN-1",
  "camera_node": "North Field",
  "farm_zone": "South-East Perimeter",
  "period": "Crepuscular / Late Afternoon",
  "behavior": "Crop Grazing",
  "farm_damage_risk": "Cereal & pulse crop loss + structural trampling",
  "group_size": 1,
  "geofence_breach": true,
  "threat_level": "HIGH",
  "threat_score": 84,
  "response_selected": ["Floodlight", "Alarm"],
  "response_policy": "Nilgai ↓ Geofence = TRUE ↓ High Threat ↓ Floodlight + Directional Alarm ↓ App Alert",
  "actuators_active": {
    "siren": false,
    "floodlight": true,
    "speaker": true,
    "sprinkler": false
  },
  "safety_protocol": "Standard non-contact deterrent"
}
```
