#!/usr/bin/env python3
"""
Generate correct SQL INSERT statements with proper types:
  - part_a_article: text[] (ARRAY)
  - part_a_discussion_points: text[] (ARRAY)  
  - part_b_questions: jsonb
"""

import json

PAPERS_JSON = "/Users/randy/dsespeakingweb/data/pastpaper_papers.json"
ADDPP_FILE = "/Users/randy/dsespeakingweb/addpp.md"
OUTPUT = "/Users/randy/dsespeakingweb/data/insert_correct.sql"

with open(ADDPP_FILE) as f:
    new_papers = json.load(f)

with open(PAPERS_JSON) as f:
    all_papers = json.load(f)

lookup = {p["paper_id"]: p for p in all_papers}
new_ids = [p["paper_id"] for p in new_papers]


def esc(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def text_array(arr):
    """Convert Python list to PostgreSQL text[] literal."""
    if not arr:
        return "'{}'::text[]"
    elements = []
    for item in arr:
        # Escape backslashes and double quotes for PostgreSQL array
        escaped = str(item).replace("\\", "\\\\").replace('"', '\\"').replace("'", "''")
        elements.append(f'"{escaped}"')
    return "'{" + ",".join(elements) + "}'::text[]"


statements = []
for pid in new_ids:
    p = lookup[pid]
    
    article = text_array(p.get("part_a_article", []))
    discussion = text_array(p.get("part_a_discussion_points", []))
    questions = esc(json.dumps(p.get("part_b_questions", []), ensure_ascii=False)) + "::jsonb"
    
    sql = (
        f"INSERT INTO pastpaper_papers "
        f"(id, year, paper_number, paper_id, topic, part_a_title, part_a_source, "
        f"part_a_article, part_a_discussion_points, part_b_questions, created_at, updated_at) "
        f"VALUES ("
        f"{esc(p['id'])}, {p['year']}, {esc(p['paper_number'])}, {esc(p['paper_id'])}, "
        f"{esc(p['topic'])}, {esc(p.get('part_a_title',''))}, {esc(p.get('part_a_source',''))}, "
        f"{article}, {discussion}, {questions}, "
        f"{esc(p['created_at'])}, {esc(p['updated_at'])})"
    )
    statements.append(sql)

# Write all as one big transaction
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("BEGIN;\n")
    for s in statements:
        f.write(s + ";\n")
    f.write("COMMIT;\n")

print(f"Generated {len(statements)} statements -> {OUTPUT}")

# Also write individual files for MCP execution
for i, s in enumerate(statements):
    fname = f"/Users/randy/dsespeakingweb/data/stmt_{i}.sql"
    with open(fname, "w", encoding="utf-8") as f:
        f.write(s + ";")

print("Individual statement files also saved.")
