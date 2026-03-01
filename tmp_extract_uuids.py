import re
import json

with open("tmp_page_source.html", "r", encoding="utf-8") as f:
    text = f.read()

# find all UUIDs
pattern = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
uuids = list(set(re.findall(pattern, text)))

with open("extracted_uuids.txt", "w", encoding="utf-8") as out:
    out.write(f"Found {len(uuids)} unique UUIDs.\n")
    for uuid in uuids:
        out.write(f"\n--- UUID: {uuid} ---\n")
        # find occurrences
        for match in re.finditer(uuid, text):
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            out.write(f"Context: {text[start:end]}\n")

