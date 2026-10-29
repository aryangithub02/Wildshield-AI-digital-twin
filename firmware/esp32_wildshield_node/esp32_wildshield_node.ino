/*
 * WildShield AI — ESP32 Autonomous Farm Deterrent & Audio Warning Node
 * 
 * Hardware:
 *   - ESP32 DevKit V1 (30-pin or 36-pin)
 *   - HW-518 MOSFET Trigger Module (PC817 Optocoupler) -> Connected to GPIO15
 *   - HW-316 Relay Module (Optional secondary actuator) -> Connected to GPIO23
 *   - MP3-TF-16P V3.0 / DFPlayer Mini Audio Module:
 *       Module RX  -> ESP32 GPIO25 (via 1k resistor recommended)
 *       Module TX  -> ESP32 GPIO34 (Input-only on ESP32, safe 3.3V logic)
 *       Module VCC -> ESP32 VIN (5V from USB or regulated buck converter)
 *       Module GND -> ESP32 GND
 *       SPK_1/SPK_2 -> 4-8 Ohm 3W Speaker
 *       MicroSD: 32GB FAT32 formatted, audio stored as /mp3/0001.mp3
 * 
 * HTTP Endpoints Provided:
 *   GET /status -> JSON status of actuators and audio
 *   GET /deter  -> Turn ON Floodlight (GPIO15) + Siren (GPIO23) + Play deterrent audio
 *   GET /stop   -> Turn OFF Floodlight + Siren + Stop audio
 *   GET /human  -> Security mode: Floodlight ON + Warning audio (compatibility alias)
 *   GET /clear  -> Alias for /stop
 *   GET /ping   -> Fast health check
 *
 * Safety Policy:
 *   - All GPIOs initialize to LOW (DE-ENERGIZED) on boot.
 *   - Failure of MP3 module does not crash the HTTP server or lighting.
 */

#include <WiFi.h>
#include <WebServer.h>
#include <HardwareSerial.h>
#include <DFRobotDFPlayerMini.h>

// ----------------------------------------------------
// Wi-Fi Configuration
// Replace with your local field / mobile hotspot credentials
// ----------------------------------------------------
const char* WIFI_SSID     = "WildShield_Field_WiFi";
const char* WIFI_PASSWORD = "wildshield_secure_2026";

// Static IP Configuration (Optional - set to match network or use DHCP)
IPAddress local_IP(192, 168, 43, 88);
IPAddress gateway(192, 168, 43, 1);
IPAddress subnet(255, 255, 255, 0);

// ----------------------------------------------------
// Pin Assignments
// ----------------------------------------------------
const int PIN_FLOODLIGHT = 15; // HW-518 MOSFET Trigger (GPIO15)
const int PIN_SIREN_RELAY = 23; // Secondary Relay / Siren (GPIO23)
const int PIN_DFP_RX     = 25; // ESP32 TX -> DFPlayer RX (GPIO25)
const int PIN_DFP_TX     = 34; // ESP32 RX <- DFPlayer TX (GPIO34 - Input Only)

// ----------------------------------------------------
// Global Objects & State
// ----------------------------------------------------
WebServer server(80);
HardwareSerial mp3Serial(2); // UART2
DFRobotDFPlayerMini dfPlayer;

bool audioAvailable = false;
bool floodlightActive = false;
bool sirenActive = false;
unsigned long lastStateChange = 0;

// ----------------------------------------------------
// Hardware Control Functions
// ----------------------------------------------------
void setActuators(bool floodlight, bool siren, int track = 0) {
  floodlightActive = floodlight;
  sirenActive = siren;
  lastStateChange = millis();

  digitalWrite(PIN_FLOODLIGHT, floodlight ? HIGH : LOW);
  digitalWrite(PIN_SIREN_RELAY, siren ? HIGH : LOW);

  if (audioAvailable) {
    if (track > 0) {
      dfPlayer.volume(28); // 0-30
      dfPlayer.playMp3Folder(track); // /mp3/0001.mp3
    } else if (!floodlight && !siren) {
      dfPlayer.stop();
    }
  }

  Serial.printf("[HARDWARE] Floodlight: %s | Siren: %s | Track: %d\n",
                floodlight ? "ON" : "OFF",
                siren ? "ON" : "OFF",
                track);
}

// ----------------------------------------------------
// HTTP Handler Functions
// ----------------------------------------------------
void handleRoot() {
  server.send(200, "text/plain", "WildShield AI - ESP32 Smart Deterrent Node Online\n");
}

void handleStatus() {
  String json = "{";
  json += "\"status\":\"ONLINE\",";
  json += "\"floodlight\":" + String(floodlightActive ? "true" : "false") + ",";
  json += "\"siren\":" + String(sirenActive ? "true" : "false") + ",";
  json += "\"audio_available\":" + String(audioAvailable ? "true" : "false") + ",";
  json += "\"gpio15_state\":" + String(digitalRead(PIN_FLOODLIGHT)) + ",";
  json += "\"gpio23_state\":" + String(digitalRead(PIN_SIREN_RELAY)) + ",";
  json += "\"uptime_seconds\":" + String(millis() / 1000);
  json += "}";
  server.send(200, "application/json", json);
}

void handleDeter() {
  setActuators(true, true, 1); // Track 1: General High Threat / Predator Siren
  server.send(200, "text/plain", "DETERRENT ACTIVATED (Floodlight ON + Siren ON + Audio Playing)\n");
}

void handleStop() {
  setActuators(false, false, 0); // Stop all
  server.send(200, "text/plain", "DETERRENT DEACTIVATED (Floodlight OFF + Siren OFF + Audio Stopped)\n");
}

void handleHuman() {
  setActuators(true, false, 2); // Track 2: Human Voice Warning (No violent siren)
  server.send(200, "text/plain", "HUMAN PROTOCOL ACTIVATED (Floodlight ON + Voice Warning Track 2)\n");
}

void handlePing() {
  server.send(200, "text/plain", "PONG\n");
}

// ----------------------------------------------------
// Setup
// ----------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=============================================");
  Serial.println("  WildShield AI — ESP32 Smart Deterrent Node");
  Serial.println("=============================================");

  // 1. Initialize GPIOs to SAFE DE-ENERGIZED STATE
  pinMode(PIN_FLOODLIGHT, OUTPUT);
  pinMode(PIN_SIREN_RELAY, OUTPUT);
  digitalWrite(PIN_FLOODLIGHT, LOW);
  digitalWrite(PIN_SIREN_RELAY, LOW);
  Serial.println("[OK] GPIO15 (Floodlight) & GPIO23 (Siren) initialized to LOW (Safe State)");

  // 2. Initialize MP3-TF-16P Audio Module (UART2)
  Serial.println("[INFO] Initializing MP3-TF-16P Audio Module on GPIO25 (TX) & GPIO34 (RX)...");
  mp3Serial.begin(9600, SERIAL_8N1, PIN_DFP_TX, PIN_DFP_RX);
  delay(200);

  if (!dfPlayer.begin(mp3Serial, false, false)) { // isACK=false, doReset=false for faster boot
    Serial.println("[WARNING] MP3 Module not responding or MicroSD card missing.");
    Serial.println("          System will continue in silent deterrence mode (Lights & Relay active).");
    audioAvailable = false;
  } else {
    Serial.println("[OK] MP3-TF-16P Audio Module successfully initialized!");
    dfPlayer.volume(25);
    audioAvailable = true;
  }

  // 3. Connect to Wi-Fi
  Serial.printf("[INFO] Connecting to Wi-Fi: %s ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  // Uncomment below if static IP is desired:
  // WiFi.config(local_IP, gateway, subnet);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[OK] Wi-Fi Connected! IP Address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WARNING] Wi-Fi connection timed out. Starting SoftAP fallback...");
    WiFi.softAP("WildShield-Node-AP", "wildshield123");
    Serial.printf("[OK] SoftAP Active at IP: %s\n", WiFi.softAPIP().toString().c_str());
  }

  // 4. Register HTTP Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/deter", HTTP_GET, handleDeter);
  server.on("/stop", HTTP_GET, handleStop);
  server.on("/human", HTTP_GET, handleHuman);
  server.on("/clear", HTTP_GET, handleStop);
  server.on("/ping", HTTP_GET, handlePing);

  server.begin();
  Serial.println("[OK] HTTP Server listening on port 80.");
  Serial.println("     Endpoints ready: /status, /deter, /stop, /human, /clear, /ping\n");
}

// ----------------------------------------------------
// Main Loop
// ----------------------------------------------------
void loop() {
  server.handleClient();
  delay(2);
}
