const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/123.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 18000;

const COMMON_QUERY_SETS = [
  "people search",
  "background check",
  "reverse phone lookup",
  "address lookup"
];

const SCORE_WEIGHTS = {
  trust_score: 0.15,
  urgency_score: 0.20,
  utility_score: 0.20,
  value_score: 0.10,
  emotional_score: 0.15,
  seo_signal_score: 0.20
};

const TRUTHFINDER_ACTION_LIBRARY = {
  trust: [
    "Move trust proof higher on the landing page: ratings, freshness cues, result-depth proof.",
    "Test stronger authority-led search ad copy against utility-only messaging."
  ],
  urgency: [
    "Tighten urgency messaging in paid search without crossing compliance lines.",
    "Reduce time-to-action and time-to-perceived-result on mobile landing pages."
  ],
  utility: [
    "Defend high-intent lookup terms with clearer outcome-based messaging.",
    "Separate lower-intent utility terms from buyer-intent terms before increasing bids."
  ],
  value: [
    "Audit price framing and premium justification against competitor offer presentation.",
    "Avoid overbidding cost-sensitive traffic unless downstream retention supports it."
  ],
  safety: [
    "Build dedicated landing pages for safety / verification query classes.",
    "Segment emotional-intent terms with stricter CPA and downstream value guardrails."
  ],
  seo: [
    "Counter strong organic visibility only where commercial intent is highest.",
    "Create comparison and alternative-seeking pages for competitive query classes."
  ]
};

function timeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    timeoutPromise(timeoutMs)
  ]);
}

function normalizeInput(urlOrDomain) {
  const raw = String(urlOrDomain || "").trim();
  if (!raw) return "";
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    return `https://${raw}`;
  }
  return raw;
}

function domainFromUrl(url) {
  const parsed = new URL(url);
  let host = parsed.hostname.toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  return host;
}

function cleanText(str) {
  return String(str || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function extractMetaByName(html, name) {
  const regex1 = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`,
    "i"
  );
  const regex2 = new RegExp(
    `<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+name=["']${name}["'][^>]*>`,
    "i"
  );
  return cleanText(html.match(regex1)?.[1] || html.match(regex2)?.[1] || "");
}

function extractAllMatches(html, regex, limit = 10) {
  return [...html.matchAll(regex)]
    .slice(0, limit)
    .map((m) => cleanText(m[1]))
    .filter(Boolean);
}

async function fetchHtml(url) {
  const response = await fetchWithTimeout(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: HTTP ${response.status}`);
  }

  const html = await response.text();
  const finalUrl = response.url;

  const title = cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const meta_description =
    extractMetaByName(html, "description") ||
    extractMetaByName(html, "Description");
  const h1 = cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const h2s = extractAllMatches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi, 8);
  const h3s = extractAllMatches(html, /<h3[^>]*>([\s\S]*?)<\/h3>/gi, 8);
  const button_texts = extractAllMatches(html, /<button[^>]*>([\s\S]*?)<\/button>/gi, 12);
  const anchor_texts = extractAllMatches(html, /<a[^>]*>([\s\S]*?)<\/a>/gi, 20);

  const body_text = cleanText(html).slice(0, 30000);

  const pageUrl = new URL(finalUrl);
  const links = [];
  for (const match of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)) {
    const href = String(match[1] || "").trim();
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      continue;
    }
    try {
      const abs = new URL(href, finalUrl).toString();
      if (new URL(abs).hostname === pageUrl.hostname && !links.includes(abs)) {
        links.push(abs);
      }
    } catch {
      // ignore malformed URLs
    }
  }

  return {
    final_url: finalUrl,
    title,
    meta_description,
    h1,
    h2s,
    h3s,
    links: links.slice(0, 30),
    button_texts: uniq(button_texts),
    anchor_texts: uniq(anchor_texts),
    body_text,
    status_code: response.status
  };
}

function countMatches(text, terms) {
  const lower = String(text || "").toLowerCase();
  let hits = 0;
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lower.match(new RegExp(escaped, "g"));
    hits += matches ? matches.length : 0;
  }
  return hits;
}

function weightedScore(text, terms, weight = 10, cap = 100) {
  return Math.min(cap, countMatches(text, terms) * weight);
}

function classifyPressure(score) {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium-High";
  if (score >= 40) return "Medium";
  return "Low-Medium";
}

function safePreview(text, maxLen = 180) {
  const t = String(text || "").trim();
  return t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t;
}

function buildEvidenceExtracts(scrape) {
  const extracts = [];

  if (scrape.h1) extracts.push(`Primary headline: ${scrape.h1}`);
  if (scrape.meta_description) extracts.push(`Meta description: ${scrape.meta_description}`);
  if (scrape.h2s?.length) extracts.push(`Subheadings: ${scrape.h2s.slice(0, 4).join(" | ")}`);
  if (scrape.button_texts?.length) extracts.push(`Buttons / CTAs: ${scrape.button_texts.slice(0, 6).join(" | ")}`);
  if (scrape.anchor_texts?.length) extracts.push(`Top link text: ${scrape.anchor_texts.slice(0, 8).join(" | ")}`);

  const pricingLinks = (scrape.links || []).filter((u) =>
    /pricing|subscribe|checkout|plans|membership|trial/i.test(u)
  );
  if (pricingLinks.length) {
    extracts.push(`Pricing / monetization links detected: ${pricingLinks.slice(0, 4).join(" | ")}`);
  }

  return extracts.slice(0, 10);
}

function detectHooks(scrape) {
  const text = [
    scrape.title,
    scrape.meta_description,
    scrape.h1,
    ...(scrape.h2s || []),
    ...(scrape.button_texts || []),
    scrape.body_text
  ].join(" ").toLowerCase();

  const hooks = [];
  const patterns = [
    ["Urgency / find out now", ["now", "today", "instantly", "immediately", "start now", "fast"]],
    ["Trust / authority", ["trusted", "accurate", "reliable", "official", "verified", "comprehensive"]],
    ["Safety / certainty", ["safe", "protect", "verify", "security", "confidence", "peace of mind"]],
    ["Utility / lookup", ["search", "lookup", "find", "discover", "people", "phone", "address"]],
    ["Value / affordability", ["cheap", "affordable", "trial", "low cost", "pricing", "plans"]],
    ["Report depth", ["report", "records", "details", "history", "background"]]
  ];

  for (const [label, words] of patterns) {
    if (words.some((w) => text.includes(w))) {
      hooks.push(label);
    }
  }

  return hooks.slice(0, 6);
}

function detectFunnel(scrape) {
  const text = [
    scrape.body_text,
    ...(scrape.button_texts || []),
    ...(scrape.anchor_texts || [])
  ].join(" ").toLowerCase();

  const links = (scrape.links || []).map((u) => u.toLowerCase());
  const steps = ["Homepage / intent capture"];

  if (["search", "name", "phone", "address", "lookup"].some((k) => text.includes(k))) {
    steps.push("Search input / lookup start");
  }
  if (["results", "matches", "report", "found"].some((k) => text.includes(k))) {
    steps.push("Perceived results / progress build");
  }
  if (["pricing", "subscription", "trial", "buy", "checkout", "unlock", "plans"].some((k) => text.includes(k))) {
    steps.push("Monetization / paywall handoff");
  }
  if (links.some((u) => /pricing|subscribe|checkout|plans|trial/.test(u))) {
    steps.push("Dedicated pricing or checkout page likely");
  }
  if (steps.length === 1) {
    steps.push("Funnel needs manual review beyond homepage");
  }

  return steps.slice(0, 5);
}

function summarizeCompetitor(domain, scrape, scores) {
  const competitor = domain
    .replace(".com", "")
    .replace(".net", "")
    .replace(".org", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const highScores = Object.entries(scores)
    .filter(([k, v]) => k.endsWith("_score") && typeof v === "number" && v >= 65)
    .map(([k]) => k.replace("_score", "").replace(/_/g, " "))
    .slice(0, 3);

  const summary = [];
  if (scrape.h1) summary.push(`${competitor} leads with the headline '${scrape.h1}'.`);
  if (highScores.length) summary.push(`Strongest visible dimensions appear to be ${highScores.join(", ")}.`);
  if ((scrape.links || []).some((u) => /pricing|checkout|subscribe|plans|trial/i.test(u))) {
    summary.push("There are visible monetization signals or links suggesting a relatively direct pricing path.");
  }
  summary.push("This assessment is derived from live page content, optional SERP enrichment, and any connected screenshot / creative sources.");

  return summary.join(" ");
}

function buildScoreExplanations(scrape, scoreDetail) {
  const { termHits } = scoreDetail;

  return {
    trust_score:
      `Trust scored ${scoreDetail.trust_score} based on visible trust / verification language (${termHits.trust_hits} matched trust-related terms), report-depth cues, and authority-style framing.`,
    urgency_score:
      `Urgency scored ${scoreDetail.urgency_score} based on immediacy language and CTA pressure (${termHits.urgency_hits} urgency-related term hits).`,
    utility_score:
      `Utility scored ${scoreDetail.utility_score} from search / lookup usefulness and task-completion language (${termHits.utility_hits} utility-related term hits).`,
    value_score:
      `Value scored ${scoreDetail.value_score} from price / trial / affordability cues (${termHits.value_hits} value-related term hits).`,
    emotional_score:
      `Emotional scored ${scoreDetail.emotional_score} from reassurance, safety, and verification language (${termHits.emotional_hits} emotional-related term hits).`,
    seo_signal_score:
      `SEO Signal scored ${scoreDetail.seo_signal_score} from signs of content depth such as FAQ, guides, articles, blog, or learn pages (${termHits.seo_hits} SEO-related term hits).`,
    keyword_pressure_score:
      `Keyword Pressure scored ${scoreDetail.keyword_pressure_score} as a weighted blend of trust (${SCORE_WEIGHTS.trust_score}), urgency (${SCORE_WEIGHTS.urgency_score}), utility (${SCORE_WEIGHTS.utility_score}), value (${SCORE_WEIGHTS.value_score}), emotional (${SCORE_WEIGHTS.emotional_score}), and SEO (${SCORE_WEIGHTS.seo_signal_score}).`
  };
}

function buildScoringMethodology() {
  return {
    trust_score:
      "Based on trust cues, authority language, verification terms, and report-depth / comprehensiveness messaging visible on-page.",
    urgency_score:
      "Based on immediacy language, fast-result claims, CTA intensity, and action-pressure cues.",
    utility_score:
      "Based on practical search / lookup language and evidence that the product helps complete a clear user task.",
    value_score:
      "Based on visible trial, pricing, affordability, and offer-framing signals.",
    emotional_score:
      "Based on reassurance, safety, protection, confidence, and verification cues.",
    seo_signal_score:
      "Based on signals of organic-content depth such as blog, FAQ, guides, resource sections, and learn-style pages.",
    keyword_pressure_score:
      "Composite weighted score across trust, urgency, utility, value, emotional, and SEO dimensions."
  };
}

function buildPressureDrivers(scores, hooks, scrape) {
  const drivers = [];

  if (scores.utility_score >= 65) drivers.push("Heavy utility / lookup language");
  if (scores.trust_score >= 65) drivers.push("Strong trust / verification positioning");
  if (scores.urgency_score >= 60) drivers.push("Urgency and fast-result messaging");
  if ((scrape.links || []).some((u) => /pricing|plans|checkout|trial|subscribe/i.test(u))) {
    drivers.push("Visible monetization path");
  }
  if (hooks.includes("Report depth")) drivers.push("Report-depth framing");
  if (scores.seo_signal_score >= 55) drivers.push("Content / SEO footprint");

  return uniq(drivers).slice(0, 6);
}

function buildPressureSummary(scores, drivers) {
  if (!drivers.length) {
    return "Pressure appears moderate based on the currently parsed page, but the primary drivers were limited or not strongly differentiated.";
  }
  return `Competitive pressure is being driven most by ${drivers.join(", ").toLowerCase()}.`;
}

function buildActionPlan(hooks, pressureBand, scrape, scores) {
  const plan = [];
  const hookText = hooks.join(" ").toLowerCase();
  const bodyText = String(scrape.body_text || "").toLowerCase();

  if (hookText.includes("trust")) plan.push(...TRUTHFINDER_ACTION_LIBRARY.trust);
  if (hookText.includes("urgency")) plan.push(...TRUTHFINDER_ACTION_LIBRARY.urgency);
  if (hookText.includes("utility")) plan.push(...TRUTHFINDER_ACTION_LIBRARY.utility);
  if (hookText.includes("value")) plan.push(...TRUTHFINDER_ACTION_LIBRARY.value);
  if (hookText.includes("safety")) plan.push(...TRUTHFINDER_ACTION_LIBRARY.safety);

  if (["blog", "articles", "resources", "learn", "faq", "guide"].some((k) => bodyText.includes(k))) {
    plan.push(...TRUTHFINDER_ACTION_LIBRARY.seo);
  }

  if (pressureBand === "High" || pressureBand === "Medium-High") {
    plan.push("Review impression share and brand-defense coverage before broadening generic keyword bids.");
  }

  if (scores.utility_score > scores.emotional_score) {
    plan.push("Test stronger emotional / reassurance overlays if competitor positioning is primarily utility-driven.");
  }

  plan.push("Run a side-by-side ad-to-landing audit against TruthFinder’s current mobile funnel for the top revenue-driving query themes.");

  return uniq(plan).slice(0, 8);
}

async function analyzeSerps(domain, env) {
  const apiKey = String(env.SERPAPI_KEY || "").trim();
  const results = [];

  for (const query of [domain, ...COMMON_QUERY_SETS]) {
    if (!apiKey) {
      results.push({
        query,
        source: "Not connected",
        ads_count: null,
        top_organic_titles: [],
        notes: "SERPAPI_KEY is not configured."
      });
      continue;
    }

    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google");
      url.searchParams.set("q", query);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("num", "10");

      const resp = await fetchWithTimeout(url.toString(), {}, DEFAULT_TIMEOUT_MS);
      if (!resp.ok) throw new Error(`SERP API failed: ${resp.status}`);

      const payload = await resp.json();
      const ads = payload.ads || [];
      const organic = payload.organic_results || [];

      results.push({
        query,
        source: "SerpAPI",
        ads_count: ads.length,
        top_organic_titles: organic.slice(0, 3).map((o) => o.title || ""),
        notes:
          ads.length > 0
            ? `Detected ${ads.length} paid placements for this query.`
            : "No paid placements detected in returned snapshot."
      });
    } catch (err) {
      results.push({
        query,
        source: "Unavailable",
        ads_count: null,
        top_organic_titles: [],
        notes: `SERP lookup failed: ${err.message}`
      });
    }
  }

  return results;
}

async function maybeScreenshot(url, label, stage, env) {
  const base = String(env.SCREENSHOT_API_BASE || "").trim();
  if (!base) return null;

  try {
    const endpoint = new URL("/capture", base).toString();
    const reqUrl = new URL(endpoint);
    reqUrl.searchParams.set("url", url);

    const resp = await fetchWithTimeout(reqUrl.toString(), {}, 30000);
    if (!resp.ok) throw new Error(`Screenshot failed: ${resp.status}`);

    const data = await resp.json();
    return {
      label,
      stage,
      notes: "Screenshot successfully captured from configured screenshot service.",
      url: data.image_url || ""
    };
  } catch (err) {
    return {
      label,
      stage,
      notes: `Screenshot service attempted but failed: ${err.message}`,
      url: ""
    };
  }
}

async function maybeCreativeFeed(domain, env) {
  const base = String(env.AD_CREATIVE_API_BASE || "").trim();
  if (!base) return {
    creative_summary: "No ad creative feed configured. Set AD_CREATIVE_API_BASE to return real competitor creative data.",
    ad_creatives: []
  };

  try {
    const url = new URL("/creatives", base);
    url.searchParams.set("domain", domain);

    const resp = await fetchWithTimeout(url.toString(), {}, 25000);
    if (!resp.ok) throw new Error(`Creative feed failed: ${resp.status}`);
    const payload = await resp.json();

    return {
      creative_summary:
        payload.creative_summary ||
        `Creative feed returned ${Array.isArray(payload.ad_creatives) ? payload.ad_creatives.length : 0} ad creatives.`,
      ad_creatives: Array.isArray(payload.ad_creatives) ? payload.ad_creatives.slice(0, 8) : []
    };
  } catch (err) {
    return {
      creative_summary: `Creative feed configured but request failed: ${err.message}`,
      ad_creatives: []
    };
  }
}

function buildDataSources(scrape, serps, screenshots, adCreatives) {
  const serpConnected = serps.some((s) => s.source === "SerpAPI");
  const screenshotConnected = screenshots.some((s) => s.url);
  const creativesConnected = (adCreatives || []).length > 0;

  return [
    {
      name: "Homepage Crawl",
      status: "Connected",
      detail: `Fetched ${scrape.final_url} and parsed visible content.`
    },
    {
      name: "SERP Data",
      status: serpConnected ? "Connected" : "Not connected",
      detail: serpConnected
        ? "Live SERP snapshot returned for one or more queries."
        : "No live SERP source returned."
    },
    {
      name: "Ad Creatives",
      status: creativesConnected ? "Connected" : "Not connected",
      detail: creativesConnected
        ? `${adCreatives.length} creative assets returned.`
        : "No live creative source returned."
    },
    {
      name: "Screenshot Capture",
      status: screenshotConnected ? "Connected" : "Not connected",
      detail: screenshotConnected
        ? "One or more screenshots were returned."
        : "No screenshot source returned."
    }
  ];
}

async function analyzeCompetitor(inputUrl, env) {
  const url = normalizeInput(inputUrl);
  if (!url) {
    throw new Error("Please enter a competitor URL or domain.");
  }

  const scrape = await fetchHtml(url);
  const domain = domainFromUrl(scrape.final_url);

  const fullText = [
    scrape.title,
    scrape.meta_description,
    scrape.h1,
    ...(scrape.h2s || []),
    ...(scrape.h3s || []),
    ...(scrape.button_texts || []),
    ...(scrape.anchor_texts || []),
    scrape.body_text
  ].join(" ");

  const termHits = {
    trust_hits: countMatches(fullText, ["trusted", "accurate", "reliable", "confidence", "comprehensive", "verified", "official"]),
    urgency_hits: countMatches(fullText, ["now", "today", "instantly", "immediately", "fast", "quick", "start now"]),
    utility_hits: countMatches(fullText, ["search", "find", "lookup", "discover", "people", "phone", "address", "records"]),
    value_hits: countMatches(fullText, ["trial", "pricing", "affordable", "value", "low cost", "cheap", "plans"]),
    emotional_hits: countMatches(fullText, ["protect", "safe", "security", "concern", "verify", "peace of mind", "confidence"]),
    seo_hits: countMatches(fullText, ["blog", "articles", "resources", "guide", "learn", "faq", "help center"])
  };

  const trust_score = weightedScore(fullText, ["trusted", "accurate", "reliable", "confidence", "comprehensive", "verified", "official"], 10);
  const urgency_score = weightedScore(fullText, ["now", "today", "instantly", "immediately", "fast", "quick", "start now"], 12);
  const utility_score = weightedScore(fullText, ["search", "find", "lookup", "discover", "people", "phone", "address", "records"], 5);
  const value_score = weightedScore(fullText, ["trial", "pricing", "affordable", "value", "low cost", "cheap", "plans"], 14);
  const emotional_score = weightedScore(fullText, ["protect", "safe", "security", "concern", "verify", "peace of mind", "confidence"], 12);
  const seo_signal_score = weightedScore(fullText, ["blog", "articles", "resources", "guide", "learn", "faq", "help center"], 14);

  const keyword_pressure_score = Math.min(
    100,
    Math.round(
      trust_score * SCORE_WEIGHTS.trust_score +
      urgency_score * SCORE_WEIGHTS.urgency_score +
      utility_score * SCORE_WEIGHTS.utility_score +
      value_score * SCORE_WEIGHTS.value_score +
      emotional_score * SCORE_WEIGHTS.emotional_score +
      seo_signal_score * SCORE_WEIGHTS.seo_signal_score
    )
  );

  const pressure_band = classifyPressure(keyword_pressure_score);

  const scores = {
    trust_score,
    urgency_score,
    utility_score,
    value_score,
    emotional_score,
    seo_signal_score,
    keyword_pressure_score
  };

  const detected_hooks = detectHooks(scrape);
  const detected_funnel_steps = detectFunnel(scrape);
  const pressure_drivers = buildPressureDrivers(scores, detected_hooks, scrape);
  const pressure_summary = buildPressureSummary(scores, pressure_drivers);
  const score_explanations = buildScoreExplanations(scrape, { ...scores, termHits });
  const scoring_methodology = buildScoringMethodology();

  const serps = await analyzeSerps(domain, env);

  const screenshots = [];
  const homepageShot = await maybeScreenshot(scrape.final_url, "Homepage Above the Fold", "Intent Capture", env);
  if (homepageShot) screenshots.push(homepageShot);

  const likelyPricingLink = (scrape.links || []).find((u) => /pricing|plans|trial|checkout|subscribe/i.test(u));
  if (likelyPricingLink) {
    const pricingShot = await maybeScreenshot(likelyPricingLink, "Pricing / Monetization Page", "Paywall / Monetization", env);
    if (pricingShot) screenshots.push(pricingShot);
  }

  const creativePayload = await maybeCreativeFeed(domain, env);
  const ad_creatives = creativePayload.ad_creatives || [];
  const creative_summary = creativePayload.creative_summary;

  const evidence_extracts = buildEvidenceExtracts(scrape);

  const key_observations = [];
  if (scrape.title) key_observations.push(`Page title: ${scrape.title}`);
  if (scrape.meta_description) key_observations.push("Meta description is present and can be used to infer search click framing.");
  if (scrape.h1) key_observations.push(`Primary above-the-fold headline: ${scrape.h1}`);
  if (likelyPricingLink) key_observations.push("Detected a likely pricing-related internal path.");
  if (detected_hooks.length) key_observations.push(`Top detected hooks: ${detected_hooks.slice(0, 3).join(", ")}.`);
  if (!screenshots.some((s) => s.url)) key_observations.push("Screenshot capture is not connected or did not return images.");
  if (!ad_creatives.length) key_observations.push("No live competitor ad creative feed returned.");
  if (!serps.some((s) => s.source === "SerpAPI")) key_observations.push("No live SERP data source returned.");

  const action_plan = buildActionPlan(detected_hooks, pressure_band, scrape, scores);
  const data_sources = buildDataSources(scrape, serps, screenshots, ad_creatives);

  return {
    competitor_name: domain.replace(".com", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    domain,
    input_url: url,
    page_title: scrape.title,
    meta_description: scrape.meta_description,
    headline: scrape.h1,
    summary: summarizeCompetitor(domain, scrape, scores),
    trust_score,
    urgency_score,
    utility_score,
    value_score,
    emotional_score,
    seo_signal_score,
    keyword_pressure_score,
    pressure_band,
    score_explanations,
    scoring_methodology,
    pressure_summary,
    pressure_drivers,
    data_sources,
    detected_hooks,
    detected_funnel_steps,
    key_observations,
    action_plan,
    evidence_extracts,
    creative_summary,
    ad_creatives,
    serps,
    screenshots,
    crawl_notes: [
      `Fetched ${scrape.final_url} with HTTP ${scrape.status_code}`,
      `Indexed ${(scrape.links || []).length} internal links from the landing page`,
      `Captured ${(scrape.button_texts || []).length} button texts and ${(scrape.anchor_texts || []).length} anchor texts`,
      `Term hit summary: ${JSON.stringify(termHits)}`,
      "No persistent storage is used; each analysis is generated fresh per request."
    ]
  };
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const inputUrl = payload?.url || "";
    const result = await analyzeCompetitor(inputUrl, context.env);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Analysis failed" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
