# Directive: Ingest Knowledge

## Goal
Ingest content from articles, websites, or technical documents into the BuildbotAI local knowledge base (`src/knowledge/`) to improve the chatbot's expertise.

## Process
1.  **Identify Source:** Find a URL or text content relevant to PC building, component compatibility, or hardware performance.
2.  **Run Ingestion Script:** Use the `execution/ingest_website.py` script to fetch and clean the content.
    - **Command:** `python execution/ingest_website.py <URL> <FILENAME_WITHOUT_EXTENSION>`
    - **Example:** `python execution/ingest_website.py https://example.com/gpu-guide gpu-benchmarks`
3.  **Manual Cleanup (Optional):** Open the resulting file in `src/knowledge/` and remove any remaining navigation text or ads to keep the knowledge base high-quality.
4.  **Verification:** Ask the Buildbot chatbot a question related to the new data to ensure it can "find" and use the information.

## Inputs
- `URL`: The web page to scrape.
- `FILENAME`: The name of the file to save in `src/knowledge/`.

## Outputs
- A new `.md` file in `src/knowledge/`.
