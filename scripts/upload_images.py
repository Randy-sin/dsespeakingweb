#!/usr/bin/env python3
"""
Upload paper images to Supabase Storage and update page_images column.
- service_role key bypasses RLS
- 4 threads + retry + resume (skips already uploaded)
- tqdm progress bar
"""

import json, os, time
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from tqdm import tqdm

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://wkhqphemaatzdnscnnyd.supabase.co")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SERVICE_KEY:
    # Fallback: load from .env.local
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    SERVICE_KEY = line.strip().split("=", 1)[1].strip().strip('"')
                    break
MAPPING_FILE = "data/paper_page_mapping.json"
IMAGES_DIR = "data/images"
BUCKET = "paper-images"
DONE_FILE = "data/.upload_done.json"  # resume checkpoint

PREFIX_TO_FOLDER = {
    "2012sample": "2012-sample", "2012practice": "2012-practice",
    "2012": "2012", "2013": "2013", "2014": "2014", "2015": "2015",
    "2016": "2016", "2017": "2017", "2018": "2018", "2019": "2019",
    "2023": "2023", "2024": "2024", "2025": "2025",
}

def expected_folder(pid):
    for prefix, folder in sorted(PREFIX_TO_FOLDER.items(), key=lambda x: -len(x[0])):
        if pid.startswith(prefix + "-") or pid == prefix:
            return folder
    return None

def make_session():
    s = requests.Session()
    retry = Retry(total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    s.mount("https://", HTTPAdapter(max_retries=retry))
    s.headers.update({"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
    return s

def upload_one(session, img_rel):
    local_path = os.path.join(IMAGES_DIR, img_rel)
    if not os.path.exists(local_path):
        return img_rel, None
    for attempt in range(3):
        try:
            with open(local_path, "rb") as f:
                r = session.post(
                    f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{img_rel}",
                    headers={"Content-Type": "image/webp", "x-upsert": "true"},
                    data=f,
                    timeout=30,
                )
            if r.status_code in (200, 201):
                return img_rel, f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{img_rel}"
            else:
                return img_rel, None
        except Exception:
            time.sleep(2 ** attempt)
    return img_rel, None

def main():
    if not SERVICE_KEY:
        print("ERROR: Set SUPABASE_SERVICE_ROLE_KEY in .env.local or env")
        return
    with open(MAPPING_FILE) as f:
        mapping = json.load(f)

    by_pid = {}
    for e in mapping:
        pid, img = e["paper_id"], e["image"]
        folder = expected_folder(pid)
        if folder and not img.startswith(folder + "/"):
            continue
        if pid not in by_pid:
            by_pid[pid] = {"db_id": e["db_id"], "images": []}
        if img not in by_pid[pid]["images"]:
            by_pid[pid]["images"].append(img)

    all_images = sorted({img for d in by_pid.values() for img in d["images"]})

    # Load checkpoint
    done = {}
    if os.path.exists(DONE_FILE):
        with open(DONE_FILE) as f:
            done = json.load(f)
    todo = [img for img in all_images if img not in done]
    print(f"\n=== {len(all_images)} total, {len(done)} already done, {len(todo)} to upload ===\n")

    if todo:
        session = make_session()
        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = {pool.submit(upload_one, session, img): img for img in todo}
            for future in tqdm(as_completed(futures), total=len(futures), desc="Uploading", unit="img", ncols=80):
                img_rel, url = future.result()
                if url:
                    done[img_rel] = url
                    # Save checkpoint every 10
                    if len(done) % 10 == 0:
                        with open(DONE_FILE, "w") as f:
                            json.dump(done, f)
        # Final save
        with open(DONE_FILE, "w") as f:
            json.dump(done, f)

    ok = sum(1 for img in all_images if img in done)
    fail = len(all_images) - ok
    print(f"\nUpload: {ok} ok, {fail} failed")

    # Update DB
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    updated = 0
    for pid, data in tqdm(by_pid.items(), desc="Updating DB", unit="paper", ncols=80):
        urls = [done[img] for img in data["images"] if img in done]
        if not urls:
            continue
        try:
            r = requests.patch(
                f"{SUPABASE_URL}/rest/v1/pastpaper_papers?id=eq.{data['db_id']}",
                headers=headers, json={"page_images": urls}, timeout=10,
            )
            if r.status_code in (200, 204):
                updated += 1
        except Exception:
            pass

    print(f"\nDone! {updated} papers updated with Storage URLs.\n")

if __name__ == "__main__":
    main()
