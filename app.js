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
    wmm: 90,
    hmm: 110,
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
    const name = data.name?.trim() || "";
    el.pName.textContent = name;

    const ing = (data.ingredients || "").trim();
    if (ing) {
      el.pIngredients.innerHTML = `<strong>Principales ingredientes:</strong> ${escapeHtml(ing)}`;
    } else {
      el.pIngredients.innerHTML = "";
    }
    el.pIngredients.classList.toggle("hide", !ing);

    const content = (data.content || "").trim();
    el.pContent.textContent = content ? `Contenido: ${content}` : "";
    el.pContent.classList.toggle("hide", !content);

    const wa = (data.whatsapp || "").trim();
    if (wa) {
      el.pWhatsapp.innerHTML = `<strong>WhatsApp:</strong> ${escapeHtml(wa)}`;
    } else {
      el.pWhatsapp.innerHTML = "";
    }
    el.pWhatsapp.classList.toggle("hide", !wa);

    el.pNoSalt.classList.toggle("hide", !data.noSalt);

    const benefits = parseListByLines(data.benefits);
    buildBenefits(benefits);
    el.pBenefits.classList.toggle("hide", !benefits.length);

    const w = Number(data.wmm) || 90;
    const h = Number(data.hmm) || 110;
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
      wmm: el.wmm?.value ?? 90,
      hmm: el.hmm?.value ?? 110,
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
    el.wmm.value = data.wmm ?? 90;
    el.hmm.value = data.hmm ?? 110;
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
    const wmm = Number(data.wmm) || 90;
    const hmm = Number(data.hmm) || 110;

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
    // Valores por defecto de tama??o (para que no quede vac??o)
    el.wmm.value = 90;
    el.hmm.value = 110;
    const empty = readForm();
    updateLabel(empty);
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

