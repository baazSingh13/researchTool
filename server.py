#!/usr/bin/env python3
"""Local server for the Research Intelligence Agent prototype.

It serves the static UI and provides a small dependency-free /api/search endpoint
for lawful scholarly metadata discovery. Full-text URLs are surfaced only when a
source advertises an open-access or otherwise authorized location.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
USER_AGENT = "ResearchIntelligenceAgent/0.1 (mailto:example@example.com)"


def fetch_json(url: str, timeout: int = 12) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_xml(url: str, timeout: int = 12) -> ET.Element:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return ET.fromstring(response.read())


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def title_key(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", title.lower())[:120]


def author_names(authors: Any) -> str:
    names: list[str] = []
    if not isinstance(authors, list):
        return ""
    for author in authors[:8]:
        if isinstance(author, dict):
            if "name" in author:
                names.append(clean_text(author.get("name")))
            elif "author" in author and isinstance(author["author"], dict):
                names.append(clean_text(author["author"].get("display_name")))
            elif "given" in author or "family" in author:
                names.append(clean_text(f"{author.get('given', '')} {author.get('family', '')}"))
    return ", ".join([name for name in names if name])


def default_work(**kwargs: Any) -> dict[str, Any]:
    work = {
        "id": "",
        "title": "Untitled work",
        "authors": "Unknown authors",
        "year": 0,
        "venue": "Unknown venue",
        "sources": [],
        "doi": "",
        "type": "research article",
        "platform": "Not extracted yet",
        "neuron": "Not extracted yet",
        "dataset": "Not extracted yet",
        "limitations": "Requires document analysis after authorized full text is available.",
        "access": "Metadata and abstract only",
        "license": "Unknown",
        "pdf": False,
        "fullTextUrl": "",
        "pages": "metadata record",
        "abstract": "No abstract available from this source.",
        "citations": 0,
    }
    work.update(kwargs)
    return work


def search_arxiv(topic: str, date_from: int, limit: int) -> list[dict[str, Any]]:
    query = urllib.parse.quote(f'all:"{topic}"')
    url = f"https://export.arxiv.org/api/query?search_query={query}&start=0&max_results={limit}&sortBy=relevance"
    root = fetch_xml(url)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    results: list[dict[str, Any]] = []
    for entry in root.findall("atom:entry", ns):
        published = clean_text(entry.findtext("atom:published", default="", namespaces=ns))
        year = int(published[:4] or 0)
        if year and year < date_from:
            continue
        title = clean_text(entry.findtext("atom:title", default="", namespaces=ns))
        summary = clean_text(entry.findtext("atom:summary", default="", namespaces=ns))
        authors = ", ".join(
            clean_text(author.findtext("atom:name", default="", namespaces=ns))
            for author in entry.findall("atom:author", ns)
        )
        pdf_url = ""
        for link in entry.findall("atom:link", ns):
            if link.attrib.get("title") == "pdf":
                pdf_url = link.attrib.get("href", "")
        results.append(
            default_work(
                title=title,
                authors=authors or "Unknown authors",
                year=year,
                venue="arXiv",
                sources=["arXiv"],
                type="preprint",
                access="Open-access full text",
                license="arXiv distribution license",
                pdf=bool(pdf_url),
                fullTextUrl=pdf_url,
                abstract=summary,
                pages="arXiv e-print",
            )
        )
    return results


def search_openalex(topic: str, date_from: int, limit: int) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode(
        {
            "search": topic,
            "filter": f"from_publication_date:{date_from}-01-01",
            "per-page": limit,
        }
    )
    data = fetch_json(f"https://api.openalex.org/works?{params}")
    results: list[dict[str, Any]] = []
    for item in data.get("results", []):
        primary_location = item.get("primary_location") or {}
        source = primary_location.get("source") or {}
        venue = clean_text(source.get("display_name")) or "OpenAlex"
        oa = item.get("open_access") or {}
        best_oa = item.get("best_oa_location") or {}
        pdf_url = clean_text(best_oa.get("pdf_url") or best_oa.get("landing_page_url"))
        doi = clean_text(item.get("doi")).replace("https://doi.org/", "")
        abstract = inverted_abstract(item.get("abstract_inverted_index")) or "No abstract available from OpenAlex."
        is_oa = bool(oa.get("is_oa"))
        results.append(
            default_work(
                title=clean_text(item.get("display_name")) or "Untitled work",
                authors=author_names(item.get("authorships")) or "Unknown authors",
                year=int(item.get("publication_year") or 0),
                venue=venue,
                sources=["OpenAlex"],
                doi=doi,
                type=clean_text(item.get("type_crossref") or item.get("type") or "research article"),
                access="Open-access full text" if is_oa and pdf_url else ("Publisher page available" if primary_location else "Metadata and abstract only"),
                license=clean_text(best_oa.get("license") or "Unknown"),
                pdf=bool(is_oa and pdf_url),
                fullTextUrl=pdf_url if is_oa else "",
                abstract=abstract,
                citations=int(item.get("cited_by_count") or 0),
            )
        )
    return results


def inverted_abstract(index: Any) -> str:
    if not isinstance(index, dict):
        return ""
    words: list[tuple[int, str]] = []
    for word, positions in index.items():
        for position in positions:
            words.append((int(position), word))
    return clean_text(" ".join(word for _, word in sorted(words)))


def search_crossref(topic: str, date_from: int, limit: int) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode(
        {
            "query": topic,
            "filter": f"from-pub-date:{date_from}-01-01",
            "rows": limit,
        }
    )
    data = fetch_json(f"https://api.crossref.org/works?{params}")
    results: list[dict[str, Any]] = []
    for item in data.get("message", {}).get("items", []):
        title = clean_text((item.get("title") or ["Untitled work"])[0])
        year_parts = ((item.get("published-print") or item.get("published-online") or item.get("created") or {}).get("date-parts") or [[0]])
        year = int((year_parts[0] or [0])[0] or 0)
        links = item.get("link") or []
        pdf_url = ""
        for link in links:
            if "pdf" in clean_text(link.get("content-type")).lower():
                pdf_url = clean_text(link.get("URL"))
                break
        results.append(
            default_work(
                title=title,
                authors=author_names(item.get("author")) or "Unknown authors",
                year=year,
                venue=clean_text((item.get("container-title") or ["Crossref"])[0]) or "Crossref",
                sources=["Crossref"],
                doi=clean_text(item.get("DOI")),
                type=clean_text(item.get("type") or "research article"),
                access="Open-access full text" if pdf_url else "Publisher page available",
                license=clean_text(((item.get("license") or [{}])[0]).get("URL") or "Unknown"),
                pdf=bool(pdf_url),
                fullTextUrl=pdf_url,
                abstract=clean_text(re.sub("<[^>]+>", "", item.get("abstract") or "")) or "No abstract available from Crossref.",
                citations=int(item.get("is-referenced-by-count") or 0),
            )
        )
    return results


def search_dblp(topic: str, date_from: int, limit: int) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode({"q": topic, "format": "json", "h": limit})
    data = fetch_json(f"https://dblp.org/search/publ/api?{params}")
    hits = data.get("result", {}).get("hits", {}).get("hit", [])
    results: list[dict[str, Any]] = []
    for hit in hits:
        info = hit.get("info", {})
        year = int(info.get("year") or 0)
        if year and year < date_from:
            continue
        authors = info.get("authors", {}).get("author", [])
        if isinstance(authors, dict):
            authors = [authors]
        results.append(
            default_work(
                title=clean_text(info.get("title")) or "Untitled work",
                authors=", ".join(clean_text(author.get("text")) for author in authors[:8]) or "Unknown authors",
                year=year,
                venue=clean_text(info.get("venue")) or "DBLP",
                sources=["DBLP"],
                doi=clean_text(info.get("doi")),
                type="conference paper" if info.get("type") == "Conference and Workshop Papers" else "research article",
                access="Publisher page available" if info.get("url") else "Metadata and abstract only",
                fullTextUrl=clean_text(info.get("ee") or info.get("url")),
                abstract="DBLP provides bibliographic metadata; resolve DOI or linked repository for full text.",
            )
        )
    return results


def search_semantic_scholar(topic: str, date_from: int, limit: int) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode(
        {
            "query": topic,
            "limit": limit,
            "fields": "title,authors,year,venue,abstract,externalIds,citationCount,openAccessPdf,url,publicationTypes",
        }
    )
    data = fetch_json(f"https://api.semanticscholar.org/graph/v1/paper/search?{params}")
    results: list[dict[str, Any]] = []
    for item in data.get("data", []):
        year = int(item.get("year") or 0)
        if year and year < date_from:
            continue
        pdf_url = clean_text((item.get("openAccessPdf") or {}).get("url"))
        external = item.get("externalIds") or {}
        results.append(
            default_work(
                title=clean_text(item.get("title")) or "Untitled work",
                authors=author_names(item.get("authors")) or "Unknown authors",
                year=year,
                venue=clean_text(item.get("venue")) or "Semantic Scholar",
                sources=["Semantic Scholar"],
                doi=clean_text(external.get("DOI")),
                type=clean_text((item.get("publicationTypes") or ["research article"])[0]).lower(),
                access="Open-access full text" if pdf_url else "Metadata and abstract only",
                license="Unknown",
                pdf=bool(pdf_url),
                fullTextUrl=pdf_url,
                abstract=clean_text(item.get("abstract")) or "No abstract available from Semantic Scholar.",
                citations=int(item.get("citationCount") or 0),
            )
        )
    return results


SEARCHERS = {
    "arXiv": search_arxiv,
    "OpenAlex": search_openalex,
    "Crossref": search_crossref,
    "DBLP": search_dblp,
    "Semantic Scholar": search_semantic_scholar,
}


def dedupe(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_key: dict[str, dict[str, Any]] = {}
    for item in items:
        key = item.get("doi") or title_key(item.get("title", ""))
        if not key:
            continue
        existing = by_key.get(key)
        if not existing:
            by_key[key] = item
            continue
        existing_sources = set(existing.get("sources", []))
        existing_sources.update(item.get("sources", []))
        existing["sources"] = sorted(existing_sources)
        if not existing.get("pdf") and item.get("pdf"):
            existing.update({k: item[k] for k in ["access", "license", "pdf", "fullTextUrl", "pages"] if k in item})
        if len(item.get("abstract", "")) > len(existing.get("abstract", "")):
            existing["abstract"] = item["abstract"]
        existing["citations"] = max(int(existing.get("citations") or 0), int(item.get("citations") or 0))
    results = list(by_key.values())
    for index, item in enumerate(results, start=1):
        item["id"] = f"w{index}"
    return results


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path: str) -> str:
        path = urllib.parse.urlparse(path).path
        return str((ROOT / path.lstrip("/")).resolve())

    def do_POST(self) -> None:
        if self.path != "/api/search":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        try:
            plan = json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return
        topic = clean_text(plan.get("topic") or "scholarly literature")
        date_from = int(plan.get("date_from") or 2022)
        sources = plan.get("sources") or []
        all_results: list[dict[str, Any]] = []
        errors: list[str] = []
        for source in sources:
            searcher = SEARCHERS.get(source)
            if not searcher:
                if source in {"Springer", "PubMed", "CORE"}:
                    errors.append(f"{source} needs API credentials or a future connector.")
                continue
            try:
                all_results.extend(searcher(topic, date_from, 8))
            except Exception as exc:
                errors.append(f"{source} unavailable: {exc.__class__.__name__}.")
        results = dedupe(all_results)
        payload = {"results": results, "errors": errors}
        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Research Intelligence Agent running at http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
