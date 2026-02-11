#!/usr/bin/env python3
"""
Generate an HTML preview page to visually verify paper-image mapping.
Open the output HTML in a browser to check each mapping.
"""

import json
import os
from collections import defaultdict

MAPPING_FILE = "/Users/randy/dsespeakingweb/data/paper_page_mapping.json"
IMAGES_DIR = "/Users/randy/dsespeakingweb/data/images"
OUTPUT_HTML = "/Users/randy/dsespeakingweb/data/mapping_preview.html"

with open(MAPPING_FILE) as f:
    mapping = json.load(f)

# Group by year
by_year = defaultdict(list)
for entry in mapping:
    by_year[entry["year"]].append(entry)

html = """<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Paper-Image Mapping Preview</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 1400px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
  h1 { font-size: 24px; }
  h2 { font-size: 18px; margin-top: 40px; border-bottom: 2px solid #333; padding-bottom: 8px; }
  .note { font-size: 13px; color: #666; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 16px; }
  .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .card img { width: 100%; height: auto; display: block; border-bottom: 1px solid #eee; }
  .card .info { padding: 10px 12px; }
  .card .pid { font-weight: 600; font-size: 14px; color: #111; }
  .card .topic { font-size: 13px; color: #666; margin-top: 2px; }
  .card .file { font-size: 11px; color: #aaa; margin-top: 4px; font-family: monospace; }
  .ok { border-left: 4px solid #4caf50; }
  .summary { background: white; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
  .summary span { font-weight: 600; }
  .tip { background: #e3f2fd; padding: 12px; border-radius: 8px; margin-top: 8px; font-size: 13px; }
</style>
</head><body>
<h1>Paper-Image Mapping Preview</h1>
<div class="summary">
  <p>Total mappings: <span>""" + str(len(mapping)) + """</span></p>
  <p>Verify: the paper number printed on the image (top-right corner of each exam sheet) should match the paper_number shown below it.</p>
</div>
<div class="tip">
  Mapping method: images are ordered sequentially (1.1, 1.2, 1.3, 2.1, 2.2, 2.3, ...).
  Papers NOT in the database are skipped, ensuring correct alignment.
</div>
"""

for year in sorted(by_year.keys()):
    entries = by_year[year]
    html += f'<h2>{year} ({len(entries)} papers mapped)</h2>\n'
    html += '<div class="grid">\n'

    for entry in entries:
        img_path = entry.get("image")

        if img_path:
            abs_img = os.path.join(IMAGES_DIR, img_path)
            img_url = f"file://{abs_img}"
            img_tag = f'<img src="{img_url}" loading="lazy">'
        else:
            img_tag = '<div style="height:200px;background:#fee;display:flex;align-items:center;justify-content:center;color:red;">NO IMAGE</div>'

        html += f'''  <div class="card ok">
    {img_tag}
    <div class="info">
      <div class="pid">{entry["paper_id"]} &mdash; {entry["paper_number"]}</div>
      <div class="topic">{entry["topic"]}</div>
      <div class="file">{img_path or "N/A"}</div>
    </div>
  </div>\n'''

    html += '</div>\n'

html += '</body></html>'

with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Preview generated: {OUTPUT_HTML}")
