#!/usr/bin/env python3
"""
Generate individual SQL INSERT statements as separate files,
one per paper, for easy execution via Supabase MCP.
"""

import json

PAPERS_JSON = "/Users/randy/dsespeakingweb/data/pastpaper_papers.json"
ADDPP_FILE = "/Users/randy/dsespeakingweb/addpp.md"

with open(ADDPP_FILE) as f:
    new_papers = json.load(f)

with open(PAPERS_JSON) as f:
    all_papers = json.load(f)

# Build lookup by paper_id
lookup = {p["paper_id"]: p for p in all_papers}

new_ids = {p["paper_id"] for p in new_papers}

for pid in sorted(new_ids):
    p = lookup[pid]
    
    def esc(s):
        if s is None:
            return "NULL"
        return "'" + str(s).replace("'", "''") + "'"

    sql = f"""INSERT INTO pastpaper_papers (id, year, paper_number, paper_id, topic, part_a_title, part_a_source, part_a_article, part_a_discussion_points, part_b_questions, created_at, updated_at) VALUES ({esc(p['id'])}, {p['year']}, {esc(p['paper_number'])}, {esc(p['paper_id'])}, {esc(p['topic'])}, {esc(p.get('part_a_title',''))}, {esc(p.get('part_a_source',''))}, {esc(json.dumps(p.get('part_a_article',[]), ensure_ascii=False))}::jsonb, {esc(json.dumps(p.get('part_a_discussion_points',[]), ensure_ascii=False))}::jsonb, {esc(json.dumps(p.get('part_b_questions',[]), ensure_ascii=False))}::jsonb, {esc(p['created_at'])}, {esc(p['updated_at'])});"""
    
    print(f"--- {pid} ---")
    print(sql[:200] + "...")
    print()
