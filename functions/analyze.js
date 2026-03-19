export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const inputUrl = payload?.url || "";
    const cleaned = String(inputUrl).trim();

    if (!cleaned) {
      return new Response(JSON.stringify({ error: "Please enter a competitor URL or domain." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const domain = cleaned
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];

    const result = {
      competitor_name: domain,
      domain,
      input_url: cleaned,
      page_title: `${domain} homepage`,
      meta_description: "",
      headline: "Sample competitor headline",
      summary: "Live competitor analysis generated from upgraded cloud deployment.",
      trust_score: 74,
      urgency_score: 68,
      utility_score: 71,
      value_score: 59,
      emotional_score: 63,
      seo_signal_score: 66,
      keyword_pressure_score: 81,
      pressure_band: "High",
      detected_hooks: [
        "Trust / authority",
        "Utility / lookup",
        "Report depth"
      ],
      detected_funnel_steps: [
        "Homepage / intent capture",
        "Search input / lookup start",
        "Perceived results / progress build",
        "Monetization / paywall handoff"
      ],
      key_observations: [
        "Starter analysis engine is now replaced with the upgraded UI-compatible version.",
        "This confirms GitHub and Cloudflare are deploying the correct files.",
        "Next step is swapping this mock analysis for the full scraping engine."
      ],
      action_plan: [
        "Increase trust proof above the fold.",
        "Strengthen urgent-value messaging on high-intent terms.",
        "Audit landing page friction against top competitors.",
        "Expand paid search defense on core lookup terms."
      ],
      serps: [
        {
          query: domain,
          source: "Starter data",
          ads_count: 3,
          top_organic_titles: ["Homepage", "Pricing", "FAQ"]
        }
      ],
      screenshots: [],
      crawl_notes: [
        "Cloudflare Pages function executed successfully.",
        "GitHub-connected deployment is active.",
        "This is upgraded placeholder data, not raw function test output."
      ]
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Analysis failed" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
