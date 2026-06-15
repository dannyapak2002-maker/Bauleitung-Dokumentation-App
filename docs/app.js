const WETTER_ICONS = { "Sonnig":"☀️","Bewölkt":"⛅","Regnerisch":"🌧️","Windig":"💨","Schnee":"❄️","Nebel":"🌫️" };
const WETTER_OPT = Object.keys(WETTER_ICONS);

function loadState() {
  try {
    const s = localStorage.getItem("baustellenApp");
    if (s) return JSON.parse(s);
  } catch(e) {}
  return {
    baustellen: [
      { id: 1, name: "Baustelle Leipzig Nord", bauleiter: "Thomas M.", aufgaben: [
        { id: 1, text: "Betonlieferung abstimmen", erledigt: false },
        { id: 2, text: "Schalung kontrollieren", erledigt: true }
      ]},
      { id: 2, name: "Baustelle Dresden Süd", bauleiter: "Klaus B.", aufgaben: [
        { id: 1, text: "Gerüst abnehmen lassen", erledigt: false }
      ]}
    ],
    tagebuch: [
      { id: 1, baustelleId: 1, datum: "2026-06-10", wetter: "Sonnig", temp: "22", mitarbeiter: "4",
        inhalt: "Erdarbeiten abgeschlossen. Fundamentschalung begonnen. Betonlieferung für morgen bestätigt.", besonderheiten: "" }
    ],
    einkaeufe: [
      { id: 1, baustelleId: 1, datum: "2026-06-12", lieferant: "Raab Karcher", artikel: "Betonschrauben 12mm", menge: "500 Stk.", betrag: "142,00 €" }
    ]
  };
}

let state = loadState();

function save() {
  localStorage.setItem("baustellenApp", JSON.stringify(state));
}

let ui = { tab: 0, expandedBaustelle: null, expandedTagebuch: null, editTagebuchId: null,
           showAddBaustelle: false, showAddTagebuch: false, showAddEinkauf: false,
           filterTagebuch: "alle", filterEinkauf: "alle" };

function showTab(i) {
  ui.tab = i;
  document.querySelectorAll(".tab-btn").forEach((b, idx) => b.classList.toggle("active", idx === i));
  document.querySelectorAll(".tab-panel").forEach((p, idx) => p.classList.toggle("active", idx === i));
  render();
}

function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null || c === false) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

function div(cls, ...children) { return el("div", { class: cls }, ...children); }
function span(cls, text) { return el("span", { class: cls }, text); }
function btn(label, cls, onClick) { const b = el("button", { class: "btn " + cls, onClick }); b.innerHTML = label; return b; }
function field(labelText, inputEl) { const f = div("field"); if (labelText) { const l = el("label"); l.textContent = labelText; f.appendChild(l); } f.appendChild(inputEl); return f; }
function input(attrs) { return el("input", attrs); }
function textarea(attrs, val) { const t = el("textarea", attrs); t.value = val || ""; return t; }
function select(opts, val, onChange) { const s = el("select", { onChange }); opts.forEach(o => { const op = el("option", { value: o }); op.textContent = o; if (o == val) op.selected = true; s.appendChild(op); }); return s; }
function baustellenSelect(val, onChange) { const s = el("select", { onChange }); state.baustellen.forEach(b => { const op = el("option", { value: b.id }); op.textContent = b.name; if (b.id == val) op.selected = true; s.appendChild(op); }); return s; }
function today() { return new Date().toISOString().slice(0, 10); }
function uid() { return Date.now() + Math.random(); }

function render() {
  if (ui.tab === 0) renderBaustellen();
  if (ui.tab === 1) renderTagebuch();
  if (ui.tab === 2) renderEinkaeufe();
}

function renderBaustellen() {
  const p = document.getElementById("panel-0");
  p.innerHTML = "";
  const hdr = div("section-header");
  const h2 = el("h2"); h2.textContent = "Baustellen & Aufgaben";
  const addBtn = btn("+ Baustelle", "btn btn-primary btn-sm", () => {
    ui.showAddBaustelle = !ui.showAddBaustelle; render();
  });
  hdr.appendChild(h2); hdr.appendChild(addBtn);
  p.appendChild(hdr);

  if (ui.showAddBaustelle) {
    const form = div("card card-yellow");
    const nameInp = input({ type: "text", placeholder: "z.B. Baustelle Chemnitz Mitte" });
    const blInp = input({ type: "text", placeholder: "Name des Bauleiters" });
    form.appendChild(field("Baustellen-Name", nameInp));
    form.appendChild(field("Bauleiter", blInp));
    const row = div("btn-row");
    row.appendChild(btn("Speichern", "btn btn-primary", () => {
      if (!nameInp.value.trim()) return;
      state.baustellen.push({ id: uid(), name: nameInp.value.trim(), bauleiter: blInp.value.trim(), aufgaben: [] });
      save(); ui.showAddBaustelle = false; render();
    }));
    row.appendChild(btn("Abbrechen", "btn btn-secondary", () => { ui.showAddBaustelle = false; render(); }));
    form.appendChild(row);
    p.appendChild(form);
  }

  state.baustellen.forEach(b => {
    const offen = b.aufgaben.filter(a => !a.erledigt).length;
    const expanded = ui.expandedBaustelle === b.id;
    const card = div("card");
    const hRow = div("card-header-row");
    const left = div("left");
    const title = div(""); title.innerHTML = `<span class="card-title">${b.name}</span>`;
    const meta = div("meta");
    meta.innerHTML = `Bauleiter: ${b.bauleiter || "—"} &nbsp;·&nbsp; <span class="${offen > 0 ? "status-open" : "status-done"}">${offen} offen / ${b.aufgaben.length} gesamt</span>`;
    left.appendChild(title); left.appendChild(meta);
    left.addEventListener("click", () => { ui.expandedBaustelle = expanded ? null : b.id; render(); });
    const right = div("right");
    right.appendChild(btn(expanded ? "▲" : "▼", "btn btn-secondary btn-sm", () => { ui.expandedBaustelle = expanded ? null : b.id; render(); }));
    right.appendChild(btn("✕", "btn btn-danger btn-sm", () => {
      if (confirm(`Baustelle "${b.name}" wirklich löschen?`)) {
        state.baustellen = state.baustellen.filter(x => x.id !== b.id); save(); render();
      }
    }));
    hRow.appendChild(left); hRow.appendChild(right);
    card.appendChild(hRow);

    if (expanded) {
      const exp = div("expanded-content");
      const mlabel = div("meta-label"); mlabel.textContent = "AUFGABEN";
      exp.appendChild(mlabel);
      if (b.aufgaben.length === 0) {
        const empty = div(""); empty.style.cssText = "font-size:13px;color:#aaa;margin-bottom:10px";
        empty.textContent = "Noch keine Aufgaben.";
        exp.appendChild(empty);
      }
      b.aufgaben.forEach(a => {
        const row = div("aufgabe-row");
        const cb = input({ type: "checkbox" }); cb.checked = a.erledigt;
        cb.addEventListener("change", () => { a.erledigt = cb.checked; save(); render(); });
        const lbl = el("span", { class: a.erledigt ? "done" : "" }); lbl.textContent = a.text;
        const del = el("button", { class: "btn-icon", onClick: () => { b.aufgaben = b.aufgaben.filter(x => x.id !== a.id); save(); render(); } });
        del.textContent = "✕";
        row.appendChild(cb); row.appendChild(lbl); row.appendChild(del);
        exp.appendChild(row);
      });
      const addRow = div("add-aufgabe-row");
      const aufgabeInp = input({ type: "text", placeholder: "Neue Aufgabe eingeben..." });
      aufgabeInp.addEventListener("keydown", e => { if (e.key === "Enter") doAdd(); });
      const doAdd = () => {
        const t = aufgabeInp.value.trim(); if (!t) return;
        b.aufgaben.push({ id: uid(), text: t, erledigt: false }); save(); render();
      };
      addRow.appendChild(aufgabeInp);
      addRow.appendChild(btn("+ Aufgabe", "btn btn-primary btn-sm", doAdd));
      exp.appendChild(addRow);
      card.appendChild(exp);
    }
    p.appendChild(card);
  });

  if (state.baustellen.length === 0) {
    const e = div("empty"); e.textContent = "Noch keine Baustellen angelegt."; p.appendChild(e);
  }
}

function renderTagebuch() {
  const p = document.getElementById("panel-1");
  p.innerHTML = "";
  if (state.baustellen.length === 0) {
    const e = div("empty"); e.textContent = "Bitte zuerst eine Baustelle anlegen."; p.appendChild(e); return;
  }
  const hdr = div("section-header");
  const h2 = el("h2"); h2.textContent = "Bautagebuch";
  const addBtn = btn("+ Eintrag", "btn btn-primary btn-sm", () => { ui.showAddTagebuch = !ui.showAddTagebuch; render(); });
  hdr.appendChild(h2); hdr.appendChild(addBtn);
  p.appendChild(hdr);

  if (ui.showAddTagebuch) {
    const card = div("card card-yellow");
    let formBs = state.baustellen[0].id;
    const bsSel = baustellenSelect(formBs, e => { formBs = parseInt(e.target.value); });
    card.appendChild(field("Baustelle", bsSel));
    const datInp = input({ type: "date", value: today() });
    card.appendChild(field("Datum", datInp));
    const metaRow = div("row");
    const wetterSel = el("select");
    WETTER_OPT.forEach(w => { const o = el("option", { value: w }); o.textContent = WETTER_ICONS[w] + " " + w; if (w === "Sonnig") o.selected = true; wetterSel.appendChild(o); });
    const tempInp = input({ type: "number", placeholder: "z.B. 18" });
    const maInp = input({ type: "number", placeholder: "Anz." });
    const wf = field("Wetter", wetterSel); wf.style.flex = "2";
    const tf = field("Temp. (°C)", tempInp); tf.style.flex = "1";
    const maf = field("Mitarb.", maInp); maf.style.flex = "1";
    metaRow.appendChild(wf); metaRow.appendChild(tf); metaRow.appendChild(maf);
    card.appendChild(metaRow);
    const inhaltTA = textarea({ placeholder: "Was wurde heute gemacht? Welche Arbeiten wurden ausgeführt?" });
    card.appendChild(field("Tagesbericht *", inhaltTA));
    const besTA = textarea({ placeholder: "Probleme, Behinderungen, Mängel, Besuche, Abnahmen..." });
    besTA.style.minHeight = "60px";
    card.appendChild(field("Besonderheiten / Vorkommnisse", besTA));
    const row = div("btn-row");
    row.appendChild(btn("Speichern", "btn btn-primary", () => {
      if (!inhaltTA.value.trim()) return;
      state.tagebuch.unshift({ id: uid(), baustelleId: parseInt(bsSel.value), datum: datInp.value, wetter: wetterSel.value, temp: tempInp.value, mitarbeiter: maInp.value, inhalt: inhaltTA.value.trim(), besonderheiten: besTA.value.trim() });
      save(); ui.showAddTagebuch = false; render();
    }));
    row.appendChild(btn("Abbrechen", "btn btn-secondary", () => { ui.showAddTagebuch = false; render(); }));
    card.appendChild(row);
    p.appendChild(card);
  }

  const filterSel = el("select", { class: "filter-select" });
  const allOpt = el("option", { value: "alle" }); allOpt.textContent = "Alle Baustellen";
  filterSel.appendChild(allOpt);
  state.baustellen.forEach(b => {
    const o = el("option", { value: b.id }); o.textContent = b.name;
    if (b.id == ui.filterTagebuch) o.selected = true;
    filterSel.appendChild(o);
  });
  filterSel.addEventListener("change", e => { ui.filterTagebuch = e.target.value; render(); });
  p.appendChild(filterSel);

  const entries = [...state.tagebuch]
    .filter(e => ui.filterTagebuch === "alle" || e.baustelleId == ui.filterTagebuch)
    .sort((a, b) => b.datum.localeCompare(a.datum));

  if (entries.length === 0) { const e = div("empty"); e.textContent = "Noch keine Einträge vorhanden."; p.appendChild(e); }

  entries.forEach(e => {
    const baustelle = state.baustellen.find(b => b.id === e.baustelleId);
    const expanded = ui.expandedTagebuch === e.id;
    const isEditing = ui.editTagebuchId === e.id;
    const card = div("card");

    if (isEditing) {
      const lbl = div("meta-label"); lbl.textContent = "EINTRAG BEARBEITEN"; card.appendChild(lbl);
      const bsSel = baustellenSelect(e.baustelleId, ev => { e.baustelleId = parseInt(ev.target.value); });
      card.appendChild(field("Baustelle", bsSel));
      const datInp = input({ type: "date", value: e.datum });
      card.appendChild(field("Datum", datInp));
      const metaRow = div("row");
      const wetterSel = el("select");
      WETTER_OPT.forEach(w => { const o = el("option", { value: w }); o.textContent = WETTER_ICONS[w] + " " + w; if (w === e.wetter) o.selected = true; wetterSel.appendChild(o); });
      const tempInp = input({ type: "number", value: e.temp || "", placeholder: "°C" });
      const maInp = input({ type: "number", value: e.mitarbeiter || "", placeholder: "Anz." });
      const wf = field("Wetter", wetterSel); wf.style.flex = "2";
      const tf = field("Temp.", tempInp); tf.style.flex = "1";
      const maf = field("MA", maInp); maf.style.flex = "1";
      metaRow.appendChild(wf); metaRow.appendChild(tf); metaRow.appendChild(maf);
      card.appendChild(metaRow);
      const inhaltTA = textarea({ placeholder: "Tagesbericht..." }, e.inhalt);
      card.appendChild(field("Tagesbericht", inhaltTA));
      const besTA = textarea({ placeholder: "Besonderheiten..." }, e.besonderheiten);
      besTA.style.minHeight = "60px";
      card.appendChild(field("Besonderheiten", besTA));
      const row = div("btn-row");
      row.appendChild(btn("Speichern", "btn btn-primary", () => {
        e.baustelleId = parseInt(bsSel.value); e.datum = datInp.value;
        e.wetter = wetterSel.value; e.temp = tempInp.value; e.mitarbeiter = maInp.value;
        e.inhalt = inhaltTA.value.trim(); e.besonderheiten = besTA.value.trim();
        save(); ui.editTagebuchId = null; render();
      }));
      row.appendChild(btn("Abbrechen", "btn btn-secondary", () => { ui.editTagebuchId = null; render(); }));
      card.appendChild(row);
    } else {
      const hRow = div("card-header-row");
      const left = div("left");
      left.addEventListener("click", () => { ui.expandedTagebuch = expanded ? null : e.id; render(); });
      const metaDiv = div("tagebuch-meta");
      const dateSpan = span("tagebuch-date", e.datum);
      const wetterSpan = el("span"); wetterSpan.style.fontSize = "18px"; wetterSpan.textContent = WETTER_ICONS[e.wetter] || "";
      metaDiv.appendChild(dateSpan); metaDiv.appendChild(wetterSpan);
      if (e.temp) { const t = span("tagebuch-temp", e.temp + "°C"); metaDiv.appendChild(t); }
      if (e.mitarbeiter) { const m = span("ma-badge", "👷 " + e.mitarbeiter + " MA"); metaDiv.appendChild(m); }
      left.appendChild(metaDiv);
      const badgeRow = div(""); badgeRow.style.marginBottom = "4px";
      const b = el("span", { class: "badge" }); b.textContent = (baustelle?.name || "?").toUpperCase();
      badgeRow.appendChild(b); left.appendChild(badgeRow);
      if (!expanded) {
        const preview = div("preview"); preview.textContent = e.inhalt; left.appendChild(preview);
      }
      const right = div("right");
      right.appendChild(btn(expanded ? "▲" : "▼", "btn btn-secondary btn-sm", () => { ui.expandedTagebuch = expanded ? null : e.id; render(); }));
      right.appendChild(btn("✏️", "btn btn-secondary btn-sm", () => { ui.editTagebuchId = e.id; ui.expandedTagebuch = null; render(); }));
      right.appendChild(btn("✕", "btn btn-danger btn-sm", () => {
        if (confirm("Eintrag löschen?")) { state.tagebuch = state.tagebuch.filter(x => x.id !== e.id); save(); render(); }
      }));
      hRow.appendChild(left); hRow.appendChild(right);
      card.appendChild(hRow);
      if (expanded) {
        const exp = div("expanded-content");
        const lbl = div("meta-label"); lbl.textContent = "TAGESBERICHT"; exp.appendChild(lbl);
        const txt = div("tagesbericht-text"); txt.textContent = e.inhalt; exp.appendChild(txt);
        if (e.besonderheiten) {
          const warn = div("card-warn");
          const wlbl = div("meta-label"); wlbl.textContent = "BESONDERHEITEN"; wlbl.style.marginBottom = "4px";
          const wtxt = div("tagesbericht-text"); wtxt.textContent = e.besonderheiten;
          warn.appendChild(wlbl); warn.appendChild(wtxt); exp.appendChild(warn);
        }
        card.appendChild(exp);
      }
    }
    p.appendChild(card);
  });
}

function renderEinkaeufe() {
  const p = document.getElementById("panel-2");
  p.innerHTML = "";
  if (state.baustellen.length === 0) {
    const e = div("empty"); e.textContent = "Bitte zuerst eine Baustelle anlegen."; p.appendChild(e); return;
  }
  const hdr = div("section-header");
  const h2 = el("h2"); h2.textContent = "Einkäufe & Lieferanten";
  const addBtn = btn("+ Eintrag", "btn btn-primary btn-sm", () => { ui.showAddEinkauf = !ui.showAddEinkauf; render(); });
  hdr.appendChild(h2); hdr.appendChild(addBtn);
  p.appendChild(hdr);

  if (ui.showAddEinkauf) {
    const card = div("card card-yellow");
    const bsSel = baustellenSelect(state.baustellen[0].id, () => {});
    card.appendChild(field("Baustelle", bsSel));
    const datInp = input({ type: "date", value: today() });
    card.appendChild(field("Datum", datInp));
    const lief = input({ type: "text", placeholder: "z.B. Raab Karcher, Bauhaus..." });
    card.appendChild(field("Lieferant", lief));
    const art = input({ type: "text", placeholder: "z.B. Betonschrauben 12mm" });
    card.appendChild(field("Artikel / Material", art));
    const mr = div("row");
    const mengeInp = input({ type: "text", placeholder: "z.B. 500 Stk." });
    const betragInp = input({ type: "text", placeholder: "z.B. 142,00 €" });
    mr.appendChild(field("Menge", mengeInp)); mr.appendChild(field("Betrag (€)", betragInp));
    card.appendChild(mr);
    const row = div("btn-row");
    row.appendChild(btn("Speichern", "btn btn-primary", () => {
      if (!lief.value.trim() || !art.value.trim()) return;
      state.einkaeufe.unshift({ id: uid(), baustelleId: parseInt(bsSel.value), datum: datInp.value, lieferant: lief.value.trim(), artikel: art.value.trim(), menge: mengeInp.value.trim(), betrag: betragInp.value.trim() });
      save(); ui.showAddEinkauf = false; render();
    }));
    row.appendChild(btn("Abbrechen", "btn btn-secondary", () => { ui.showAddEinkauf = false; render(); }));
    card.appendChild(row);
    p.appendChild(card);
  }

  const filterSel = el("select", { class: "filter-select" });
  const allOpt = el("option", { value: "alle" }); allOpt.textContent = "Alle Baustellen";
  filterSel.appendChild(allOpt);
  state.baustellen.forEach(b => {
    const o = el("option", { value: b.id }); o.textContent = b.name;
    if (b.id == ui.filterEinkauf) o.selected = true;
    filterSel.appendChild(o);
  });
  filterSel.addEventListener("change", e => { ui.filterEinkauf = e.target.value; render(); });
  p.appendChild(filterSel);

  const filtered = state.einkaeufe.filter(e => ui.filterEinkauf === "alle" || e.baustelleId == ui.filterEinkauf);
  if (filtered.length === 0) { const e = div("empty"); e.textContent = "Keine Einträge vorhanden."; p.appendChild(e); }

  filtered.forEach(e => {
    const baustelle = state.baustellen.find(b => b.id === e.baustelleId);
    const card = div("card");
    const hRow = div("card-header-row");
    const left = div("left");
    const title = div(""); title.style.cssText = "font-weight:800;font-size:15px;margin-bottom:4px";
    title.textContent = e.artikel; left.appendChild(title);
    const meta = div("einkauf-meta");
    meta.innerHTML = `<span>📦 ${e.lieferant}</span><span>📅 ${e.datum}</span>${e.menge ? `<span>Menge: ${e.menge}</span>` : ""}${e.betrag ? `<span style="font-weight:700;color:#1c1c1c">${e.betrag}</span>` : ""}`;
    left.appendChild(meta);
    const badgeRow = div(""); badgeRow.style.marginTop = "5px";
    const b = el("span", { class: "badge" }); b.textContent = (baustelle?.name || "?").toUpperCase();
    badgeRow.appendChild(b); left.appendChild(badgeRow);
    const right = div("right");
    const delBtn = el("button", { class: "btn-icon", onClick: () => {
      if (confirm("Eintrag löschen?")) { state.einkaeufe = state.einkaeufe.filter(x => x.id !== e.id); save(); render(); }
    }}); delBtn.textContent = "✕"; delBtn.style.fontSize = "18px";
    right.appendChild(delBtn);
    hRow.appendChild(left); hRow.appendChild(right);
    card.appendChild(hRow);
    p.appendChild(card);
  });
}

render();
