#!/usr/bin/env python3
"""
Generate SQL statements using ARRAY[] syntax and E'' strings for MCP execute_sql.
Output one file per statement.
"""

import json
import os

PAPERS_JSON = "/Users/randy/dsespeakingweb/data/pastpaper_papers.json"
ADDPP_FILE = "/Users/randy/dsespeakingweb/addpp.md"
OUTPUT_DIR = "/Users/randy/dsespeakingweb/data/mcp_stmts"

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(ADDPP_FILE) as f:
    new_papers = json.load(f)

with open(PAPERS_JSON) as f:
    all_papers = json.load(f)

lookup = {p["paper_id"]: p for p in all_papers}

# Skip 2016-4.1 (already inserted)
skip = {"2016-4.1"}


def esc(s):
    """Escape a string for PostgreSQL E'' literal."""
    if s is None:
        return "NULL"
    escaped = str(s).replace("'", "''").replace("\\", "\\\\")
    return "E'" + escaped + "'"


def esc_simple(s):
    """Simple escape for strings without special chars."""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def text_array(arr):
    """Convert list to ARRAY[E'...', E'...'] syntax."""
    if not arr:
        return "ARRAY[]::text[]"
    elements = [esc(item) for item in arr]
    return "ARRAY[" + ", ".join(elements) + "]"


def jsonb_val(obj):
    """Convert Python object to jsonb literal."""
    s = json.dumps(obj, ensure_ascii=False).replace("'", "''")
    return "'" + s + "'::jsonb"


count = 0
# Also generate combined batches for efficiency
batches = []
current_batch = []

for np in new_papers:
    pid = np["paper_id"]
    if pid in skip:
        continue

    p = lookup[pid]

    sql = (
        f"INSERT INTO pastpaper_papers "
        f"(id, year, paper_number, paper_id, topic, part_a_title, part_a_source, "
        f"part_a_article, part_a_discussion_points, part_b_questions, created_at, updated_at) "
        f"VALUES ("
        f"{esc_simple(p['id'])}, {p['year']}, {esc_simple(p['paper_number'])}, {esc_simple(p['paper_id'])}, "
        f"{esc(p['topic'])}, {esc(p.get('part_a_title',''))}, {esc(p.get('part_a_source',''))}, "
        f"{text_array(p.get('part_a_article', []))}, "
        f"{text_array(p.get('part_a_discussion_points', []))}, "
        f"{jsonb_val(p.get('part_b_questions', []))}, "
        f"{esc_simple(p['created_at'])}, {esc_simple(p['updated_at'])})"
    )

    fname = os.path.join(OUTPUT_DIR, f"{count:02d}_{pid.replace('-','_')}.sql")
    with open(fname, "w", encoding="utf-8") as f:
        f.write(sql + ";")

    current_batch.append(sql)
    if len(current_batch) >= 3:
        batches.append(current_batch)
        current_batch = []

    count += 1

if current_batch:
    batches.append(current_batch)

# Write batch files
for i, batch in enumerate(batches):
    fname = os.path.join(OUTPUT_DIR, f"batch_{i:02d}.sql")
    with open(fname, "w", encoding="utf-8") as f:
        f.write(";\n".join(batch) + ";")

print(f"Generated {count} statements, {len(batches)} batches")
for i, batch in enumerate(batches):
    pids = [b.split("'")[7] for b in batch]  # extract paper_ids
    print(f"  Batch {i}: {len(batch)} statements")
