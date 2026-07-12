const defaultInstruction =
  "Find papers from 2022 onward about FPGA-based spiking neural networks, download accessible full texts, exclude review articles, compare hardware platforms and neuron models, identify unresolved limitations, and create a cited literature-review report.";

const demoPapers = [
  {
    id: "w1",
    title: "FPGA acceleration of spiking neural networks with event-driven LIF neurons",
    authors: "K. Nguyen, S. Patel, A. Morris",
    year: 2024,
    venue: "IEEE Access",
    sources: ["OpenAlex", "Semantic Scholar", "Crossref"],
    doi: "10.1109/access.2024.11824",
    type: "research article",
    platform: "Xilinx Zynq UltraScale+",
    neuron: "Leaky integrate-and-fire",
    dataset: "N-MNIST, DVS Gesture",
    limitations: "Energy measurements are board-level; sparse traffic scaling is only simulated.",
    access: "Open-access full text",
    license: "CC BY",
    pdf: true,
    pages: "pp. 4-9",
    abstract:
      "Presents an event-driven hardware pipeline for LIF neurons and compares resource use across quantized synaptic precisions.",
    citations: 31
  },
  {
    id: "w2",
    title: "Low-latency FPGA implementation of adaptive spiking networks for edge inference",
    authors: "M. Al-Hassan, J. Weber",
    year: 2023,
    venue: "arXiv",
    sources: ["arXiv", "Semantic Scholar"],
    doi: "",
    type: "preprint",
    platform: "Artix-7",
    neuron: "Adaptive exponential integrate-and-fire",
    dataset: "SHD, ECG arrhythmia",
    limitations: "Preprint status; lacks independent synthesis replication.",
    access: "Open-access full text",
    license: "arXiv nonexclusive distribution",
    pdf: true,
    pages: "sections 3-5",
    abstract:
      "Reports a compact edge inference design using adaptive neuron dynamics and fixed-point membrane updates.",
    citations: 14
  },
  {
    id: "w3",
    title: "Systolic synapse arrays for spiking convolution on reconfigurable logic",
    authors: "R. Chen, P. Iyer, L. Souza",
    year: 2022,
    venue: "ACM FPGA",
    sources: ["DBLP", "Crossref", "Semantic Scholar"],
    doi: "10.1145/3543622.3573201",
    type: "conference paper",
    platform: "Intel Stratix 10",
    neuron: "Current-based LIF",
    dataset: "CIFAR10-DVS",
    limitations: "Optimized for convolutional layers; recurrent workloads are not evaluated.",
    access: "Publisher page available",
    license: "Publisher landing page",
    pdf: false,
    pages: "metadata only",
    abstract:
      "Uses a systolic dataflow to improve synapse reuse in spiking convolution layers on high-end FPGA fabric.",
    citations: 42
  },
  {
    id: "w4",
    title: "Hardware-aware training for quantized SNN deployment on small FPGAs",
    authors: "T. Marino, E. Singh, N. Okafor",
    year: 2025,
    venue: "Frontiers in Neuroscience",
    sources: ["OpenAlex", "Crossref"],
    doi: "10.3389/fnins.2025.88171",
    type: "research article",
    platform: "iCE40 and Artix-7",
    neuron: "Quantized LIF",
    dataset: "N-MNIST, Fashion-MNIST spike encoding",
    limitations: "Training recipe is strong, but on-device learning is not supported.",
    access: "Open-access full text",
    license: "CC BY",
    pdf: true,
    pages: "pp. 6-12",
    abstract:
      "Links quantization-aware training choices to FPGA memory pressure, DSP count, and timing closure on small boards.",
    citations: 9
  },
  {
    id: "w5",
    title: "A survey of neuromorphic accelerators for event-based vision",
    authors: "D. Kaur, M. Costa",
    year: 2024,
    venue: "Springer Nature Computer Science",
    sources: ["Springer", "Crossref"],
    doi: "10.1007/s42979-024-11771",
    type: "review article",
    platform: "Mixed ASIC, GPU, FPGA",
    neuron: "Multiple",
    dataset: "Event-vision benchmarks",
    limitations: "Review article excluded when research-only mode is enabled.",
    access: "Authorized institutional access",
    license: "Subscription access",
    pdf: true,
    pages: "pp. 2-17",
    abstract:
      "Surveys neuromorphic accelerator designs with a broad section on FPGA-based event vision pipelines.",
    citations: 76
  },
  {
    id: "w6",
    title: "Benchmarking spiking recurrent networks on FPGA and embedded GPU platforms",
    authors: "H. Park, O. Mensah, I. Bell",
    year: 2021,
    venue: "Neurocomputing",
    sources: ["OpenAlex", "Semantic Scholar"],
    doi: "10.1016/j.neucom.2021.03.013",
    type: "research article",
    platform: "Zynq-7000, Jetson Xavier",
    neuron: "Recurrent LIF",
    dataset: "TIMIT, sequential MNIST",
    limitations: "Older than current date filter in the default instruction.",
    access: "Licence unclear-do not download",
    license: "Unclear",
    pdf: false,
    pages: "metadata only",
    abstract:
      "Compares latency and throughput for recurrent spiking workloads across FPGA and embedded GPU hardware.",
    citations: 54
  }
];

const els = {
  instruction: document.querySelector("#instructionInput"),
  reset: document.querySelector("#resetInstruction"),
  sourceGrid: document.querySelector("#sourceGrid"),
  sourceCount: document.querySelector("#sourceCount"),
  fromYear: document.querySelector("#fromYear"),
  excludeReviews: document.querySelector("#excludeReviews"),
  lawfulOnly: document.querySelector("#lawfulOnly"),
  oaOnly: document.querySelector("#oaOnly"),
  upload: document.querySelector("#paperUpload"),
  uploadNote: document.querySelector("#uploadNote"),
  run: document.querySelector("#runPlan"),
  apiStatus: document.querySelector("#apiStatus"),
  planJson: document.querySelector("#planJson"),
  planTitle: document.querySelector("#planTitle"),
  paperList: document.querySelector("#paperList"),
  matrixRows: document.querySelector("#matrixRows"),
  resultCount: document.querySelector("#resultCount"),
  pdfCount: document.querySelector("#pdfCount"),
  citationCount: document.querySelector("#citationCount"),
  searchWithin: document.querySelector("#searchWithin"),
  ledger: document.querySelector("#accessLedger"),
  ledgerCount: document.querySelector("#ledgerCount"),
  report: document.querySelector("#reportOutput"),
  answer: document.querySelector("#answerBox"),
  question: document.querySelector("#questionInput"),
  ask: document.querySelector("#askButton"),
  exportBib: document.querySelector("#exportBib"),
  exportRis: document.querySelector("#exportRis"),
  viewTabs: document.querySelector("#viewTabs"),
  tabs: [...document.querySelectorAll(".tab")],
  views: [...document.querySelectorAll(".view")],
  canvas: document.querySelector("#citationCanvas")
};

let papers = [...demoPapers];
let currentResults = [];
let selectedLibrary = new Set(["w1", "w2", "w4"]);

function selectedSources() {
  return [...els.sourceGrid.querySelectorAll("input:checked")].map((input) => input.value);
}

function inferTopic(text) {
  const topicMatch = text.match(/about\s+([^,]+)/i);
  return topicMatch ? topicMatch[1].trim() : "scholarly literature";
}

function buildPlan() {
  const topic = inferTopic(els.instruction.value);
  const sources = selectedSources();
  const dateFrom = Number(els.fromYear.value || 2022);
  return {
    topic,
    date_from: dateFrom,
    document_types: els.excludeReviews.checked
      ? ["research article", "conference paper", "preprint"]
      : ["research article", "conference paper", "preprint", "review article"],
    exclude: els.excludeReviews.checked ? ["review article"] : [],
    sources,
    access_rule:
      "Download full text only when open access, authorized by API or institution, or uploaded by the user.",
    tasks: [
      "search",
      "deduplicate",
      "resolve_open_access",
      "download_authorized_full_text",
      "extract_hardware_platform",
      "extract_neuron_model",
      "extract_dataset",
      "extract_performance_metrics",
      "identify_limitations",
      "generate_cited_report"
    ]
  };
}

function statusClass(access) {
  if (access.includes("Open-access") || access.includes("User-provided")) return "ok";
  if (access.includes("unavailable") || access.includes("unclear")) return "stop";
  return "warn";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function canDownload(paper) {
  if (!paper.pdf) return false;
  if (paper.access.includes("Open-access")) return true;
  if (paper.access.includes("Authorized")) return true;
  if (paper.access.includes("User-provided")) return true;
  return false;
}

function applyFilters() {
  const plan = buildPlan();
  const query = els.searchWithin.value.toLowerCase().trim();
  currentResults = papers.filter((paper) => {
    const sourceMatch = paper.sources.some((source) => plan.sources.includes(source));
    const yearMatch = paper.year >= plan.date_from;
    const typeMatch = !plan.exclude.includes(paper.type);
    const accessMatch = !els.oaOnly.checked || paper.access.includes("Open-access");
    const lawfulMatch = !els.lawfulOnly.checked || !paper.access.includes("unclear");
    const queryMatch =
      !query ||
      [paper.title, paper.abstract, paper.platform, paper.neuron, paper.dataset, paper.authors]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return sourceMatch && yearMatch && typeMatch && accessMatch && lawfulMatch && queryMatch;
  });
  updateUI(plan);
}

function isLocalBackendHost() {
  return ["127.0.0.1", "localhost", "::1"].includes(location.hostname);
}

async function runLiveSearch() {
  const plan = buildPlan();
  if (location.protocol === "file:") {
    els.apiStatus.textContent = "Searching with browser-only sources. Run `python3 server.py` for the full local backend.";
    await runBrowserSearch(plan);
    return;
  }

  els.run.disabled = true;
  els.run.textContent = "Searching...";
  els.apiStatus.textContent = "Searching live scholarly sources...";

  try {
    if (!isLocalBackendHost()) {
      await runBrowserSearch(plan);
      return;
    }
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan)
    });
    if (!response.ok) {
      if ([404, 405, 501].includes(response.status)) {
        await runBrowserSearch(plan);
        return;
      }
      throw new Error(`Search failed with HTTP ${response.status}`);
    }
    const payload = await response.json();
    papers = payload.results?.length ? payload.results : [...demoPapers];
    selectedLibrary = new Set(papers.filter((paper) => canDownload(paper)).slice(0, 3).map((paper) => paper.id));
    els.apiStatus.textContent = payload.results?.length
      ? `Live search returned ${payload.results.length} deduplicated works. ${payload.errors?.length ? payload.errors.join(" ") : ""}`
      : "No live results returned. Demo corpus is active.";
    applyFilters();
    setAnswer();
  } catch (error) {
    papers = [...demoPapers];
    els.apiStatus.textContent = `${error.message} Demo corpus is active.`;
    applyFilters();
  } finally {
    els.run.disabled = false;
    els.run.textContent = "Execute Plan";
  }
}

async function runBrowserSearch(plan) {
  const payload = await browserSearch(plan);
  papers = payload.results.length ? payload.results : [...demoPapers];
  selectedLibrary = new Set(papers.filter((paper) => canDownload(paper)).slice(0, 3).map((paper) => paper.id));
  els.apiStatus.textContent = payload.results.length
    ? `Static GitHub search returned ${payload.results.length} deduplicated works. ${payload.errors.length ? payload.errors.join(" ") : ""}`
    : `Static GitHub search found no live results. ${payload.errors.join(" ")} Demo corpus is active.`;
  applyFilters();
  setAnswer();
}

async function browserSearch(plan) {
  const jobs = [];
  if (plan.sources.includes("OpenAlex")) jobs.push(searchOpenAlexBrowser(plan));
  if (plan.sources.includes("Crossref")) jobs.push(searchCrossrefBrowser(plan));
  const settled = await Promise.allSettled(jobs);
  const errors = [];
  const found = [];
  settled.forEach((result) => {
    if (result.status === "fulfilled") {
      found.push(...result.value.results);
      errors.push(...result.value.errors);
    } else {
      errors.push(`Browser source unavailable: ${result.reason?.message || "unknown error"}.`);
    }
  });

  const skipped = plan.sources.filter((source) => !["OpenAlex", "Crossref"].includes(source));
  if (skipped.length) {
    errors.push(`${skipped.join(", ")} need the local backend or a hosted API service.`);
  }
  return { results: dedupeBrowserWorks(found), errors };
}

async function searchOpenAlexBrowser(plan) {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", plan.topic);
  url.searchParams.set("filter", `from_publication_date:${plan.date_from}-01-01`);
  url.searchParams.set("per-page", "12");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OpenAlex HTTP ${response.status}`);
  const data = await response.json();
  return {
    errors: [],
    results: (data.results || []).map((item) => {
      const location = item.primary_location || {};
      const source = location.source || {};
      const oa = item.open_access || {};
      const best = item.best_oa_location || {};
      const fullTextUrl = best.pdf_url || best.landing_page_url || "";
      return normalizeBrowserWork({
        title: item.display_name,
        authors: (item.authorships || []).map((entry) => entry.author?.display_name).filter(Boolean).join(", "),
        year: item.publication_year,
        venue: source.display_name || "OpenAlex",
        sources: ["OpenAlex"],
        doi: (item.doi || "").replace("https://doi.org/", ""),
        type: item.type_crossref || item.type || "research article",
        access: oa.is_oa && fullTextUrl ? "Open-access full text" : location.landing_page_url ? "Publisher page available" : "Metadata and abstract only",
        license: best.license || "Unknown",
        pdf: Boolean(oa.is_oa && fullTextUrl),
        fullTextUrl: oa.is_oa ? fullTextUrl : "",
        abstract: abstractFromInvertedIndex(item.abstract_inverted_index) || "No abstract available from OpenAlex.",
        citations: item.cited_by_count || 0
      });
    })
  };
}

async function searchCrossrefBrowser(plan) {
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query", plan.topic);
  url.searchParams.set("filter", `from-pub-date:${plan.date_from}-01-01`);
  url.searchParams.set("rows", "12");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Crossref HTTP ${response.status}`);
  const data = await response.json();
  return {
    errors: [],
    results: ((data.message || {}).items || []).map((item) => {
      const yearParts = item["published-print"] || item["published-online"] || item.created || {};
      const year = ((yearParts["date-parts"] || [[0]])[0] || [0])[0] || 0;
      const pdfLink = (item.link || []).find((link) => String(link["content-type"] || "").includes("pdf"));
      return normalizeBrowserWork({
        title: (item.title || ["Untitled work"])[0],
        authors: (item.author || [])
          .map((author) => `${author.given || ""} ${author.family || ""}`.trim())
          .filter(Boolean)
          .join(", "),
        year,
        venue: (item["container-title"] || ["Crossref"])[0] || "Crossref",
        sources: ["Crossref"],
        doi: item.DOI || "",
        type: item.type || "research article",
        access: pdfLink?.URL ? "Open-access full text" : "Publisher page available",
        license: ((item.license || [{}])[0] || {}).URL || "Unknown",
        pdf: Boolean(pdfLink?.URL),
        fullTextUrl: pdfLink?.URL || "",
        abstract: stripHtml(item.abstract || "") || "No abstract available from Crossref.",
        citations: item["is-referenced-by-count"] || 0
      });
    })
  };
}

function normalizeBrowserWork(work) {
  return {
    id: "",
    title: work.title || "Untitled work",
    authors: work.authors || "Unknown authors",
    year: Number(work.year || 0),
    venue: work.venue || "Unknown venue",
    sources: work.sources || [],
    doi: work.doi || "",
    type: work.type || "research article",
    platform: "Not extracted yet",
    neuron: "Not extracted yet",
    dataset: "Not extracted yet",
    limitations: "Requires document analysis after authorized full text is available.",
    access: work.access || "Metadata and abstract only",
    license: work.license || "Unknown",
    pdf: Boolean(work.pdf),
    fullTextUrl: work.fullTextUrl || "",
    pages: "metadata record",
    abstract: work.abstract || "No abstract available.",
    citations: Number(work.citations || 0)
  };
}

function dedupeBrowserWorks(items) {
  const byKey = new Map();
  items.forEach((item) => {
    const key = item.doi || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 120);
    if (!key) return;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      return;
    }
    existing.sources = [...new Set([...existing.sources, ...item.sources])].sort();
    if (!existing.pdf && item.pdf) {
      existing.access = item.access;
      existing.license = item.license;
      existing.pdf = item.pdf;
      existing.fullTextUrl = item.fullTextUrl;
    }
    if (item.abstract.length > existing.abstract.length) existing.abstract = item.abstract;
    existing.citations = Math.max(existing.citations, item.citations);
  });
  return [...byKey.values()].map((item, index) => ({ ...item, id: `w${index + 1}` }));
}

function abstractFromInvertedIndex(index) {
  if (!index || typeof index !== "object") return "";
  const words = [];
  Object.entries(index).forEach(([word, positions]) => {
    positions.forEach((position) => words.push([position, word]));
  });
  return words.sort((a, b) => a[0] - b[0]).map((entry) => entry[1]).join(" ");
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function updateUI(plan) {
  els.planTitle.textContent = plan.topic;
  els.planJson.textContent = JSON.stringify(plan, null, 2);
  els.sourceCount.textContent = `${plan.sources.length} active`;
  els.resultCount.textContent = currentResults.length;
  els.pdfCount.textContent = currentResults.filter(canDownload).length;
  els.citationCount.textContent = currentResults.reduce((sum, paper) => sum + paper.citations, 0);
  els.ledgerCount.textContent = `${currentResults.length} checked`;
  renderPapers();
  renderMatrix();
  renderLedger();
  renderReport(plan);
  drawGraph();
}

function renderPapers() {
  els.paperList.innerHTML = currentResults
    .map((paper) => {
      const blockedClass = paper.access.includes("unclear")
        ? "blocked"
        : canDownload(paper)
          ? ""
          : "restricted";
      const status = statusClass(paper.access);
      const libraryText = selectedLibrary.has(paper.id) ? "In library" : "Add to library";
      const title = escapeHtml(paper.title);
      const abstract = escapeHtml(paper.abstract);
      const authors = escapeHtml(paper.authors);
      const venue = escapeHtml(paper.venue);
      const doi = escapeHtml(paper.doi || "No DOI");
      const type = escapeHtml(paper.type);
      const access = escapeHtml(paper.access);
      const sourceText = escapeHtml(paper.sources.join(" + "));
      return `
        <article class="paper-card ${blockedClass}">
          <div class="paper-meta">
            <span>${paper.year}</span>
            <span>${venue}</span>
            <span>${type}</span>
            <span>${sourceText}</span>
          </div>
          <h3>${title}</h3>
          <p>${abstract}</p>
          <div class="paper-meta">
            <span>${authors}</span>
            <span>${doi}</span>
            <span>${paper.citations} citations</span>
          </div>
          <div class="paper-actions">
            <span class="status ${status}">${access}</span>
            <button type="button" data-action="library" data-id="${paper.id}">${libraryText}</button>
            <button type="button" data-action="trace" data-id="${paper.id}">Trace evidence</button>
            <button type="button" data-action="download" data-id="${paper.id}" ${canDownload(paper) ? "" : "disabled"}>PDF</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMatrix() {
  els.matrixRows.innerHTML = currentResults
    .map(
      (paper) => `
      <tr>
        <td><strong>${escapeHtml(paper.title)}</strong><br />${paper.year} / ${escapeHtml(paper.venue)}</td>
        <td>${escapeHtml(paper.platform)}</td>
        <td>${escapeHtml(paper.neuron)}</td>
        <td>${escapeHtml(paper.dataset)}</td>
        <td>${escapeHtml(paper.limitations)}</td>
        <td><span class="status ${statusClass(paper.access)}">${escapeHtml(paper.access)}</span></td>
      </tr>
    `
    )
    .join("");
}

function renderLedger() {
  const rows = currentResults.map((paper) => {
    const action = canDownload(paper)
      ? "download allowed"
      : paper.access.includes("Publisher page")
        ? "link only"
        : "blocked";
    return `
      <div class="access-row">
        <span title="${escapeHtml(paper.title)}">${escapeHtml(paper.title)}</span>
        <span class="status ${statusClass(paper.access)}">${action}</span>
      </div>
    `;
  });
  els.ledger.innerHTML = rows.join("");
}

function renderReport(plan) {
  const platforms = [...new Set(currentResults.map((paper) => paper.platform))].join("; ");
  const neurons = [...new Set(currentResults.map((paper) => paper.neuron))].join("; ");
  const limits = currentResults.map((paper) => `<li>${escapeHtml(paper.limitations)} <strong>[${escapeHtml(paper.id)}, ${escapeHtml(paper.pages)}]</strong></li>`).join("");
  els.report.innerHTML = `
    <h3>Draft Literature Review: ${escapeHtml(plan.topic)}</h3>
    <p>The filtered corpus contains ${currentResults.length} works from ${plan.date_from} onward. Authorized full text is available for ${currentResults.filter(canDownload).length} works; the remaining records are kept as metadata or publisher links until access is clarified.</p>
    <p>Common hardware targets include ${escapeHtml(platforms || "no matching platforms")}. The extracted neuron models include ${escapeHtml(neurons || "no matching neuron models")}.</p>
    <h4>Observed gaps</h4>
    <ul>${limits || "<li>No limitations extracted for the current filter.</li>"}</ul>
  `;
}

function setAnswer(paperId) {
  const corpus = paperId ? currentResults.filter((paper) => paper.id === paperId) : currentResults;
  if (!corpus.length) {
    els.answer.textContent = "No selected evidence matches the current filters.";
    return;
  }
  const platformCounts = countBy(corpus, "platform");
  const neuronCounts = countBy(corpus, "neuron");
  const topPlatforms = Object.entries(platformCounts)
    .map(([name, count]) => `${name} (${count})`)
    .join(", ");
  const topNeurons = Object.entries(neuronCounts)
    .map(([name, count]) => `${name} (${count})`)
    .join(", ");
  const cites = corpus.map((paper) => `[${paper.id}: ${paper.pages}]`).join(" ");
  els.answer.innerHTML = `Most frequent platforms in the current set: <strong>${topPlatforms}</strong>.<br />Most frequent neuron models: <strong>${topNeurons}</strong>.<br />Evidence trace: ${cites}`;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportBib() {
  const bib = currentResults
    .map((paper) => {
      const key = `${paper.authors.split(",")[0].replace(/[^a-z]/gi, "")}${paper.year}`;
      return `@article{${key},\n  title={${paper.title}},\n  author={${paper.authors}},\n  year={${paper.year}},\n  journal={${paper.venue}},\n  doi={${paper.doi}}\n}`;
    })
    .join("\n\n");
  downloadText("research-intelligence-agent.bib", bib);
}

function exportRis() {
  const ris = currentResults
    .map(
      (paper) =>
        `TY  - JOUR\nTI  - ${paper.title}\nAU  - ${paper.authors}\nPY  - ${paper.year}\nJO  - ${paper.venue}\nDO  - ${paper.doi}\nER  -`
    )
    .join("\n\n");
  downloadText("research-intelligence-agent.ris", ris);
}

function drawGraph() {
  const canvas = els.canvas;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const nodes = currentResults.map((paper, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(currentResults.length, 1);
    return {
      paper,
      x: w / 2 + Math.cos(angle) * 150,
      y: h / 2 + Math.sin(angle) * 95,
      r: Math.max(14, Math.min(30, 10 + paper.citations / 3))
    };
  });

  ctx.lineWidth = 1.5;
  nodes.forEach((node, index) => {
    nodes.slice(index + 1).forEach((other) => {
      const shared = node.paper.sources.some((source) => other.paper.sources.includes(source));
      if (!shared) return;
      ctx.strokeStyle = "rgba(37, 99, 235, 0.18)";
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(other.x, other.y);
      ctx.stroke();
    });
  });

  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.fillStyle = canDownload(node.paper)
      ? "rgba(21, 128, 61, 0.9)"
      : node.paper.access.includes("unclear")
        ? "rgba(185, 28, 28, 0.9)"
        : "rgba(180, 83, 9, 0.9)";
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.paper.id.toUpperCase(), node.x, node.y);
  });
}

els.sourceGrid.addEventListener("change", applyFilters);
els.instruction.addEventListener("input", applyFilters);
els.fromYear.addEventListener("input", applyFilters);
els.excludeReviews.addEventListener("change", applyFilters);
els.lawfulOnly.addEventListener("change", applyFilters);
els.oaOnly.addEventListener("change", applyFilters);
els.searchWithin.addEventListener("input", applyFilters);
els.run.addEventListener("click", runLiveSearch);
els.ask.addEventListener("click", () => setAnswer());
els.reset.addEventListener("click", () => {
  els.instruction.value = defaultInstruction;
  els.fromYear.value = 2022;
  els.excludeReviews.checked = true;
  els.lawfulOnly.checked = true;
  els.oaOnly.checked = false;
  applyFilters();
});

els.paperList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const paper = papers.find((item) => item.id === button.dataset.id);
  if (!paper) return;
  if (button.dataset.action === "library") {
    selectedLibrary.has(paper.id) ? selectedLibrary.delete(paper.id) : selectedLibrary.add(paper.id);
    renderPapers();
  }
  if (button.dataset.action === "trace") setAnswer(paper.id);
  if (button.dataset.action === "download" && canDownload(paper)) {
    if (paper.fullTextUrl) {
      window.open(paper.fullTextUrl, "_blank", "noopener");
    }
    els.answer.innerHTML = `Authorized full-text link ready for <strong>${escapeHtml(paper.title)}</strong>. Access status: ${escapeHtml(paper.access)}.`;
  }
});

els.viewTabs.addEventListener("click", (event) => {
  const selectedTab = event.target.closest(".tab");
  if (!selectedTab) return;
  const nextView = document.querySelector(`#${selectedTab.dataset.view}View`);
  if (!nextView) return;
  els.tabs.forEach((item) => item.classList.toggle("active", item === selectedTab));
  els.views.forEach((view) => view.classList.toggle("active", view === nextView));
});

els.upload.addEventListener("change", () => {
  const file = els.upload.files[0];
  els.uploadNote.textContent = file
    ? `${file.name} is ready to index as a user-provided document.`
    : "Uploaded papers are marked as user-provided documents.";
});

els.exportBib.addEventListener("click", exportBib);
els.exportRis.addEventListener("click", exportRis);
window.addEventListener("resize", drawGraph);

applyFilters();
