export default async (req) => {
  try {
    const url = new URL(req.url);
    const insee = url.searchParams.get("insee");
    const endpoint = url.searchParams.get("endpoint") || "placeOfInterest";
    const pageSize = url.searchParams.get("page_size") || "50";
    const next = url.searchParams.get("next");

    if (!insee && !next) {
      return new Response(JSON.stringify({ error: "Paramètre 'insee' manquant." }), { status: 400 });
    }

    const base = "https://api.datatourisme.fr";
    const targetUrl = next
      ? `${base}${next}`
      : `${base}/v1/${endpoint}?insee=${encodeURIComponent(insee)}&lang=fr&page_size=${encodeURIComponent(pageSize)}&page=1`;

    const r = await fetch(targetUrl, {
      headers: { "X-API-Key": process.env.DATATOURISME_API_KEY }
    });

    const data = await r.json();

    return new Response(JSON.stringify(data), {
      status: r.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
