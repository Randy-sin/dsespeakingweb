#!/usr/bin/env python3
"""
Auto-generate paper_page_mapping.json by matching papers to images.
Uses the full sequential paper numbering (1.1, 1.2, 1.3, 2.1, 2.2, ...)
to correctly map even when the database is missing some papers.
"""

import json
import os
import math
from collections import defaultdict

PAPERS_JSON = "/Users/randy/dsespeakingweb/data/pastpaper_papers.json"
IMAGES_DIR = "/Users/randy/dsespeakingweb/data/images"
OUTPUT = "/Users/randy/dsespeakingweb/data/paper_page_mapping.json"

YEAR_TO_KEY = {
    2012: "2012",
    2013: "2013",
    2014: "2014",
    2015: "2015",
    2016: "2016",
    2017: "2017",
    2018: "2018",
    2019: "2019",
    2023: "2023",
    2025: "2025",
}

# Special folders: paper_id prefix -> (image folder, year in DB)
SPECIAL_FOLDERS = {
    "2012practice": ("2012-practice", 2012),
    "2012sample": ("2012-sample", 2012),
    "2024": ("2024", 2024),
}


def sort_key(p):
    parts = p["paper_number"].split(".")
    return (float(parts[0]), float(parts[1]) if len(parts) > 1 else 0)


def generate_full_sequence(num_images):
    """
    Generate the full paper number sequence for a given number of images.
    DSE papers follow X.1, X.2, X.3 pattern per group.
    """
    num_groups = math.ceil(num_images / 3)
    seq = []
    for g in range(1, num_groups + 1):
        for s in range(1, 4):  # .1, .2, .3
            seq.append(f"{g}.{s}")
            if len(seq) == num_images:
                return seq
    return seq


def main():
    with open(PAPERS_JSON) as f:
        papers = json.load(f)

    by_year = defaultdict(list)
    for p in papers:
        by_year[p["year"]].append(p)

    for year in by_year:
        by_year[year].sort(key=sort_key)

    mapping = []

    for year in sorted(YEAR_TO_KEY.keys()):
        key = YEAR_TO_KEY[year]
        img_path = os.path.join(IMAGES_DIR, key)
        if not os.path.exists(img_path):
            print(f"  SKIP {year}: no images")
            continue

        imgs = sorted(
            [f for f in os.listdir(img_path) if f.endswith(".webp")]
        )
        year_papers = by_year.get(year, [])
        num_imgs = len(imgs)
        num_papers = len(year_papers)

        # Generate the full expected sequence of paper numbers
        full_seq = generate_full_sequence(num_imgs)

        # Build a lookup: paper_number -> paper data
        paper_lookup = {}
        for p in year_papers:
            paper_lookup[p["paper_number"]] = p

        # Match each image to the full sequence, then find DB paper
        matched = 0
        unmatched_pdf = []
        for i, paper_num in enumerate(full_seq):
            if i >= num_imgs:
                break
            image_file = f"{key}/{imgs[i]}"

            if paper_num in paper_lookup:
                p = paper_lookup[paper_num]
                mapping.append({
                    "paper_id": p["paper_id"],
                    "db_id": p["id"],
                    "year": year,
                    "paper_number": p["paper_number"],
                    "topic": p["topic"],
                    "image": image_file,
                })
                matched += 1
            else:
                unmatched_pdf.append(paper_num)

        if unmatched_pdf:
            print(
                f"  {year}: {num_imgs} images, {num_papers} DB papers, "
                f"{matched} matched. PDF-only (not in DB): {unmatched_pdf}"
            )
        else:
            print(f"  {year}: {num_imgs} images, {num_papers} DB papers -> all matched")

    # --- Handle special folders (practice/sample/2024) ---
    for prefix, (folder, db_year) in SPECIAL_FOLDERS.items():
        img_path = os.path.join(IMAGES_DIR, folder)
        if not os.path.exists(img_path):
            print(f"  SKIP {prefix}: no images")
            continue

        imgs = sorted([f for f in os.listdir(img_path) if f.endswith(".webp")])

        # Find papers whose paper_id starts with this prefix
        prefix_papers = sorted(
            [p for p in papers if p["paper_id"].startswith(prefix + "-")],
            key=sort_key,
        )

        # For special folders, map 1:1 by sorted order
        matched = 0
        for i, p in enumerate(prefix_papers):
            if i >= len(imgs):
                break
            mapping.append({
                "paper_id": p["paper_id"],
                "db_id": p["id"],
                "year": db_year,
                "paper_number": p["paper_number"],
                "topic": p["topic"],
                "image": f"{folder}/{imgs[i]}",
            })
            matched += 1

        print(f"  {prefix}: {len(imgs)} images, {len(prefix_papers)} DB papers, {matched} matched")

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)

    print(f"\nGenerated {len(mapping)} mappings -> {OUTPUT}")


if __name__ == "__main__":
    main()
