#!/usr/bin/env python3
"""
Import new papers from addpp.md into pastpaper_papers.json.
Adds UUID, timestamps, and merges with existing data.
Also generates SQL INSERT statements for Supabase.
"""

import json
import uuid
from datetime import datetime, timezone

ADDPP_FILE = "/Users/randy/dsespeakingweb/addpp.md"
PAPERS_JSON = "/Users/randy/dsespeakingweb/data/pastpaper_papers.json"
SQL_OUTPUT = "/Users/randy/dsespeakingweb/data/insert_new_papers.sql"


def main():
    with open(ADDPP_FILE) as f:
        new_papers = json.load(f)

    with open(PAPERS_JSON) as f:
        existing = json.load(f)

    # Build set of existing paper_ids
    existing_ids = {p["paper_id"] for p in existing}
    print(f"Existing papers: {len(existing)}")
    print(f"New papers to add: {len(new_papers)}")

    now = datetime.now(timezone.utc).isoformat()
    added = []
    skipped = []

    for p in new_papers:
        if p["paper_id"] in existing_ids:
            skipped.append(p["paper_id"])
            continue

        # Add required fields
        p["id"] = str(uuid.uuid4())
        p["created_at"] = now
        p["updated_at"] = now

        existing.append(p)
        added.append(p["paper_id"])

    if skipped:
        print(f"\nSkipped (already exist): {skipped}")

    print(f"\nAdded {len(added)} new papers:")
    for pid in added:
        print(f"  + {pid}")

    # Save merged JSON
    with open(PAPERS_JSON, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {PAPERS_JSON} ({len(existing)} total)")

    # Generate SQL for Supabase
    sql_lines = []
    for p in existing:
        if p["paper_id"] not in added:
            continue

        # Escape single quotes in strings
        def esc(s):
            if s is None:
                return "NULL"
            return "'" + str(s).replace("'", "''") + "'"

        sql = f"""INSERT INTO pastpaper_papers (
  id, year, paper_number, paper_id, topic,
  part_a_title, part_a_source, part_a_article,
  part_a_discussion_points, part_b_questions,
  created_at, updated_at
) VALUES (
  {esc(p['id'])}, {p['year']}, {esc(p['paper_number'])}, {esc(p['paper_id'])}, {esc(p['topic'])},
  {esc(p.get('part_a_title',''))}, {esc(p.get('part_a_source',''))},
  {esc(json.dumps(p.get('part_a_article',[]), ensure_ascii=False))}::jsonb,
  {esc(json.dumps(p.get('part_a_discussion_points',[]), ensure_ascii=False))}::jsonb,
  {esc(json.dumps(p.get('part_b_questions',[]), ensure_ascii=False))}::jsonb,
  {esc(p['created_at'])}, {esc(p['updated_at'])}
);"""
        sql_lines.append(sql)

    with open(SQL_OUTPUT, "w", encoding="utf-8") as f:
        f.write("\n\n".join(sql_lines))
    print(f"SQL file saved: {SQL_OUTPUT} ({len(sql_lines)} statements)")


if __name__ == "__main__":
    main()
