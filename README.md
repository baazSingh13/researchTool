# Research Intelligence Agent

A static prototype for a lawful scholarly discovery and research-analysis platform.

## Run locally

Run the local server to enable live scholarly API search:

```bash
python3 server.py
```

Then visit `http://127.0.0.1:4173`.

You can also open `index.html` directly or view the GitHub Pages/static version. In static mode, the app searches CORS-friendly public APIs from the browser, currently OpenAlex and Crossref. arXiv, DBLP, Semantic Scholar, and future licensed connectors work best through `server.py` or a hosted backend service.

## Included

- Natural-language research instruction planner
- Source toggles for arXiv, DBLP, Crossref, OpenAlex, Semantic Scholar, Springer, PubMed, and CORE
- Lawful access ledger with download decisions
- Paper result cards with access status
- Live metadata search through arXiv, DBLP, Crossref, OpenAlex, and Semantic Scholar
- Literature matrix
- Draft cited report view
- Citation graph canvas
- BibTeX and RIS export buttons

Springer, PubMed, and CORE are shown in the UI as planned connectors. Springer requires official API credentials/licensing for full text; PubMed and CORE can be added next.
