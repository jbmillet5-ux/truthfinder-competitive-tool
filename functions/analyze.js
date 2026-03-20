const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/123.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 18000;

const PPC_SCORE_WEIGHTS = {
  keyword_opportunity_score: 0.25,
  paid_intent_coverage_score: 0.20,
  creative_angle_diversity_score: 0.15,
  use_case_expansion_score: 0.15,
  offer_cta_strength_score: 0.10,
  funnel_monetization_efficiency_score: 0.10,
  channel_expansion_score: 0.05
};

const INDUSTRY_KEYWORD_MAP = [
  {
    cluster: "people search",
    intent_type: "core",
    priority: "high",
    keywords: [
      "people search",
      "find people",
      "person search",
      "people finder",
      "find a person",
      "public records"
    ],
    use_cases: ["find someone", "reconnect", "identity lookup"],
    channels: ["google_ads", "bing_ads", "display"]
  },
  {
    cluster: "background check",
    intent_type: "core",
    priority: "high",
    keywords: [
      "background check",
      "criminal records",
      "arrest records",
      "court records",
      "background report"
    ],
    use_cases: ["safety screening", "verification", "due diligence"],
    channels: ["google_ads", "bing_ads", "display"]
  },
  {
    cluster: "reverse phone lookup",
    intent_type: "core",
    priority: "high",
    keywords: [
      "reverse phone lookup",
      "phone lookup",
      "who called me",
      "unknown caller",
      "spam caller",
      "who owns this number"
    ],
    use_cases: ["unknown caller resolution", "scam prevention", "identity verification"],
    channels: ["google_ads", "bing_ads", "meta_ads", "tiktok_ads", "display"]
  },
  {
    cluster: "reverse address lookup",
    intent_type: "adjacent",
    priority: "medium-high",
    keywords: [
      "reverse address lookup",
      "who lives at this address",
      "address lookup",
      "property address search",
      "neighbors at address"
    ],
    use_cases: ["new neighborhood research", "property research", "resident lookup"],
    channels: ["google_ads", "bing_ads", "meta_ads", "display"]
  },
  {
    cluster: "email lookup",
    intent_type: "adjacent",
    priority: "medium-high",
    keywords: [
      "email lookup",
      "email owner lookup",
      "who owns this email",
      "email search",
      "reverse email lookup"
    ],
    use_cases: ["identity verification", "scam prevention", "contact validation"],
    channels: ["google_ads", "bing_ads", "meta_ads", "display"]
  },
  {
    cluster: "property records",
    intent_type: "adjacent",
    priority: "medium-high",
    keywords: [
      "property records",
      "property owner lookup",
      "owner of property",
      "house owner lookup",
      "real estate records"
    ],
    use_cases: ["property research", "owner verification", "neighborhood validation"],
    channels: ["google_ads", "bing_ads", "display"]
  },
  {
    cluster: "vin lookup",
    intent_type: "adjacent",
    priority: "medium",
    keywords: [
      "vin lookup",
      "vehicle owner lookup",
      "who owns this car",
      "vin owner search",
      "vehicle records"
    ],
    use_cases: ["vehicle validation", "buyer diligence", "owner research"],
    channels: ["google_ads", "bing_ads", "display"]
  },
  {
    cluster: "dark web / identity exposure",
    intent_type: "expansion",
    priority: "medium-high",
    keywords: [
      "dark web scan",
      "is my information online",
      "identity exposure",
      "personal data leak",
      "data breach check"
    ],
    use_cases: ["identity protection", "fraud awareness", "personal data monitoring"],
    channels: ["meta_ads", "tiktok_ads", "display", "google_ads"]
  },
  {
    cluster: "dating / personal safety",
    intent_type: "expansion",
    priority: "medium-high",
    keywords: [
      "background check before dating",
      "look up someone before meeting",
      "is this person safe",
      "check someone before date",
      "verify someone online dating"
    ],
    use_cases: ["dating safety", "trust validation", "pre-meeting verification"],
    channels: ["meta_ads", "tiktok_ads", "display", "google_ads"]
  },
  {
    cluster: "neighbor / neighborhood research",
    intent_type: "expansion",
    priority: "medium",
    keywords: [
      "who lives near me",
      "neighborhood lookup",
      "neighbor lookup",
      "who lives next door",
      "research neighborhood"
    ],
    use_cases: ["moving research", "neighborhood confidence", "property context"],
    channels: ["meta_ads", "display", "google_ads"]
  }
];

const CREATIVE_ANGLE_LIBRARY = [
  {
    angle: "Unknown caller resolution",
    triggers: ["reverse phone", "phone lookup", "who called", "unknown caller", "spam caller", "number"],
    user_problem: "I need to identify who is calling me.",
    best_channels: ["google_ads", "bing_ads", "meta_ads", "tiktok_ads"],
    hook_templates: [
      "Who just called you?",
      "Unknown number? Get answers fast.",
      "Find out who is behind that number."
    ]
  },
  {
    angle: "Safety / protect myself",
    triggers: ["safe", "protect", "security", "verify", "background", "criminal", "records"],
    user_problem: "I want to reduce risk before interacting with someone.",
    best_channels: ["google_ads", "meta_ads", "display", "tiktok_ads"],
    hook_templates: [
      "Know more before you meet.",
      "A quick check can save you a major mistake.",
      "Feel more confident before taking the next step."
    ]
  },
  {
    angle: "Dating / before meeting someone",
    triggers: ["date", "dating", "meet", "before meeting", "verify someone"],
    user_problem: "I want confidence before meeting someone from online or in person.",
    best_channels: ["meta_ads", "tiktok_ads", "display", "google_ads"],
    hook_templates: [
      "Before the first date, know a little more.",
      "Meet with more confidence.",
      "Check before you trust."
    ]
  },
  {
    angle: "Reconnection / find someone",
    triggers: ["find people", "people search", "locate", "reconnect", "find someone"],
    user_problem: "I want to find or reconnect with someone.",
    best_channels: ["google_ads", "bing_ads", "meta_ads"],
    hook_templates: [
      "Trying to find someone?",
      "Reconnect with more context.",
      "Find people faster."
    ]
  },
  {
    angle: "Property / address research",
    triggers: ["address", "property", "owner", "reverse address", "residents"],
    user_problem: "I want to know more about a home, address, or the people tied to it.",
    best_channels: ["google_ads", "bing_ads", "display", "meta_ads"],
    hook_templates: [
      "Who lives there?",
      "Research an address before you decide.",
      "Get more context on a property."
    ]
  },
  {
    angle: "Identity / scam / fraud concern",
    triggers: ["email", "identity", "scam", "fraud", "dark web", "exposure", "verify"],
    user_problem: "I need to validate identity or check for risk.",
    best_channels: ["meta_ads", "tiktok_ads", "display", "google_ads"],
    hook_templates: [
      "Validate before you trust.",
      "Check the identity behind the message.",
      "See what could be putting you at risk."
    ]
  },
  {
    angle: "Report depth / hidden details",
    triggers: ["records", "history", "report", "details", "comprehensive", "public records"],
    user_problem: "I want more complete information, not just surface-level answers.",
    best_channels: ["google_ads", "bing_ads", "display"],
    hook_templates: [
      "Go beyond the basics.",
      "See more than just a name.",
      "Unlock deeper context."
    ]
  },
  {
    angle: "Fast answers / instant clarity",
    triggers: ["fast", "quick", "instantly", "immediately", "now", "today"],
    user_problem: "I want answers quickly.",
    best_channels: ["google_ads", "bing_ads", "meta_ads", "tiktok_ads"],
    hook_templates: [
      "Answers in minutes.",
      "Get clarity fast.",
      "Search now. Know more sooner."
    ]
  }
];

function timeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return Promise.race([fetch(url, options), timeoutPromise(timeoutMs)]);
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
  return [...new Set((arr || []).filter(Boolean))];
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
  const meta_description = extractMetaByName(html, "description") || extractMetaByName(html, "Description");
  const h1 = cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const h2s = extractAllMatches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi, 10);
  const h3s = extractAllMatches(html, /<h3[^>]*>([\s\S]*?)<\/h3>/gi, 10);
  const button_texts = extractAllMatches(html, /<button[^>]*>([\s\S]*?)<\/button>/gi, 20);
  const anchor_texts = extractAllMatches(html, /<a[^>]*>([\s\S]*?)<\/a>/gi, 30);

  const body_text = cleanText(html).slice(0, 40000);

  const links = [];
  const pageUrl = new URL(finalUrl);
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
    button_texts: uniq(button_texts),
    anchor_texts: uniq(anchor_texts),
    links: links.slice(0, 40),
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

function classifyBand(score) {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium-High";
  if (score >= 40) return "Medium";
  return "Low-Medium";
}

function safePreview(text, maxLen = 180) {
  const t = String(text || "").trim();
  return t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t;
}

function getFullText(scrape) {
  return [
    scrape.title,
    scrape.meta_description,
    scrape.h1,
    ...(scrape.h2s || []),
    ...(scrape.h3s || []),
    ...(scrape.button_texts || []),
    ...(scrape.anchor_texts || []),
    scrape.body_text
  ].join(" ");
}

function buildEvidenceExtracts(scrape) {
  const extracts = [];
  if (scrape.h1) extracts.push(`Primary headline: ${scrape.h1}`);
  if (scrape.meta_description) extracts.push(`Meta description: ${scrape.meta_description}`);
  if (scrape.h2s?.length) extracts.push(`Subheadings: ${scrape.h2s.slice(0, 5).join(" | ")}`);
  if (scrape.button_texts?.length) extracts.push(`Buttons / CTAs: ${scrape.button_texts.slice(0, 8).join(" | ")}`);
  if (scrape.anchor_texts?.length) extracts.push(`Top link text: ${scrape.anchor_texts.slice(0, 10).join(" | ")}`);

  const monetizationLinks = (scrape.links || []).filter((u) => /pricing|plans|trial|checkout|subscribe|membership/i.test(u));
  if (monetizationLinks.length) {
    extracts.push(`Monetization links detected: ${monetizationLinks.slice(0, 5).join(" | ")}`);
  }

  return extracts.slice(0, 12);
}

function getClusterPresence(fullText, scrape) {
  return INDUSTRY_KEYWORD_MAP.map((clusterDef) => {
    const termHits = countMatches(fullText, clusterDef.keywords);
    const visibleLinkHits = countMatches((scrape.links || []).join(" "), clusterDef.keywords);
    const score = Math.min(100, termHits * 10 + visibleLinkHits * 8);

    return {
      ...clusterDef,
      detected: score > 0,
      term_hits: termHits,
      visible_link_hits: visibleLinkHits,
      visibility_score: score
    };
  });
}

function buildKeywordClusters(clusterPresence, brandDomain) {
  return clusterPresence
    .map((c) => {
      let opportunityScore = 55;

      if (!c.detected) {
        opportunityScore += 25;
      } else if (c.visibility_score < 30) {
        opportunityScore += 15;
      }

      if (c.intent_type === "adjacent") opportunityScore += 8;
      if (c.intent_type === "expansion") opportunityScore += 12;
      if (c.priority === "high") opportunityScore += 5;

      opportunityScore = Math.min(100, opportunityScore);

      const opportunity_level = classifyBand(opportunityScore);

      return {
        cluster: c.cluster,
        intent_type: c.intent_type,
        priority: c.priority,
        detected_on_competitor: c.detected,
        competitor_visibility_score: c.visibility_score,
        opportunity_score: opportunityScore,
        opportunity_level,
        representative_keywords: c.keywords.slice(0, 6),
        use_cases: c.use_cases,
        recommended_channels: c.channels,
        why_it_matters: c.detected
          ? `${c.cluster} appears to be actively surfaced by the competitor and represents monetizable PPC intent.`
          : `${c.cluster} is relevant to the category but appears underrepresented on the competitor site, creating a potential expansion or white-space opportunity for ${brandDomain}.`
      };
    })
    .sort((a, b) => b.opportunity_score - a.opportunity_score);
}

function buildUnderutilizedKeywords(clusterPresence, brandDomain) {
  const ideas = [];

  for (const c of clusterPresence) {
    const underutilized = !c.detected || c.visibility_score < 25 || c.intent_type !== "core";

    if (!underutilized) continue;

    for (const keyword of c.keywords.slice(0, 4)) {
      ideas.push({
        keyword,
        cluster: c.cluster,
        priority: c.priority,
        opportunity_level: c.intent_type === "expansion" ? "Medium-High" : "High",
        why: !c.detected
          ? `This relevant cluster is not clearly surfaced by the competitor, which may give ${brandDomain} room to build coverage and message ownership.`
          : `This cluster appears only lightly surfaced, suggesting room to attack with more specific PPC segmentation and creative alignment.`,
        recommended_channel: c.channels[0] || "google_ads"
      });
    }
  }

  return ideas.slice(0, 20);
}

function detectCreativeAngles(fullText, scrape) {
  const text = `${fullText} ${(scrape.button_texts || []).join(" ")}`.toLowerCase();

  const angles = CREATIVE_ANGLE_LIBRARY.map((angle) => {
    const trigger_hits = countMatches(text, angle.triggers);
    return {
      angle: angle.angle,
      trigger_hits,
      detected: trigger_hits > 0,
      user_problem: angle.user_problem,
      best_channels: angle.best_channels,
      hook_templates: angle.hook_templates,
      reason: trigger_hits > 0
        ? `Detected ${trigger_hits} trigger hit(s) related to this angle in visible site language.`
        : "Not strongly detected on-page, but still relevant to the category."
    };
  });

  return angles.sort((a, b) => b.trigger_hits - a.trigger_hits);
}

function buildCreativeSummary(detectedAngles) {
  const top = detectedAngles.filter((a) => a.detected).slice(0, 3).map((a) => a.angle);
  if (!top.length) {
    return "No strong on-page creative angles were detected, which suggests either muted messaging or limited direct-response emphasis on the homepage.";
  }
  return `The strongest visible creative angles are ${top.join(", ").toLowerCase()}, which should inform both search copy and paid social hooks.`;
}

function buildAdCreativeCards(detectedAngles, competitorName) {
  return detectedAngles.slice(0, 6).map((a) => ({
    headline: a.hook_templates[0] || a.angle,
    platform: a.best_channels.join(", "),
    cta: "Learn More / Search Now",
    copy: `${competitorName} appears relevant for the "${a.angle}" angle based on visible messaging tied to ${a.user_problem.toLowerCase()}.`,
    notes: a.reason,
    image_url: ""
  }));
}

function scorePpcModel(clusterPresence, detectedAngles, scrape) {
  const coreDetected = clusterPresence.filter((c) => c.intent_type === "core" && c.detected).length;
  const allDetected = clusterPresence.filter((c) => c.detected).length;
  const highIntentDetected = clusterPresence.filter((c) => c.priority === "high" && c.detected).length;
  const expansionDetected = clusterPresence.filter((c) => c.intent_type !== "core" && c.detected).length;
  const angleCount = detectedAngles.filter((a) => a.detected).length;
  const ctaText = [...(scrape.button_texts || []), ...(scrape.anchor_texts || [])].join(" ").toLowerCase();
  const monetizationLinks = (scrape.links || []).filter((u) => /pricing|plans|trial|checkout|subscribe|membership/i.test(u));
  const offerHits = countMatches(ctaText, ["start", "search now", "try", "unlock", "view report", "get report", "see results", "learn more"]);
  const funnelSignals = countMatches(getFullText(scrape), ["search", "results", "report", "pricing", "trial", "checkout", "unlock"]);
  const multiChannelSignals = clusterPresence.filter((c) => c.channels.length >= 3).length;

  const keyword_opportunity_score = Math.min(
    100,
    45 + clusterPresence.filter((c) => !c.detected || c.visibility_score < 25).length * 6
  );

  const paid_intent_coverage_score = Math.min(
    100,
    coreDetected * 24 + highIntentDetected * 8 + Math.min(12, allDetected * 2)
  );

  const creative_angle_diversity_score = Math.min(100, 30 + angleCount * 12);
  const use_case_expansion_score = Math.min(100, 35 + expansionDetected * 14);
  const offer_cta_strength_score = Math.min(100, 25 + offerHits * 10);
  const funnel_monetization_efficiency_score = Math.min(100, 20 + funnelSignals * 7 + monetizationLinks.length * 10);
  const channel_expansion_score = Math.min(100, 30 + multiChannelSignals * 7);

  const composite = Math.min(
    100,
    Math.round(
      keyword_opportunity_score * PPC_SCORE_WEIGHTS.keyword_opportunity_score +
      paid_intent_coverage_score * PPC_SCORE_WEIGHTS.paid_intent_coverage_score +
      creative_angle_diversity_score * PPC_SCORE_WEIGHTS.creative_angle_diversity_score +
      use_case_expansion_score * PPC_SCORE_WEIGHTS.use_case_expansion_score +
      offer_cta_strength_score * PPC_SCORE_WEIGHTS.offer_cta_strength_score +
      funnel_monetization_efficiency_score * PPC_SCORE_WEIGHTS.funnel_monetization_efficiency_score +
      channel_expansion_score * PPC_SCORE_WEIGHTS.channel_expansion_score
    )
  );

  return {
    keyword_opportunity_score,
    paid_intent_coverage_score,
    creative_angle_diversity_score,
    use_case_expansion_score,
    offer_cta_strength_score,
    funnel_monetization_efficiency_score,
    channel_expansion_score,
    keyword_pressure_score: composite,
    pressure_band: classifyBand(composite)
  };
}

function buildScoreExplanations(ppcScores, clusterPresence, detectedAngles, scrape) {
  const underutilizedCount = clusterPresence.filter((c) => !c.detected || c.visibility_score < 25).length;
  const coreDetected = clusterPresence.filter((c) => c.intent_type === "core" && c.detected).length;
  const expansionDetected = clusterPresence.filter((c) => c.intent_type !== "core" && c.detected).length;
  const angleCount = detectedAngles.filter((a) => a.detected).length;
  const monetizationLinks = (scrape.links || []).filter((u) => /pricing|plans|trial|checkout|subscribe|membership/i.test(u)).length;

  return {
    keyword_opportunity_score:
      `Keyword Opportunity scored ${ppcScores.keyword_opportunity_score} because ${underutilizedCount} relevant clusters appear underrepresented or missing, creating room for TruthFinder to expand PPC coverage.`,
    paid_intent_coverage_score:
      `Paid Intent Coverage scored ${ppcScores.paid_intent_coverage_score} based on detection of ${coreDetected} core high-intent category clusters on the competitor surface.`,
    creative_angle_diversity_score:
      `Creative Angle Diversity scored ${ppcScores.creative_angle_diversity_score} because ${angleCount} distinct direct-response angle families were detected in visible messaging.`,
    use_case_expansion_score:
      `Use-Case Expansion scored ${ppcScores.use_case_expansion_score} based on ${expansionDetected} adjacent or expansion use-case clusters beyond the core category.`,
    offer_cta_strength_score:
      `Offer / CTA Strength scored ${ppcScores.offer_cta_strength_score} based on visible CTA language, action prompts, and how forcefully the page moves users toward search or report actions.`,
    funnel_monetization_efficiency_score:
      `Funnel Monetization Efficiency scored ${ppcScores.funnel_monetization_efficiency_score} based on visible signs of search-start, result promise, and monetization path including ${monetizationLinks} pricing or checkout-like links.`,
    channel_expansion_score:
      `Channel Expansion scored ${ppcScores.channel_expansion_score} based on how many use-case clusters map naturally across Google, Bing, Meta, TikTok, and display.`,
    keyword_pressure_score:
      `Composite PPC Pressure scored ${ppcScores.keyword_pressure_score} using weighted PPC dimensions: keyword opportunity (${PPC_SCORE_WEIGHTS.keyword_opportunity_score}), paid intent coverage (${PPC_SCORE_WEIGHTS.paid_intent_coverage_score}), creative angle diversity (${PPC_SCORE_WEIGHTS.creative_angle_diversity_score}), use-case expansion (${PPC_SCORE_WEIGHTS.use_case_expansion_score}), offer / CTA strength (${PPC_SCORE_WEIGHTS.offer_cta_strength_score}), funnel monetization efficiency (${PPC_SCORE_WEIGHTS.funnel_monetization_efficiency_score}), and channel expansion (${PPC_SCORE_WEIGHTS.channel_expansion_score}).`
  };
}

function buildScoringMethodology() {
  return {
    keyword_opportunity_score:
      "Scores the amount of adjacent or underrepresented keyword white space visible relative to the category opportunity map.",
    paid_intent_coverage_score:
      "Scores how many core, monetizable paid-intent clusters the competitor appears to surface on-page.",
    creative_angle_diversity_score:
      "Scores how many distinct creative hook families are visible in the page language and CTA structure.",
    use_case_expansion_score:
      "Scores how far the site expands beyond generic category terms into more specific user jobs-to-be-done.",
    offer_cta_strength_score:
      "Scores the clarity and directness of CTA, search-start, report-access, and offer framing language.",
    funnel_monetization_efficiency_score:
      "Scores whether the page appears to move users from intent capture toward results and monetization with minimal friction.",
    channel_expansion_score:
      "Scores how broadly the detected use cases and hooks can extend across Google Ads, Bing Ads, Meta, TikTok, and display.",
    keyword_pressure_score:
      "Composite PPC model score weighted toward keyword opportunity, paid intent coverage, and creative / use-case differentiation."
  };
}

function buildPressureDrivers(clusterPresence, detectedAngles, scrape, ppcScores) {
  const drivers = [];
  if (ppcScores.keyword_opportunity_score >= 70) drivers.push("Large keyword white-space opportunity");
  if (ppcScores.paid_intent_coverage_score >= 65) drivers.push("Strong paid-intent cluster coverage");
  if (ppcScores.creative_angle_diversity_score >= 60) drivers.push("Multiple creative angle families");
  if (ppcScores.use_case_expansion_score >= 60) drivers.push("Expanded use-case merchandising");
  if ((scrape.links || []).some((u) => /pricing|plans|trial|checkout|subscribe|membership/i.test(u))) {
    drivers.push("Visible monetization path");
  }
  if (detectedAngles.some((a) => a.angle === "Unknown caller resolution" && a.detected)) {
    drivers.push("High-intent reverse phone angle");
  }
  return uniq(drivers).slice(0, 8);
}

function buildPressureSummary(ppcScores, drivers, brandDomain) {
  if (!drivers.length) {
    return `The competitor presents limited explicit PPC-intent depth from the landing page alone, which may create room for ${brandDomain} to win through stronger segmentation and message specificity.`;
  }
  return `Relative PPC pressure appears ${ppcScores.pressure_band.toLowerCase()}, driven by ${drivers.join(", ").toLowerCase()}.`;
}

function buildActionPlan(keywordClusters, underutilizedKeywords, detectedAngles, ppcScores, brandDomain) {
  const actions = [];

  if (ppcScores.keyword_opportunity_score >= 70) {
    actions.push(`Break out white-space search campaigns for underutilized adjacent intents before competitors scale harder into them.`);
  }

  const topKeywordClusters = keywordClusters.slice(0, 4).map((k) => k.cluster);
  if (topKeywordClusters.length) {
    actions.push(`Build segmented search structures around: ${topKeywordClusters.join(", ")}.`);
  }

  const topUnder = underutilizedKeywords.slice(0, 4).map((k) => k.keyword);
  if (topUnder.length) {
    actions.push(`Launch exploratory exact / phrase match testing for: ${topUnder.join(", ")}.`);
  }

  const topAngles = detectedAngles.filter((a) => a.detected).slice(0, 3).map((a) => a.angle);
  if (topAngles.length) {
    actions.push(`Test new ad creative around these angle families: ${topAngles.join(", ")}.`);
  }

  actions.push(`Audit TruthFinder landing pages against competitor CTA, use-case specificity, and monetization sequencing.`);
  actions.push(`Create cross-channel message maps so Google/Bing copy, Meta/TikTok hooks, and display retargeting all align to the same user problem.`);
  actions.push(`Use ${brandDomain} as the message anchor for stronger trust, report depth, and practical problem-solving instead of generic category copy.`);
  actions.push(`Track query-level winners by use case, not just by campaign, so budgets can move toward the highest-intent problem clusters.`);

  return uniq(actions).slice(0, 10);
}

function buildChannelRecommendations(keywordClusters, detectedAngles, underutilizedKeywords) {
  const topSearchClusters = keywordClusters.filter((k) => k.recommended_channels.includes("google_ads")).slice(0, 4);
  const topSocialAngles = detectedAngles.filter((a) => a.best_channels.includes("meta_ads") || a.best_channels.includes("tiktok_ads")).slice(0, 4);
  const displayClusters = keywordClusters.filter((k) => k.recommended_channels.includes("display")).slice(0, 4);

  return {
    google_ads: [
      "Segment campaigns by use case, not just by generic category term.",
      `Prioritize keyword clusters: ${topSearchClusters.map((c) => c.cluster).join(", ") || "reverse phone lookup, people search, background check"}.`,
      "Use tighter RSA and exact-match structures for high-intent lookup themes.",
      "Defend branded and problem-solution queries with stronger trust + utility combinations."
    ],
    bing_ads: [
      "Replicate the highest-intent Google structures first before broadening coverage.",
      "Bias toward exact and phrase match where CPC efficiency allows deeper experimentation.",
      "Use audience layering and older-skewing demographic intent where relevant."
    ],
    meta_ads: [
      `Lead with user-problem hooks like: ${topSocialAngles.map((a) => a.angle).join(", ") || "unknown caller resolution, safety / protect myself, dating / before meeting someone"}.`,
      "Use scenario-led creatives rather than feature-only messaging.",
      "Retarget search visitors with reassurance, trust, and report-depth proof."
    ],
    tiktok_ads: [
      "Use short narrative hooks tied to specific problems: scam concern, unknown caller, dating safety, or address curiosity.",
      "Test creator-style storytelling with strong first-3-second hooks and clear payoff.",
      "Keep offers simple and use cases concrete."
    ],
    display: [
      `Build retargeting around clusters like: ${displayClusters.map((c) => c.cluster).join(", ") || "reverse phone lookup, background check, property records"}.`,
      "Retarget by funnel stage: homepage visitor, search starter, pricing visitor, and report abandoner.",
      "Use static and motion variants that reinforce trust, speed, and report depth."
    ]
  };
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
        notes: ads.length > 0
          ? `Detected ${ads.length} paid placements in returned SERP snapshot.`
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
  if (!base) {
    return {
      creative_summary: "No ad creative feed configured. Set AD_CREATIVE_API_BASE to return real competitor ad creative screenshots and metadata.",
      ad_creatives: []
    };
  }

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
      ad_creatives: Array.isArray(payload.ad_creatives) ? payload.ad_creatives.slice(0, 10) : []
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
      detail: `Fetched ${scrape.final_url} and parsed visible PPC-relevant content.`
    },
    {
      name: "SERP Data",
      status: serpConnected ? "Connected" : "Not connected",
      detail: serpConnected ? "Live SERP snapshots returned." : "No live SERP source returned."
    },
    {
      name: "Ad Creatives",
      status: creativesConnected ? "Connected" : "Not connected",
      detail: creativesConnected ? `${adCreatives.length} creative assets returned.` : "No live creative source returned."
    },
    {
      name: "Screenshot Capture",
      status: screenshotConnected ? "Connected" : "Not connected",
      detail: screenshotConnected ? "One or more screenshots were returned." : "No screenshot source returned."
    }
  ];
}

function buildDetectedHooks(detectedAngles) {
  return detectedAngles
    .filter((a) => a.detected)
    .slice(0, 6)
    .map((a) => a.angle);
}

function buildFunnelSteps(scrape) {
  const text = getFullText(scrape).toLowerCase();
  const steps = ["Homepage / intent capture"];

  if (["search", "lookup", "find", "start"].some((k) => text.includes(k))) {
    steps.push("Search input / lookup start");
  }
  if (["results", "report", "records", "details", "matches"].some((k) => text.includes(k))) {
    steps.push("Perceived results / value build");
  }
  if (["pricing", "plans", "trial", "checkout", "subscribe", "membership"].some((k) => text.includes(k))) {
    steps.push("Monetization / paywall handoff");
  }
  if ((scrape.links || []).some((u) => /pricing|plans|checkout|subscribe|membership|trial/i.test(u))) {
    steps.push("Dedicated pricing or checkout page likely");
  }

  return uniq(steps).slice(0, 5);
}

function buildSummary(domain, ppcScores, keywordClusters, detectedAngles, brandDomain) {
  const topClusters = keywordClusters.slice(0, 3).map((k) => k.cluster);
  const topAngles = detectedAngles.filter((a) => a.detected).slice(0, 2).map((a) => a.angle);

  return `${domain} shows ${ppcScores.pressure_band.toLowerCase()} PPC pressure with the biggest opportunities centered on ${topClusters.join(", ") || "core lookup intent"}. The most visible creative angles are ${topAngles.join(", ").toLowerCase() || "not strongly differentiated"}, creating actionable room for ${brandDomain} to compete more aggressively on keyword segmentation, hook specificity, and cross-channel message alignment.`;
}

async function analyzeCompetitor(inputUrl, env, payload = {}) {
  const brandDomain = String(env.BRAND_DOMAIN || "truthfinder.com").trim();
  const market = String(payload.market || "people_search");
  const device = String(payload.device || "mobile");
  const analystQuestions = String(payload.questions || "").trim();

  const url = normalizeInput(inputUrl);
  if (!url) {
    throw new Error("Please enter a competitor URL or domain.");
  }

  const scrape = await fetchHtml(url);
  const domain = domainFromUrl(scrape.final_url);
  const competitorName = domain.replace(".com", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const fullText = getFullText(scrape);
  const clusterPresence = getClusterPresence(fullText, scrape);
  const keyword_clusters = buildKeywordClusters(clusterPresence, brandDomain);
  const underutilized_keywords = buildUnderutilizedKeywords(clusterPresence, brandDomain);
  const detectedAngles = detectCreativeAngles(fullText, scrape);
  const creative_angles = detectedAngles.slice(0, 8);
  const ppcScores = scorePpcModel(clusterPresence, detectedAngles, scrape);

  const score_explanations = buildScoreExplanations(ppcScores, clusterPresence, detectedAngles, scrape);
  const scoring_methodology = buildScoringMethodology();
  const pressure_drivers = buildPressureDrivers(clusterPresence, detectedAngles, scrape, ppcScores);
  const pressure_summary = buildPressureSummary(ppcScores, pressure_drivers, brandDomain);
  const detected_hooks = buildDetectedHooks(detectedAngles);
  const detected_funnel_steps = buildFunnelSteps(scrape);
  const evidence_extracts = buildEvidenceExtracts(scrape);
  const creative_summary = buildCreativeSummary(detectedAngles);

  let ad_creatives = buildAdCreativeCards(detectedAngles, competitorName);
  const liveCreativePayload = await maybeCreativeFeed(domain, env);
  if (liveCreativePayload.ad_creatives.length) {
    ad_creatives = liveCreativePayload.ad_creatives;
  }

  const creativeSummaryFinal = liveCreativePayload.ad_creatives.length
    ? liveCreativePayload.creative_summary
    : creative_summary;

  const screenshots = [];
  const homepageShot = await maybeScreenshot(scrape.final_url, "Homepage Above the Fold", "Intent Capture", env);
  if (homepageShot) screenshots.push(homepageShot);

  const pricingLink = (scrape.links || []).find((u) => /pricing|plans|trial|checkout|subscribe|membership/i.test(u));
  if (pricingLink) {
    const pricingShot = await maybeScreenshot(pricingLink, "Pricing / Monetization Page", "Monetization", env);
    if (pricingShot) screenshots.push(pricingShot);
  }

  const serps = await analyzeSerps(domain, env);
  const channel_recommendations = buildChannelRecommendations(keyword_clusters, detectedAngles, underutilized_keywords);
  const data_sources = buildDataSources(scrape, serps, screenshots, ad_creatives);

  const key_observations = [
    `Top keyword opportunity areas: ${keyword_clusters.slice(0, 3).map((k) => k.cluster).join(", ") || "not enough data"}.`,
    `Top creative angle signals: ${creative_angles.filter((a) => a.detected).slice(0, 3).map((a) => a.angle).join(", ") || "not strongly differentiated"}.`,
    `${underutilized_keywords.length} underutilized keyword ideas were generated from the category map and competitor surface analysis.`,
    pricingLink
      ? "A likely pricing / monetization path was detected."
      : "No clear pricing / checkout path was detected from the parsed landing page."
  ];

  const action_plan = buildActionPlan(keyword_clusters, underutilized_keywords, detectedAngles, ppcScores, brandDomain);

  return {
    competitor_name: competitorName,
    domain,
    input_url: url,
    market,
    device,
    analyst_questions: analystQuestions,

    page_title: scrape.title,
    meta_description: scrape.meta_description,
    headline: scrape.h1,
    summary: buildSummary(domain, ppcScores, keyword_clusters, detectedAngles, brandDomain),

    keyword_opportunity_score: ppcScores.keyword_opportunity_score,
    paid_intent_coverage_score: ppcScores.paid_intent_coverage_score,
    creative_angle_diversity_score: ppcScores.creative_angle_diversity_score,
    use_case_expansion_score: ppcScores.use_case_expansion_score,
    offer_cta_strength_score: ppcScores.offer_cta_strength_score,
    funnel_monetization_efficiency_score: ppcScores.funnel_monetization_efficiency_score,
    channel_expansion_score: ppcScores.channel_expansion_score,

    keyword_pressure_score: ppcScores.keyword_pressure_score,
    pressure_band: ppcScores.pressure_band,

    // compatibility fields for older UI cards
    trust_score: Math.round((ppcScores.paid_intent_coverage_score + ppcScores.offer_cta_strength_score) / 2),
    urgency_score: Math.round((ppcScores.offer_cta_strength_score + ppcScores.funnel_monetization_efficiency_score) / 2),
    utility_score: ppcScores.keyword_opportunity_score,
    value_score: Math.round((ppcScores.keyword_opportunity_score + ppcScores.use_case_expansion_score) / 2),
    emotional_score: Math.round((ppcScores.creative_angle_diversity_score + ppcScores.channel_expansion_score) / 2),
    seo_signal_score: Math.round((ppcScores.paid_intent_coverage_score + ppcScores.use_case_expansion_score) / 2),

    score_explanations,
    scoring_methodology,
    pressure_summary,
    pressure_drivers,

    keyword_clusters,
    underutilized_keywords,
    creative_angles,
    channel_recommendations,

    data_sources,
    detected_hooks,
    detected_funnel_steps,
    key_observations,
    action_plan,
    evidence_extracts,

    creative_summary: creativeSummaryFinal,
    ad_creatives,
    serps,
    screenshots,

    crawl_notes: [
      `Fetched ${scrape.final_url} with HTTP ${scrape.status_code}`,
      `Parsed ${(scrape.links || []).length} internal links, ${(scrape.button_texts || []).length} buttons, and ${(scrape.anchor_texts || []).length} anchor texts`,
      `Detected ${keyword_clusters.filter((k) => k.detected_on_competitor).length} keyword clusters and ${creative_angles.filter((a) => a.detected).length} creative angle families`,
      `Brand comparison anchor: ${brandDomain}`,
      `Analysis context: market=${market}, device=${device}`,
      analystQuestions ? `Analyst focus questions: ${analystQuestions}` : "No custom analyst questions supplied.",
      "No persistent storage is used; each analysis is generated fresh per request."
    ]
  };
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const inputUrl = payload?.url || "";
    const result = await analyzeCompetitor(inputUrl, context.env, payload);

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
