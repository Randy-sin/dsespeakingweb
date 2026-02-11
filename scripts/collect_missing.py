#!/usr/bin/env python3
"""
Collect all PDF page images that exist in the converted images but
have NO corresponding entry in the database.
Outputs:
  1. A combined PDF with all missing pages (labeled)
  2. A JSON template file for the user to fill in
"""

import json
import os
import math
from collections import defaultdict

PAPERS_JSON = "/Users/randy/dsespeakingweb/data/pastpaper_papers.json"
IMAGES_DIR = "/Users/randy/dsespeakingweb/data/images"
OUTPUT_PDF = "/Users/randy/dsespeakingweb/data/missing_papers.pdf"
OUTPUT_JSON = "/Users/randy/dsespeakingweb/data/missing_papers_template.json"

YEAR_KEYS = {
    2012: "2012",
    2013: "2013",
    2014: "2014",
    2015: "2015",
    2016: "2016",
    2017: "2017",
    2018: "2018",
    2019: "2019",
    2023: "2023",
}

# Also include image-only folders (no DB data at all)
IMAGE_ONLY_FOLDERS = {
    "2012-practice": {"year": 2012, "prefix": "2012practice"},
    "2012-sample": {"year": 2012, "prefix": "2012sample"},
    "2024": {"year": 2024, "prefix": "2024"},
    "2025": {"year": 2025, "prefix": "2025"},
}


def sort_key(p):
    parts = p["paper_number"].split(".")
    return (float(parts[0]), float(parts[1]) if len(parts) > 1 else 0)


def generate_full_sequence(num_images):
    num_groups = math.ceil(num_images / 3)
    seq = []
    for g in range(1, num_groups + 1):
        for s in range(1, 4):
            seq.append(f"{g}.{s}")
            if len(seq) == num_images:
                return seq
    return seq


def main():
    try:
        import fitz  # pymupdf
    except ImportError:
        print("ERROR: pymupdf not installed. Run: pip3 install pymupdf")
        return

    from PIL import Image
    import io

    with open(PAPERS_JSON) as f:
        papers = json.load(f)

    by_year = defaultdict(list)
    for p in papers:
        by_year[p["year"]].append(p)

    missing = []  # list of (label, image_path)

    # --- Check years that have DB entries but some papers missing ---
    for year in sorted(YEAR_KEYS.keys()):
        key = YEAR_KEYS[year]
        img_path = os.path.join(IMAGES_DIR, key)
        if not os.path.exists(img_path):
            continue

        imgs = sorted([f for f in os.listdir(img_path) if f.endswith(".webp")])
        year_papers = by_year.get(year, [])

        paper_lookup = {p["paper_number"]: p for p in year_papers}
        full_seq = generate_full_sequence(len(imgs))

        for i, paper_num in enumerate(full_seq):
            if i >= len(imgs):
                break
            if paper_num not in paper_lookup:
                abs_path = os.path.join(img_path, imgs[i])
                label = f"{year}-{paper_num}"
                missing.append((label, abs_path, year, paper_num))

    # --- Check image-only folders (no DB data) ---
    for folder, info in sorted(IMAGE_ONLY_FOLDERS.items()):
        img_path = os.path.join(IMAGES_DIR, folder)
        if not os.path.exists(img_path):
            continue

        imgs = sorted([f for f in os.listdir(img_path) if f.endswith(".webp")])
        full_seq = generate_full_sequence(len(imgs))

        for i, paper_num in enumerate(full_seq):
            if i >= len(imgs):
                break
            abs_path = os.path.join(img_path, imgs[i])
            label = f"{info['prefix']}-{paper_num}"
            missing.append((label, abs_path, info["year"], paper_num))

    if not missing:
        print("No missing papers found!")
        return

    print(f"Found {len(missing)} missing papers:")
    for label, path, year, pn in missing:
        print(f"  {label}")

    # --- Generate combined PDF using Pillow ---
    from PIL import ImageDraw, ImageFont

    pdf_pages = []
    for label, img_path, year, paper_num in missing:
        img = Image.open(img_path).convert("RGB")
        w, h = img.size

        # Add label bar at top
        bar_height = 60
        new_img = Image.new("RGB", (w, h + bar_height), (255, 230, 100))
        new_img.paste(img, (0, bar_height))

        draw = ImageDraw.Draw(new_img)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
        except:
            font = ImageFont.load_default()
        draw.text((20, 10), f"MISSING: {label}", fill=(0, 0, 0), font=font)

        pdf_pages.append(new_img)

    if pdf_pages:
        pdf_pages[0].save(
            OUTPUT_PDF, "PDF", save_all=True,
            append_images=pdf_pages[1:], resolution=150
        )
    print(f"\nPDF saved: {OUTPUT_PDF}")

    # --- Generate JSON template ---
    template = []
    for label, img_path, year, paper_num in missing:
        template.append({
            "year": year,
            "paper_number": paper_num,
            "paper_id": label,
            "topic": "TODO: fill in topic",
            "part_a_title": "TODO",
            "part_a_source": "Unknown source",
            "part_a_article": ["TODO: paste article text here"],
            "part_a_discussion_points": [
                "TODO: discussion point 1",
                "TODO: discussion point 2",
                "TODO: discussion point 3",
                "TODO: discussion point 4",
            ],
            "part_b_questions": [
                {
                    "text": "TODO: question 1",
                    "number": 1,
                    "difficulty": "medium",
                    "difficulty_level": "4-6",
                },
                {
                    "text": "TODO: question 2",
                    "number": 2,
                    "difficulty": "medium",
                    "difficulty_level": "4-6",
                },
            ],
        })

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(template, f, indent=2, ensure_ascii=False)

    print(f"JSON template saved: {OUTPUT_JSON}")
    print(f"\nPlease fill in the TODO fields in the JSON template,")
    print(f"then provide it back so I can add them to the database.")


if __name__ == "__main__":
    main()
