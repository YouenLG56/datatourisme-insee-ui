export default async (req) => {
  try {
    const url = new URL(req.url);

    // Params "techniques" de ton proxy
    const endpoint = url.searchParams.get("endpoint") || "placeOfInterest";
    const next = url.searchParams.get("next");

    // On reconstruit une query qui contient TOUS les params utilisateur
    // sauf endpoint/next (gérés ici)
    const forwarded = new URLSearchParams(url.searchParams);
    forwarded.delete("endpoint");
    forwarded.delete("next");

    const base = "https://api.datatourisme.fr";
    const targetUrl = next
      ? (next.startsWith("http") ? next : `${base}${next}`)
      : `${base}/v1/${endpoint}?${forwarded.toString()}`;

    const r = await fetch(targetUrl, {
      headers: { "X-API-Key": process.env.DATATOURISME_API_KEY }
    });

    const text = await r.text(); // évite crash si pas JSON
    return new Response(text, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") || "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
