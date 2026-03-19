export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const inputUrl = payload?.url || "";
    return new Response(JSON.stringify({
      competitor_name: inputUrl,
      status: "Cloudflare function working"
    }), {
      headers: {"Content-Type":"application/json"}
    });
  } catch (err) {
    return new Response(JSON.stringify({error: err.message}), {
      status: 400,
      headers: {"Content-Type":"application/json"}
    });
  }
}