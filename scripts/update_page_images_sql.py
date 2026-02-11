#!/usr/bin/env python3
"""
Generate SQL to set page_images from mapping. Images served from /paper-images/ (public folder).
"""
import json

MAPPING = "data/paper_page_mapping.json"
BASE_URL = "/paper-images"  # Next.js public folder

# paper_id prefix -> expected image folder prefix (filter wrong mappings)
PREFIX_TO_FOLDER = {
    "2012sample": "2012-sample",
    "2012practice": "2012-practice",
    "2012": "2012",
    "2013": "2013",
    "2014": "2014",
    "2015": "2015",
    "2016": "2016",
    "2017": "2017",
    "2018": "2018",
    "2019": "2019",
    "2023": "2023",
    "2024": "2024",
    "2025": "2025",
}

def expected_folder(pid):
    for prefix, folder in sorted(PREFIX_TO_FOLDER.items(), key=lambda x: -len(x[0])):
        if pid.startswith(prefix + "-") or pid == prefix:
            return folder
    return None

with open(MAPPING) as f:
    mapping = json.load(f)

# Group by paper_id -> list of image URLs; filter by matching folder
by_pid = {}
for e in mapping:
    pid = e["paper_id"]
    img = e["image"]
    folder = expected_folder(pid)
    if folder and not img.startswith(folder + "/"):
        continue  # skip wrong mapping
    url = f"{BASE_URL}/{img}"
    if pid not in by_pid:
        by_pid[pid] = {"db_id": e["db_id"], "urls": []}
    if url not in by_pid[pid]["urls"]:
        by_pid[pid]["urls"].append(url)

# Generate UPDATE statements
for pid, data in by_pid.items():
    db_id = data["db_id"]
    urls = data["urls"]
    arr = ", ".join(f"E'{u}'" for u in urls)
    print(f"UPDATE pastpaper_papers SET page_images = ARRAY[{arr}] WHERE id = '{db_id}';")
