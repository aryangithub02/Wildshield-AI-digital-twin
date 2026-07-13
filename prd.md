# WildShield AI - Demo Simulation PRD

## Goal

Build a polished frontend-only simulation that demonstrates the complete workflow of the WildShield AI system.

No actual AI inference is required.

The application should simulate:
- wildlife entering a farm
- camera detection
- YOLO detection animation
- AI decision making
- deterrent activation
- dashboard updates

Everything should happen automatically.

---

# Target Duration

10–15 minute implementation

---

# Tech Stack

React
Vite
Tailwind CSS
Framer Motion
Lucide React
Chart.js

No backend.

No database.

Everything uses mock JSON.

---

# Demo Flow

After opening the website:

1. Farm map loads.
2. Cameras appear.
3. Animal enters from forest.
4. Animal walks.
5. Camera detects.
6. Bounding box appears.
7. Confidence animation.
8. AI panel updates.
9. Threat becomes HIGH.
10. Siren animation.
11. Flood light animation.
12. Timeline updates.
13. Statistics update.

Entire sequence takes 10 seconds.

Loop forever.

---

# Pages

Dashboard only.

Everything happens on one page.

---

# Layout

------------------------------------------------
 Header
------------------------------------------------

 KPI Cards

-----------------------------------------------
 Digital Twin | AI Panel
               |
               |
-----------------------------------------------

 Timeline

-----------------------------------------------

 Analytics

-----------------------------------------------

 Device Status

-----------------------------------------------

---

# KPI Cards

Today's Intrusions

8

Wild Animals

4

Active Cameras

4

System Health

98%

---

# Digital Twin

Simple rectangle.

Inside

🌳 Forest

🌾 Farm

📷 Cameras

🐘 Elephant

🔊 Siren

💡 Flood Light

Animal moves using Framer Motion.

---

# AI Detection Card

Species

Elephant

Confidence

98%

Threat

HIGH

Status

Detected

---

# Device Panel

Camera 1

ONLINE

Camera 2

ONLINE

Camera 3

ONLINE

Camera 4

ONLINE

ESP32

CONNECTED

Jetson Nano

RUNNING

---

# Timeline

Motion Detected

↓

AI Detection

↓

Threat Assessment

↓

Siren Activated

↓

Flood Light ON

↓

Event Logged

---

# Analytics

Bar chart

Elephant

Wild Boar

Monkey

Deer

---

# Simulation Logic

Use

setTimeout()

Every 2 seconds

update state.

---

State 1

Idle

↓

State 2

Animal Appears

↓

State 3

Detection

↓

State 4

Threat

↓

State 5

Response

↓

State 6

Completed

↓

Repeat

---

# Animations

Framer Motion

Animal movement

Camera pulse

Bounding box

Alert popup

Blinking siren

Light glow

Progress bars

Counter animation

---

# Fake AI

Never call YOLO.

Simply wait

2 seconds

then display

"Elephant Detected"

Confidence

98.4%

---

# Demo Mode

Automatically starts.

No buttons required.

Everything loops.

---

# Assets

Use emoji/icons

🐘

📷

💡

🔊

🌳

🌾

instead of images.

This keeps implementation under 15 minutes.

---

# Prototype Scope & Assumptions

## Purpose of the Prototype

The objective of this prototype is to demonstrate the **complete software workflow** of WildShield AI rather than implementing a production-ready Geographic Information System (GIS).

The prototype focuses on showcasing:

- Wildlife detection
- AI inference simulation
- Threat assessment
- Decision making
- Digital Twin visualization
- Device activation
- Dashboard analytics

using a simplified interactive farm environment.

---

# Farm Map (Prototype)

The current prototype **does not use real satellite imagery, GPS coordinates, or OpenStreetMap**.

Instead, the Digital Twin uses a **custom-designed demonstration farm map** that visually represents a typical agricultural field.

The demo map contains:

- Farm Boundary
- Forest Area
- Crop Area
- Entry Gates
- Water Canal
- Camera Locations
- Sensor Nodes
- Flood Lights
- Sirens
- Wildlife Movement Paths

This allows the audience to clearly understand the workflow without introducing unnecessary GIS complexity.

---

# Why a Demo Map?

Integrating a real farm map requires:

- GPS coordinate mapping
- GIS data processing
- OpenStreetMap or Google Maps integration
- Polygon generation for farm boundaries
- Coordinate transformations
- Camera geolocation
- Sensor georeferencing
- Map rendering optimization

These features are outside the scope of the initial prototype and would significantly increase development time without improving the demonstration of the core AI workflow.

Therefore, a **custom demonstration farm layout** is intentionally used to keep the prototype simple, fast, and presentation-focused.

---

# Future Enhancement

The production version will replace the demonstration farm with an actual GIS-enabled digital twin.

Future capabilities include:

- OpenStreetMap integration
- Google Maps support
- Satellite imagery
- GPS-based farm boundary creation
- Interactive geofencing
- Real farm coordinates
- Camera geolocation
- Wildlife movement tracking on actual maps
- Multi-farm visualization
- Village-level monitoring
- Regional wildlife corridor mapping

---

# Development Note

For the current demonstration:

- The farm layout is static.
- Wildlife movement is simulated.
- Camera locations are predefined.
- Detection events are generated through a scripted workflow.
- The objective is to demonstrate the complete user experience rather than real-world deployment.

This approach enables rapid development while effectively communicating the functionality and future vision of the WildShield AI platform.