import re

with open("tmp_page_source.html", "r", encoding="utf-8") as f:
    text = f.read()

pattern = r'id="project-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-title">\s*(.*?)\s*</span>'
matches = re.finditer(pattern, text)

notebooks = []
for match in matches:
    uuid = match.group(1)
    title = match.group(2)
    notebooks.append(f"- {title} (ID: {uuid})")

with open("final_notebooks.txt", "w", encoding="utf-8") as out:
    out.write("\n".join(notebooks))
