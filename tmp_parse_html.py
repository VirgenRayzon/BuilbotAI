import re

try:
    with open("tmp_page_source.html", "r", encoding="utf-8") as f:
        html = f.read()

    with open("parsed_out.txt", "w", encoding="utf-8") as out:
        out.write("Title of page: " + (re.search(r'<title>(.*?)</title>', html).group(1) if re.search(r'<title>(.*?)</title>', html) else "No title") + "\n")
        
        # Extract all text in the body to see what the user is seeing.
        from html.parser import HTMLParser
        class TextExtractor(HTMLParser):
            def __init__(self):
                super().__init__()
                self.texts = []
            def handle_data(self, data):
                text = data.strip()
                if text:
                    self.texts.append(text)
        
        parser = TextExtractor()
        parser.feed(html)
        out.write("Page Texts (first 100):\n" + repr(parser.texts[:100]) + "\n")

        out.write("\nNumber of a tags: " + str(html.count('<a ')) + "\n")
        # print some hrefs
        hrefs = re.findall(r'href="([^"]+)"', html)
        out.write("Hrefs:\n" + "\n".join(hrefs[:50]))

except Exception as e:
    with open("parsed_out.txt", "w") as out:
        out.write(f"Error: {e}")
