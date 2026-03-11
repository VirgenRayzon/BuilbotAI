import sys
import os
import requests
import re
from datetime import datetime

def clean_html(html_content):
    """
    Performs basic HTML cleaning to extract readable text.
    """
    # Remove script and style elements
    script_re = re.compile('<script.*?>.*?</script>', re.DOTALL | re.IGNORECASE)
    style_re = re.compile('<style.*?>.*?</style>', re.DOTALL | re.IGNORECASE)
    html_content = script_re.sub('', html_content)
    html_content = style_re.sub('', html_content)

    # Process common tags into markdown-ish formatting
    html_content = re.sub(r'<h[1-6].*?>(.*?)</h[1-6]>', r'\n\n# \1\n', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<p.*?>', r'\n\n', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<br\s*/?>', r'\n', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<li>', r'\n- ', html_content, flags=re.IGNORECASE)

    # Strip remaining tags
    clean_re = re.compile('<.*?>', re.DOTALL)
    text = clean_re.sub('', html_content)

    # Clean up whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = text.strip()
    
    return text

def main():
    if len(sys.argv) < 3:
        print("Usage: python execution/ingest_website.py <URL> <FILENAME_WITHOUT_EXTENSION>")
        sys.exit(1)

    url = sys.argv[1]
    filename = sys.argv[2]
    
    # Ensure filename has .md extension
    if not filename.endswith('.md'):
        filename += '.md'

    # Target directory
    target_dir = os.path.join(os.getcwd(), 'src', 'knowledge')
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        
    target_path = os.path.join(target_dir, filename)

    print(f"Fetching {url}...")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        raw_content = response.text
        cleaned_text = clean_html(raw_content)
        
        # Add a header with the source info
        header = f"---\nSource: {url}\nIngested: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n---\n\n"
        
        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(header + cleaned_text)
            
        print(f"Successfully ingested knowledge to: {target_path}")

    except Exception as e:
        print(f"Error during ingestion: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
