#!/usr/bin/env python3
"""
Convert DSE Speaking Past Paper PDFs to WebP images.
Only keeps specified pages per file (odd pages for some, all for others).
"""

import fitz  # pymupdf
import os
import json

PDF_DIR = "/Users/randy/Desktop/dsepastpaper"
OUTPUT_DIR = "/Users/randy/dsespeakingweb/data/images"

# Page rules: "odd" = odd pages only, "all" = all pages
PDF_RULES = {
    "2012 Practice Paper.pdf": {"key": "2012-practice", "pages": "odd"},
    "2012 Sample Paper.pdf":   {"key": "2012-sample",   "pages": "all"},
    "2012.pdf":                {"key": "2012",           "pages": "odd"},
    "2013.pdf":                {"key": "2013",           "pages": "odd"},
    "2014.pdf":                {"key": "2014",           "pages": "all"},
    "2015.pdf":                {"key": "2015",           "pages": "odd"},
    "2016.pdf":                {"key": "2016",           "pages": "all"},
    "2017.pdf":                {"key": "2017",           "pages": "all"},
    "2018.pdf":                {"key": "2018",           "pages": "all"},
    "2019.pdf":                {"key": "2019",           "pages": "all"},
    "2023.pdf":                {"key": "2023",           "pages": "odd"},
    "2024.pdf":                {"key": "2024",           "pages": "odd"},
    "2025 P4.pdf":             {"key": "2025",           "pages": "odd"},
}

DPI = 200  # Resolution
QUALITY = 85  # WebP quality


def convert_pdf(pdf_path, key, page_rule):
    """Convert a PDF to WebP images, returns list of (original_page, output_path)."""
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    out_dir = os.path.join(OUTPUT_DIR, key)
    os.makedirs(out_dir, exist_ok=True)

    results = []
    img_index = 1

    for page_num in range(total_pages):
        # page_num is 0-indexed, actual page is page_num + 1
        actual_page = page_num + 1

        if page_rule == "odd" and actual_page % 2 == 0:
            continue  # Skip even pages

        page = doc[page_num]
        # Render at specified DPI
        zoom = DPI / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)

        out_file = os.path.join(out_dir, f"page-{img_index:02d}.webp")
        # Save as WebP via PIL
        from PIL import Image
        import io
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))
        img.save(out_file, "WEBP", quality=QUALITY)

        results.append({
            "original_page": actual_page,
            "image": f"{key}/page-{img_index:02d}.webp",
            "file": out_file,
        })
        img_index += 1

    doc.close()
    return results


def main():
    all_results = {}
    total_images = 0

    for pdf_name, rule in PDF_RULES.items():
        pdf_path = os.path.join(PDF_DIR, pdf_name)
        if not os.path.exists(pdf_path):
            print(f"  SKIP (not found): {pdf_name}")
            continue

        key = rule["key"]
        page_rule = rule["pages"]
        print(f"Processing {pdf_name} -> {key}/ ({page_rule} pages)...")

        results = convert_pdf(pdf_path, key, page_rule)
        all_results[key] = results
        total_images += len(results)
        print(f"  -> {len(results)} images")

    # Generate mapping template
    template = []
    for key, results in all_results.items():
        template.append({
            "pdf_key": key,
            "total_images": len(results),
            "images": [r["image"] for r in results],
            "papers": [
                {
                    "paper_id": "FILL_IN",
                    "image_indices": "FILL_IN e.g. [1, 2]",
                    "comment": ""
                }
            ]
        })

    template_path = os.path.join(
        "/Users/randy/dsespeakingweb/data", "page_mapping_template.json"
    )
    with open(template_path, "w", encoding="utf-8") as f:
        json.dump(template, f, indent=2, ensure_ascii=False)

    print(f"\nDone! {total_images} images total.")
    print(f"Mapping template: {template_path}")
    print("Fill in paper_id and image_indices for each paper in the template.")


if __name__ == "__main__":
    main()
