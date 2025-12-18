(() => {
  const $ = (sel) => document.querySelector(sel);

  const form = $("#form");

  const el = {
    // Inputs
    name: $("#name"),
    content: $("#content"),
    ingredients: $("#ingredients"),
    whatsapp: $("#whatsapp"),
    noSalt: $("#noSalt"),
    benefits: $("#benefits"),
    wmm: $("#wmm"),
    hmm: $("#hmm"),

    // Label (preview/export)
    label: $("#label"),
    pName: $("#pName"),
    pIngredients: $("#pIngredients"),
    pContent: $("#pContent"),
    pWhatsapp: $("#pWhatsapp"),
    pNoSalt: $("#pNoSalt"),
    pBenefits: $("#pBenefits"),

    // Buttons
    btnPrint: $("#btnPrint"),
    btnPng: $("#btnPng"),
    btnPdf: $("#btnPdf"),
    btnClear: $("#btnClear"),

    // Optional button in HTML: <button id="btnSample">
    btnSample: $("#btnSample"),
  };

  const STORAGE_KEY = "etiquetas_dahimy_last";

  // Ejemplo por defecto (se verá al abrir el link por primera vez)
  const SAMPLE = {
    name: "Champú Artesanal Dahimy",
    content: "500 ml",
    ingredients:
      "Romero, Cola de caballo, Guásimo, Quina, Sábila, Pepa de aguacate, Moringa",
    whatsapp: "315 470 4442 / 350 795 1096",
    noSalt: true,
    benefits: `Fortalece y estimula el crecimiento
Ayuda a reducir la caída
Hidratación
Limpieza profunda
Nutrición`,
    wmm: 100,
    hmm: 70,
  };

  function parseListByLines(text) {
    return (text || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function setLabelSizeMm(w, h) {
    document.documentElement.style.setProperty("--label-w", `${w}mm`);
    document.documentElement.style.setProperty("--label-h", `${h}mm`);
  }

  function buildBenefits(items) {
    el.pBenefits.innerHTML = "";
    if (!items.length) return;

    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item;
      el.pBenefits.appendChild(li);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function updateLabel(data) {
    el.pName.textContent = data.name?.trim() || "Producto";

    const ing = (data.ingredients || "").trim();
    el.pIngredients.innerHTML = ing
      ? `<strong>Principales ingredientes:</strong> ${escapeHtml(ing)}`
      : `<strong>Principales ingredientes:</strong> —`;

    const content = (data.content || "").trim();
    el.pContent.textContent = content ? `Contenido: ${content}` : `Contenido: —`;

    const wa = (data.whatsapp || "").trim();
    el.pWhatsapp.innerHTML = wa
      ? `<strong>WhatsApp:</strong> ${escapeHtml(wa)}`
      : `<strong>WhatsApp:</strong> —`;

    el.pNoSalt.classList.toggle("hide", !data.noSalt);

    buildBenefits(parseListByLines(data.benefits));

    const w = Number(data.wmm) || 100;
    const h = Number(data.hmm) || 70;
    setLabelSizeMm(w, h);
  }

  function readForm() {
    return {
      name: el.name?.value?.trim() ?? "",
      content: el.content?.value?.trim() ?? "",
      ingredients: el.ingredients?.value?.trim() ?? "",
      whatsapp: el.whatsapp?.value?.trim() ?? "",
      noSalt: !!el.noSalt?.checked,
      benefits: el.benefits?.value ?? "",
      wmm: el.wmm?.value ?? 100,
      hmm: el.hmm?.value ?? 70,
    };
  }

  function fillForm(data) {
    if (!data) return;

    el.name.value = data.name || "";
    el.content.value = data.content || "";
    el.ingredients.value = data.ingredients || "";
    el.whatsapp.value = data.whatsapp || "";
    el.noSalt.checked = !!data.noSalt;
    el.benefits.value = data.benefits || "";
    el.wmm.value = data.wmm ?? 100;
    el.hmm.value = data.hmm ?? 70;
  }

  function saveToStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Si el navegador bloquea storage (modo privado raro), igual funciona sin guardar
    }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function fileSafeName(name) {
    return String(name || "etiqueta")
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function downloadPng() {
    if (!window.html2canvas) {
      alert("No se cargó html2canvas. Revisa tu conexión o el CDN.");
      return;
    }

    const canvas = await window.html2canvas(el.label, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const a = document.createElement("a");
    a.download = fileSafeName(`${el.name.value || "etiqueta"}.png`);
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  async function downloadPdf() {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF || !window.html2canvas) {
      alert("No se cargó jsPDF/html2canvas. Revisa tu conexión o el CDN.");
      return;
    }

    const data = readForm();
    const wmm = Number(data.wmm) || 100;
    const hmm = Number(data.hmm) || 70;

    const canvas = await window.html2canvas(el.label, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const doc = new jsPDF({
      orientation: wmm >= hmm ? "landscape" : "portrait",
      unit: "mm",
      format: [wmm, hmm],
    });

    doc.addImage(imgData, "PNG", 0, 0, wmm, hmm);
    doc.save(fileSafeName(`${data.name || "etiqueta"}.pdf`));
  }

  function clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    form.reset();

    // Valores por defecto de tamaño (para que no quede vacío)
    el.wmm.value = 100;
    el.hmm.value = 70;

    // Luego de limpiar, volvemos al ejemplo (si prefieres que quede en blanco, te lo cambio)
    fillForm(SAMPLE);
    updateLabel(SAMPLE);
    saveToStorage(SAMPLE);
  }

  function init() {
    // 1) Cargar último estado o, si no existe, cargar el ejemplo
    const last = loadFromStorage();
    if (last) {
      fillForm(last);
      updateLabel(last);
    } else {
      fillForm(SAMPLE);
      updateLabel(SAMPLE);
      saveToStorage(SAMPLE);
    }

    // 2) Submit manual
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = readForm();
      updateLabel(data);
      saveToStorage(data);
    });

    // 3) Auto-actualizar + auto-guardar al cambiar
    ["input", "change"].forEach((evt) => {
      form.addEventListener(evt, () => {
        const data = readForm();
        updateLabel(data);
        saveToStorage(data);
      });
    });

    // 4) Botones
    el.btnPrint.addEventListener("click", () => window.print());
    el.btnPng.addEventListener("click", downloadPng);
    el.btnPdf.addEventListener("click", downloadPdf);
    el.btnClear.addEventListener("click", clearAll);

    // 5) Botón opcional "Cargar ejemplo" (si existe en el HTML)
    if (el.btnSample) {
      el.btnSample.addEventListener("click", () => {
        fillForm(SAMPLE);
        updateLabel(SAMPLE);
        saveToStorage(SAMPLE);
      });
    }
  }

  init();
})();