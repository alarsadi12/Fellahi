// Cloudflare Worker starter for Fellahi 2.0
// Configure OPENAI_API_KEY as a Worker Secret. Never expose it in browser code.
export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (new URL(request.url).pathname !== "/diagnose" || request.method !== "POST")
      return new Response("Not found", { status: 404, headers: cors });
    if (!env.OPENAI_API_KEY)
      return Response.json({ error: "Server API secret is not configured" }, { status: 503, headers: cors });
    try {
      const body = await request.json();
      if (!body.image || typeof body.image !== "string" || !body.image.startsWith("data:image/"))
        return Response.json({ error: "A data:image URL is required" }, { status: 400, headers: cors });
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: [{ role: "user", content: [
            { type: "input_text", text: `حلّل الصورة كمساعدة أولية لتشخيص نباتي. اذكر الاحتمالات ودرجة الثقة والعلامات التي تدعمها، وما المعلومات الناقصة. لا تجزم بالتشخيص ولا توصي بجرعة مبيد. سياق المستخدم: ${String(body.context || "").slice(0,3000)}` },
            { type: "input_image", image_url: body.image }
          ]}]
        })
      });
      const data = await response.json();
      if (!response.ok) return Response.json({ error: "AI provider request failed", details: data.error?.message || "Unknown error" }, { status: 502, headers: cors });
      return Response.json({ result: data.output_text || "لم يصل نص تشخيصي." }, { headers: cors });
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400, headers: cors });
    }
  }
};