export default async (req) => {
  try {
    const url = new URL(req.url);

    const endpoint = url.searchParams.get("endpoint") || "placeOfInterest";
    const next = url.searchParams.get("next");

    const base = "https://api.datatourisme.fr";

    // Paramètres autorisés (whitelist) => correspond à Swagger
    const allowed = [
      "insee",
      "department",
      "region",
      "update",
      "review",
      "amenity",
      "theme",
      "reduced_mobility_access",
      "client_target",
      "locomotion_mode",
      "difficulty_level",
      "geo_distance",
      "start",
      "end",
      "filters",
      "search",
      "fields",
      "lang",
      "sort",
      "page",
      "page_size",
      "type"
    ];

    // Si pas de "next", il faut au minimum un critère de zone (insee/department/region) ou un filters
    const hasArea =
      url.searchParams.get("insee") ||
      url.searchParams.get("department") ||
      url.searchParams.get("region") ||
      url.searchParams.get("filters");

    if (!next && !hasArea) {
      return new Response(
        JSON.stringify({
          error:
            "Paramètre manquant. Fournis 'insee' (ou 'department' / 'region' / 'filters'), ou bien 'next'."
        }),
        { status: 400 }
      );
    }

    // Construit la querystring en ne gardant que les paramètres autorisés
    const qs = new URLSearchParams();
    for (const key of allowed) {
      const v = url.searchParams.get(key);
      if (v !== null && v !== "") qs.set(key, v);
    }

    // Defaults
    if (!qs.has("lang")) qs.set("lang", "fr");
    if (!qs.has("page_size")) qs.set("page_size", "50");
    if (!qs.has("page")) qs.set("page", "1");

    // URL finale (priorité à next si fourni)
    const targetUrl = next
      ? (next.startsWith("http") ? next : `${base}${next}`)
      : `${base}/v1/${endpoint}?${qs.toString()}`;

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
