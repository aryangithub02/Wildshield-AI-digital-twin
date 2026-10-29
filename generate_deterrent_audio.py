"""
WildShield AI - Autonomous Farm Deterrent Audio Generator
Generates high-fidelity human vocal deterrence audio files for all 10 priority animals
according to the field test specifications and anti-habituation protocols.
"""

import asyncio
import os
import shutil
import json
import edge_tts

AUDIO_DIR = os.path.abspath(r"c:\Users\lenovo\OneDrive\Desktop\Wildshield AI digital twin\audio")
DFPLAYER_DIR = os.path.join(AUDIO_DIR, "dfplayer_mp3")

TRACKS = [
    # 1. Wild Boar
    {
        "id": 1,
        "animal": "Wild boar",
        "key": "WildBoar",
        "priority": "High",
        "consideration": "May become habituated to repeated sounds. Rotate audio cues frequently.",
        "variations": [
            {
                "file": "WildBoar_01.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+12%",
                "pitch": "+5Hz",
                "volume": "+20%",
                "text": "हट! हटो यहाँ से! ऐ जंगली सूअर, चलो भागो खेत से बाहर! हट हट हट!",
                "translation": "Shoo! Move away from here! Hey wild boar, run out of the field! Shoo shoo shoo!",
                "type": "Firm human vocal call (High intensity)"
            },
            {
                "file": "WildBoar_02.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+15%",
                "pitch": "+0Hz",
                "volume": "+20%",
                "text": "अरे कौन है वहाँ? ऐ हटो, चलो निकलो बाहर! भागो यहाँ से!",
                "translation": "Hey, who is there? Move, get out! Run away from here!",
                "type": "Farm-worker authoritative shout"
            },
            {
                "file": "WildBoar_03.mp3",
                "voice": "en-IN-PrabhatNeural",
                "rate": "+10%",
                "pitch": "+4Hz",
                "volume": "+20%",
                "text": "Hey! Move away, get out of the field! Shoo, go away right now!",
                "translation": "Hey! Move away, get out of the field! Shoo, go away right now!",
                "type": "Sharp vocal command (Secondary variation)"
            }
        ]
    },
    # 2. Nilgai (blue bull)
    {
        "id": 2,
        "animal": "Nilgai (blue bull)",
        "key": "Nilgai",
        "priority": "High",
        "consideration": "Test responses under local field conditions. Farm-worker warning calls.",
        "variations": [
            {
                "file": "Nilgai_01.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+8%",
                "pitch": "+2Hz",
                "volume": "+20%",
                "text": "हट रे नीलगाय! फसल से दूर हट! ऐ चलो खेत से बाहर निकलो! हट!",
                "translation": "Shoo Nilgai! Stay away from the crops! Get out of the field! Shoo!",
                "type": "Resonant farm-worker field shout"
            },
            {
                "file": "Nilgai_02.mp3",
                "voice": "hi-IN-SwaraNeural",
                "rate": "+10%",
                "pitch": "+3Hz",
                "volume": "+20%",
                "text": "अरे नीलगाय खेत में घुस रही है! ऐ हटो वहाँ से, भागो चलो!",
                "translation": "Hey Nilgai is entering the field! Move away from there, run away!",
                "type": "High-alert farmer vocal call"
            },
            {
                "file": "Nilgai_03.mp3",
                "voice": "en-IN-PrabhatNeural",
                "rate": "+10%",
                "pitch": "+0Hz",
                "volume": "+20%",
                "text": "Nilgai alert! Stay clear of the harvest! Move out, get out!",
                "translation": "Nilgai alert! Stay clear of the harvest! Move out, get out!",
                "type": "Firm worker warning announcement"
            }
        ]
    },
    # 3. Deer
    {
        "id": 3,
        "animal": "Deer",
        "key": "Deer",
        "priority": "High",
        "consideration": "Avoid assuming predator sounds will work consistently; use unfamiliar human activity sounds.",
        "variations": [
            {
                "file": "Deer_01.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+10%",
                "pitch": "+5Hz",
                "volume": "+20%",
                "text": "कौन है वहाँ? ऐ चलो हटो, यहाँ लोग काम कर रहे हैं! चलो बाहर जाओ!",
                "translation": "Who is there? Move along, people are working here! Go outside!",
                "type": "Human presence voice & activity sound"
            },
            {
                "file": "Deer_02.mp3",
                "voice": "hi-IN-SwaraNeural",
                "rate": "+12%",
                "pitch": "+2Hz",
                "volume": "+20%",
                "text": "ऐ हिरन, हटो यहाँ से! खेत में मत आओ, जंगल की तरफ लौटो! भागो!",
                "translation": "Hey deer, move away from here! Don't enter the field, return to the forest! Run!",
                "type": "Field worker redirection call"
            },
            {
                "file": "Deer_03.mp3",
                "voice": "en-IN-PrabhatNeural",
                "rate": "+10%",
                "pitch": "+0Hz",
                "volume": "+20%",
                "text": "Attention! Human presence in zone. Move away from the boundary line, shoo!",
                "translation": "Attention! Human presence in zone. Move away from the boundary line, shoo!",
                "type": "Unfamiliar human vocal broadcast"
            }
        ]
    },
    # 4. Monkey
    {
        "id": 4,
        "animal": "Monkey",
        "key": "Monkey",
        "priority": "Medium",
        "consideration": "Monkeys may habituate quickly. Keep sounds brief and unfamiliar.",
        "variations": [
            {
                "file": "Monkey_01.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+20%",
                "pitch": "+10Hz",
                "volume": "+20%",
                "text": "हुप! हट! ऐ बंदर, ऊपर से उतरो! चलो भागो यहाँ से! हट हट!",
                "translation": "Hup! Shoo! Hey monkey, get down from above! Run away from here! Shoo shoo!",
                "type": "Brief sharp startle shout"
            },
            {
                "file": "Monkey_02.mp3",
                "voice": "hi-IN-SwaraNeural",
                "rate": "+18%",
                "pitch": "+8Hz",
                "volume": "+20%",
                "text": "छोड़ उसे! ऐ बंदर चलो भागो, फसल मत तोड़ो! हट!",
                "translation": "Leave that! Hey monkey run away, don't break the crops! Shoo!",
                "type": "Rapid warning voice"
            },
            {
                "file": "Monkey_03.mp3",
                "voice": "en-IN-PrabhatNeural",
                "rate": "+22%",
                "pitch": "+5Hz",
                "volume": "+20%",
                "text": "Hey! Drop that and get out! Move, shoo! Go away!",
                "translation": "Hey! Drop that and get out! Move, shoo! Go away!",
                "type": "Sudden firm command"
            }
        ]
    },
    # 5. Elephant
    {
        "id": 5,
        "animal": "Elephant",
        "key": "Elephant",
        "priority": "High",
        "consideration": "Use alongside alerts to farmers; sound-only deterrence can be unreliable.",
        "variations": [
            {
                "file": "Elephant_01.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+5%",
                "pitch": "-4Hz",
                "volume": "+20%",
                "text": "होशियार! हाथी गाँव की तरफ बढ़ रहा है! सभी किसान भाई सतर्क हो जाओ! सुरक्षित दूरी बनाओ!",
                "translation": "Warning! Elephant is heading toward the village! All farmers stay alert! Maintain a safe distance!",
                "type": "Deep resonant farmer warning shout"
            },
            {
                "file": "Elephant_02.mp3",
                "voice": "hi-IN-SwaraNeural",
                "rate": "+5%",
                "pitch": "-2Hz",
                "volume": "+20%",
                "text": "सावधान! हाथी की मौजूदगी दर्ज हुई है! टॉर्च जलाएं और समूह में रहें! चेतावनी सायरन चालू है!",
                "translation": "Caution! Elephant presence detected! Turn on torches and stay in groups! Warning siren is active!",
                "type": "Community alarm broadcast"
            },
            {
                "file": "Elephant_03.mp3",
                "voice": "en-IN-PrabhatNeural",
                "rate": "+5%",
                "pitch": "-3Hz",
                "volume": "+20%",
                "text": "Elephant movement detected! Village boundary alert! Farmers take precaution and avoid single movement!",
                "translation": "Elephant movement detected! Village boundary alert! Farmers take precaution and avoid single movement!",
                "type": "Perimeter warning broadcast"
            }
        ]
    },
    # 6. Leopard
    {
        "id": 6,
        "animal": "Leopard",
        "key": "Leopard",
        "priority": "High",
        "consideration": "Do not rely on audio alone; prioritize human safety and wildlife authorities' guidance.",
        "variations": [
            {
                "file": "Leopard_01.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+5%",
                "pitch": "-2Hz",
                "volume": "+20%",
                "text": "सावधान! गाँव वाले सतर्क रहें! इलाके में तेंदुआ देखा गया है! अपने घरों में सुरक्षित रहें और पालतू पशुओं को अंदर रखें!",
                "translation": "Alert! Villagers stay alert! Leopard spotted in the area! Stay safe inside homes and keep domestic animals sheltered!",
                "type": "Farmer alert & human safety broadcast"
            },
            {
                "file": "Leopard_02.mp3",
                "voice": "hi-IN-SwaraNeural",
                "rate": "+5%",
                "pitch": "+0Hz",
                "volume": "+20%",
                "text": "वन विभाग चेतावनी! तेंदुआ निगरानी क्षेत्र में है! अकेले बाहर न निकलें, प्रकाश व्यवस्था चालू रखें!",
                "translation": "Forest Department Warning! Leopard is in the monitored zone! Do not venture out alone, keep lights illuminated!",
                "type": "Forest authority alert broadcast"
            },
            {
                "file": "Leopard_03.mp3",
                "voice": "en-IN-PrabhatNeural",
                "rate": "+5%",
                "pitch": "-2Hz",
                "volume": "+20%",
                "text": "Emergency predator alert! Leopard activity detected nearby! Secure all livestock and stay indoors!",
                "translation": "Emergency predator alert! Leopard activity detected nearby! Secure all livestock and stay indoors!",
                "type": "Emergency livestock safety alert"
            }
        ]
    },
    # 7. Jackal
    {
        "id": 7,
        "animal": "Jackal",
        "key": "Jackal",
        "priority": "Medium",
        "consideration": "Effectiveness varies by setting and animal behaviour. Brief warning calls.",
        "variations": [
            {
                "file": "Jackal_01.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+15%",
                "pitch": "+5Hz",
                "volume": "+20%",
                "text": "हट! चल भाग यहाँ से गीदड़! हट हट! बाहर जा!",
                "translation": "Shoo! Run away jackal! Shoo shoo! Get outside!",
                "type": "Brief sharp human warning"
            },
            {
                "file": "Jackal_02.mp3",
                "voice": "hi-IN-SwaraNeural",
                "rate": "+12%",
                "pitch": "+4Hz",
                "volume": "+20%",
                "text": "अरे कौन है? चल दूर हट, बाड़े से दूर जा! चलो निकलो!",
                "translation": "Who's there? Stay away, get away from the livestock pen! Get out!",
                "type": "Pen protector verbal shout"
            },
            {
                "file": "Jackal_03.mp3",
                "voice": "en-IN-PrabhatNeural",
                "rate": "+15%",
                "pitch": "+3Hz",
                "volume": "+20%",
                "text": "Shoo! Clear the farm boundary! Jackal warning, move out!",
                "translation": "Shoo! Clear the farm boundary! Jackal warning, move out!",
                "type": "Boundary verbal deterrence"
            }
        ]
    },
    # 8. Stray dog
    {
        "id": 8,
        "animal": "Stray dog",
        "key": "StrayDog",
        "priority": "Medium",
        "consideration": "Avoid sounds that could provoke or agitate the animal. Calm, firm verbal warning.",
        "variations": [
            {
                "file": "StrayDog_01.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+0%",
                "pitch": "-2Hz",
                "volume": "+15%",
                "text": "शू! जाओ यहाँ से। बाहर निकलो, चलो जाओ।",
                "translation": "Shoo! Go away from here. Get out, go along.",
                "type": "Calm, firm verbal command"
            },
            {
                "file": "StrayDog_02.mp3",
                "voice": "hi-IN-SwaraNeural",
                "rate": "+0%",
                "pitch": "+0Hz",
                "volume": "+15%",
                "text": "हट! बाड़े से दूर रहो, चलो बाहर जाओ।",
                "translation": "Move! Stay away from the enclosure, go outside.",
                "type": "Non-provocative verbal direction"
            },
            {
                "file": "StrayDog_03.mp3",
                "voice": "en-IN-PrabhatNeural",
                "rate": "+0%",
                "pitch": "-1Hz",
                "volume": "+15%",
                "text": "No! Go away, shoo! Walk away quietly, out!",
                "translation": "No! Go away, shoo! Walk away quietly, out!",
                "type": "Measured human authority command"
            }
        ]
    },
    # 9. Cattle
    {
        "id": 9,
        "animal": "Cattle",
        "key": "Cattle",
        "priority": "Low",
        "consideration": "Cattle may be familiar with these sounds, so deterrence may be limited. Familiar herding voice.",
        "variations": [
            {
                "file": "Cattle_01.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+8%",
                "pitch": "+0Hz",
                "volume": "+20%",
                "text": "हट हट हट! ऐ गाय, खेत से बाहर चलो! चलो रास्ते पर निकलो! हट!",
                "translation": "Shoo shoo shoo! Hey cattle, move out of the field! Get out onto the pathway! Shoo!",
                "type": "Traditional farmer herding call"
            },
            {
                "file": "Cattle_02.mp3",
                "voice": "hi-IN-SwaraNeural",
                "rate": "+8%",
                "pitch": "+2Hz",
                "volume": "+20%",
                "text": "ऐ चलो, फसल मत खाओ! मुड़ो इधर, बाहर चलो!",
                "translation": "Hey move, don't eat the crop! Turn around, get out!",
                "type": "Crop protection herder voice"
            },
            {
                "file": "Cattle_03.mp3",
                "voice": "en-IN-PrabhatNeural",
                "rate": "+5%",
                "pitch": "+0Hz",
                "volume": "+20%",
                "text": "Move along! Out of the field, back to the path! Hey, move!",
                "translation": "Move along! Out of the field, back to the path! Hey, move!",
                "type": "Field boundary direction call"
            }
        ]
    },
    # 10. Goat
    {
        "id": 10,
        "animal": "Goat",
        "key": "Goat",
        "priority": "Low",
        "consideration": "Test carefully; goats may not respond reliably. Sharp herding calls.",
        "variations": [
            {
                "file": "Goat_01.mp3",
                "voice": "hi-IN-MadhurNeural",
                "rate": "+12%",
                "pitch": "+4Hz",
                "volume": "+20%",
                "text": "हट रे बकरी! छोड़ उस पौधे को! चल बाहर निकल! हट हट!",
                "translation": "Shoo goat! Leave that plant! Get out of here! Shoo shoo!",
                "type": "Sharp herder directing call"
            },
            {
                "file": "Goat_02.mp3",
                "voice": "hi-IN-SwaraNeural",
                "rate": "+12%",
                "pitch": "+5Hz",
                "volume": "+20%",
                "text": "ऐ चलो पीछे हटो! खेत में मत घुसो, चलो बाहर जाओ!",
                "translation": "Hey move back! Don't enter the field, go outside!",
                "type": "Direct verbal reprimand"
            },
            {
                "file": "Goat_03.mp3",
                "voice": "en-IN-PrabhatNeural",
                "rate": "+10%",
                "pitch": "+2Hz",
                "volume": "+20%",
                "text": "Hey! Out of the seedlings! Back off, go away!",
                "translation": "Hey! Out of the seedlings! Back off, go away!",
                "type": "Crop protection call"
            }
        ]
    }
]

async def generate_file(var, output_path):
    communicate = edge_tts.Communicate(
        text=var["text"],
        voice=var["voice"],
        rate=var["rate"],
        pitch=var["pitch"],
        volume=var["volume"]
    )
    await communicate.save(output_path)
    size = os.path.getsize(output_path)
    print(f"[OK] Generated {os.path.basename(output_path)} ({size} bytes) - Voice: {var['voice']}")

async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(DFPLAYER_DIR, exist_ok=True)

    print(f"Generating audio files in: {AUDIO_DIR}")
    catalog = []

    for item in TRACKS:
        animal = item["animal"]
        key = item["key"]
        print(f"\nProcessing #{item['id']}: {animal} (Key: {key})")

        for idx, var in enumerate(item["variations"]):
            filename = var["file"]
            filepath = os.path.join(AUDIO_DIR, filename)
            await generate_file(var, filepath)

            # Copy variation 01 to DFPlayer folder (0001.mp3 to 0010.mp3)
            if idx == 0:
                dfplayer_name = f"{item['id']:04d}.mp3"
                dfplayer_path = os.path.join(DFPLAYER_DIR, dfplayer_name)
                shutil.copyfile(filepath, dfplayer_path)
                print(f"  -> Cloned to DFPlayer: /mp3/{dfplayer_name}")

            catalog.append({
                "animal_id": item["id"],
                "animal": animal,
                "key": key,
                "priority": item["priority"],
                "file": filename,
                "dfplayer_track": f"{item['id']:04d}.mp3" if idx == 0 else None,
                "type": var["type"],
                "voice": var["voice"],
                "rate": var["rate"],
                "pitch": var["pitch"],
                "volume": var["volume"],
                "text": var["text"],
                "translation": var["translation"],
                "consideration": item["consideration"]
            })

    # Save JSON catalog
    catalog_path = os.path.join(AUDIO_DIR, "audio_catalog.json")
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
    print(f"\n[OK] Catalog written to: {catalog_path}")

    # Save Markdown catalog
    md_path = os.path.join(AUDIO_DIR, "AUDIO_CATALOG.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# WildShield AI - Acoustic Deterrent Audio Library\n\n")
        f.write("This directory contains field-tested human voice and worker warning recordings optimized for wildlife and livestock deterrence.\n\n")
        f.write("| # | Animal | File Name | DFPlayer Track | Priority | Voice Model | Description | Important Field Consideration |\n")
        f.write("|---|---|---|---|---|---|---|---|\n")
        for entry in catalog:
            dfp = f"`/mp3/{entry['dfplayer_track']}`" if entry['dfplayer_track'] else "—"
            f.write(f"| {entry['animal_id']} | **{entry['animal']}** | `{entry['file']}` | {dfp} | **{entry['priority']}** | `{entry['voice']}` | {entry['type']}: *\"{entry['translation']}\"* | {entry['consideration']} |\n")

    print(f"[OK] Markdown guide written to: {md_path}")
    print("\nAll audio files generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
