const API = "/.netlify/functions/datatourisme";

let nextUrl = null;

function parseExtras(text) {
  const params = {};
  (text || "")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"))
    .forEach(line => {
      const i = line.indexOf("=");
      if (i > 0) {
        const k = line.slice(0, i).trim();
        const v = line.slice(i + 1).trim();
        if (k) params[k] = v;
      }
    });
  return params;
}

function getEndpoint() {
  const sel = document.getElementById("endpoint").value;
  const custom = document.getElementById("endpointCustom").value.trim();
  if (sel === "custom") return custom || "placeOfInterest";
  if (sel === "all") return ""; // on enverra endpoint vide => proxy: /v1/ (si tu veux "tout", on force endpoint=placeOfInterest côté proxy sinon)
  return sel;
}

function buildParams() {
  const endpointSel = document.getElementById("endpoint").value;
  const endpointCustom = document.getElementById("endpointCustom");

  endpointCustom.disabled = endpointSel !== "custom";

  const endpoint = getEndpoint();

  const params = {
    endpoint: endpoint || "placeOfInterest",
    insee: document.getElementById("insee").value.trim(),
    page_size: document.getElementById("page_size").value,
  };

  // Champs Swagger classiques
  const keys = ["search", "filters", "fields", "sort", "type", "department", "region"];
  for (const k of keys) {
    const v = document.getElementById(k).value.trim();
    if (v) params[k] = v;
  }

  // Paramètres libres key=value
  const extras = parseExtras(document.getElementById("extras").value);
  Object.assign(params, extras);

  return params;
}

function setStatus(txt) {
  document.getElementById("status").textContent = txt || "";
}

function showError(err) {
  const el = document.getElementById("msg");
  el.style.display = "block";
  el.textContent = err;
}

function clearError() {
  const el = document.getElementById("msg");
  el.style.display = "none";
  el.textContent = "";
}

function renderCards(objects) {
  const root = document.getElementById("results");
  root.innerHTML = "";

  (objects || []).forEach(o => {
    const label = o?.label?.["@fr"] || o?.label?.fr || o?.label || "(sans nom)";
    const types = Array.isArray(o?.type) ? o.type.slice(0, 4) : [];
    const uuid = o?.uuid || "";
    const uri = o?.uri || "";
    const city = o?.isLocatedAt?.[0]?.address?.[0]?.addressLocality || o?.isLocatedAt?.[0]?.address?.[0]?.hasAddressCity?.label?.["@fr"] || "";
    const lat = o?.isLocatedAt?.[0]?.geo?.latitude;
    const lon = o?.isLocatedAt?.[0]?.geo?.longitude;

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div style="font-weight:700;margin-bottom:8px;">${escapeHtml(label)}</div>
      <div style="margin-bottom:8px;">
        ${types.map(t => `<span class="badge">${escapeHtml(t)}</span>`).join("")}
      </div>
      <div class="muted">${escapeHtml(city)}</div>
      <div class="muted">UUID: ${escapeHtml(uuid)}</div>
      <div class="muted" style="margin-top:6px;">
        ${uri ? `<a href="${uri}" target="_blank" rel="noopener">Voir ressource</a>` : ""}
        ${lat && lon ? ` • <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}" target="_blank" rel="noopener">Carte</a>` : ""}
      </div>
    `;
    root.appendChild(div);
  });
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchData(params) {
  clearError();
  setStatus("Chargement...");

  const qs = new URLSearchParams(params);
  const url = `${API}?${qs.toString()}`;

  const r = await fetch(url);
  const data = await r.json();

  if (!r.ok) {
    throw new Error(JSON.stringify(data, null, 2));
  }

  // pagination
  nextUrl = data?.meta?.next || null;
  document.getElementById("btnNext").disabled = !nextUrl;

  // rendu
  const total = data?.meta?.total ?? (data?.objects?.length ?? 0);
  const page = data?.meta?.page ?? 1;
  const pageSize = data?.meta?.page_size ?? params.page_size;

  setStatus(`Résultats: ${data?.objects?.length ?? 0} (total: ${total}) — page ${page} / taille ${pageSize}`);
  renderCards(data.objects);

  return data;
}

document.getElementById("endpoint").addEventListener("change", () => buildParams());

document.getElementById("btnSearch").addEventListener("click", async () => {
  try {
    nextUrl = null;
    document.getElementById("btnNext").disabled = true;

    const params = buildParams();
    await fetchData(params);
  } catch (e) {
    showError(String(e));
    setStatus("");
  }
});

document.getElementById("btnNext").addEventListener("click", async () => {
  try {
    if (!nextUrl) return;
    await fetchData({ next: nextUrl });
  } catch (e) {
    showError(String(e));
    setStatus("");
  }
});
