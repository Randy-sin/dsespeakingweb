#!/usr/bin/env python3
"""
Insert new papers directly via Supabase REST API.
"""

import json
import requests

SUPABASE_URL = "https://wkhqphemaatzdnscnnyd.supabase.co"
# Use service role key for direct insert (bypasses RLS)
# We'll use the anon key since RLS might allow inserts
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraHFwaGVtYWF0emRuc2NubnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDU3NDgsImV4cCI6MjA4NjM4MTc0OH0.FHNzYKfwhIHOehhtFwO5WTWcfvVoiih9b8YfBJNZOs0"

ADDPP_FILE = "/Users/randy/dsespeakingweb/addpp.md"
PAPERS_JSON = "/Users/randy/dsespeakingweb/data/pastpaper_papers.json"

with open(ADDPP_FILE) as f:
    new_papers = json.load(f)

with open(PAPERS_JSON) as f:
    all_papers = json.load(f)

# Build lookup
lookup = {p["paper_id"]: p for p in all_papers}

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

success = 0
failed = 0

for np in new_papers:
    pid = np["paper_id"]
    p = lookup.get(pid)
    if not p:
        print(f"  SKIP {pid}: not found in lookup")
        continue

    row = {
        "id": p["id"],
        "year": p["year"],
        "paper_number": p["paper_number"],
        "paper_id": p["paper_id"],
        "topic": p["topic"],
        "part_a_title": p.get("part_a_title", ""),
        "part_a_source": p.get("part_a_source", ""),
        "part_a_article": p.get("part_a_article", []),
        "part_a_discussion_points": p.get("part_a_discussion_points", []),
        "part_b_questions": p.get("part_b_questions", []),
        "created_at": p["created_at"],
        "updated_at": p["updated_at"],
    }

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/pastpaper_papers",
        headers=headers,
        json=row,
    )

    if resp.status_code in (200, 201):
        success += 1
        print(f"  OK  {pid}")
    else:
        # Try to see if it's already inserted
        if "duplicate" in resp.text.lower() or "23505" in resp.text:
            print(f"  DUP {pid} (already exists)")
            success += 1
        else:
            failed += 1
            print(f"  ERR {pid}: {resp.status_code} {resp.text[:200]}")

print(f"\nDone: {success} success, {failed} failed")
