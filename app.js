// =====================================================
//  NAIL STOCK — App Logic (Realtime Database)
// =====================================================

const state = {
  categories: [],
  products: [],
  cart: [],
  selectedCat: null,
  limits: { red: 3, amber: 8 },
  filterBrand: "",
  filterColor: "",
};

const $ = id => document.getElementById(id);
const toast = (msg, duration = 2000) => {
  const el = $("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), duration);
};

// ---- TABS ----
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    $("tab-" + tab).classList.add("active");
    if (tab === "single") renderSingle();
    if (tab === "cart")   renderCart();
  });
});

// ---- MODALS ----
function openModal(id) { $("modal-backdrop").classList.remove("hidden"); $(id).classList.remove("hidden"); }
function closeModal(id) { $("modal-backdrop").classList.add("hidden"); $(id).classList.add("hidden"); }
document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => closeModal(btn.dataset.close)));
$("modal-backdrop").addEventListener("click", () => ["modal-cat", "modal-product"].forEach(id => closeModal(id)));

// ---- CATEGORIES ----
const CAT_ICONS = [
  { id: 'droplet',      svg: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>' },
  { id: 'sparkle',      svg: '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>' },
  { id: 'scissors',     svg: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>' },
  { id: 'star',         svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
  { id: 'heart',        svg: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' },
  { id: 'box',          svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>' },
  { id: 'sun',          svg: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' },
  { id: 'moon',         svg: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' },
  { id: 'gem',          svg: '<polygon points="6 3 18 3 22 9 12 22 2 9"/><polyline points="2 9 12 14 22 9"/><line x1="12" y1="22" x2="12" y2="14"/><line x1="6" y1="3" x2="2" y2="9"/><line x1="18" y1="3" x2="22" y2="9"/>' },
  { id: 'brush',        svg: '<path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.5 2 4 2 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3z"/>' },
  { id: 'tag',          svg: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>' },
  { id: 'grid',         svg: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
  { id: 'tool',         svg: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' },
  { id: 'layers',       svg: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>' },
  { id: 'zap',          svg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
  { id: 'flower',       svg: '<circle cx="12" cy="12" r="3"/><path d="M12 1a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM12 15a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM1 12a4 4 0 0 1 8 0 4 4 0 0 1-8 0zM15 12a4 4 0 0 1 8 0 4 4 0 0 1-8 0z"/>' },
];

const CAT_COLORS = [
  { color: '#C2478A', bg: '#FAE8F2' },
  { color: '#9B59D4', bg: '#F2E8FB' },
  { color: '#5B8DD9', bg: '#E8F0FB' },
  { color: '#3AADAA', bg: '#E4F6F5' },
  { color: '#4DB87A', bg: '#E6F7ED' },
  { color: '#C97B2F', bg: '#FDF0E0' },
  { color: '#D95F5F', bg: '#FBEAEA' },
  { color: '#7B7DD9', bg: '#EEEEFB' },
  { color: '#2E9DC4', bg: '#E2F4FA' },
  { color: '#C4844A', bg: '#FBF0E6' },
  { color: '#A07BC4', bg: '#F3EEF9' },
  { color: '#5BB8A0', bg: '#E6F6F2' },
  { color: '#D97A9B', bg: '#FCEDF4' },
  { color: '#7AADD4', bg: '#EBF4FB' },
  { color: '#C4A84A', bg: '#FAF5E2' },
  { color: '#7BC47B', bg: '#EDF7ED' },
  { color: '#C46A6A', bg: '#FAF0F0' },
  { color: '#6A9EC4', bg: '#EAF2F9' },
  { color: '#B87BB8', bg: '#F7EDF7' },
  { color: '#7AB8B8', bg: '#EBF6F6' },
];

let selectedCatIcon  = CAT_ICONS[0].id;
let selectedCatColor = 0;

function renderIconPicker() {
  $("icon-picker").innerHTML = CAT_ICONS.map(ic => `
    <button class="icon-opt ${selectedCatIcon === ic.id ? 'selected' : ''}"
      onclick="selectIcon('${ic.id}')" type="button" title="${ic.id}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ic.svg}</svg>
    </button>`).join("");
}

function renderColorPicker() {
  $("color-picker").innerHTML = CAT_COLORS.map((c, i) => `
    <button class="color-opt ${selectedCatColor === i ? 'selected' : ''}"
      onclick="selectCatColor(${i})" type="button"
      style="background:${c.color}; ${selectedCatColor === i ? 'box-shadow:0 0 0 2px white,0 0 0 4px '+c.color : ''}">
    </button>`).join("");
}

function selectIcon(id) {
  selectedCatIcon = id;
  renderIconPicker();
}
function selectCatColor(i) {
  selectedCatColor = i;
  renderColorPicker();
}
window.selectIcon     = selectIcon;
window.selectCatColor = selectCatColor;

function openCatModal(cat) {
  $("cat-edit-id").value    = cat ? cat.id : "";
  $("cat-name-input").value = cat ? cat.name : "";
  $("modal-cat-title").textContent = cat ? "Editar categoría" : "Nueva categoría";
  $("btn-delete-cat").style.display = cat ? "flex" : "none";
  selectedCatIcon  = cat?.icon  || CAT_ICONS[0].id;
  selectedCatColor = cat?.colorIdx ?? 0;
  renderIconPicker();
  renderColorPicker();
  openModal("modal-cat");
  setTimeout(() => $("cat-name-input").focus(), 150);
}

$("btn-add-cat").addEventListener("click", () => openCatModal(null));

$("btn-save-cat").addEventListener("click", async () => {
  const name = $("cat-name-input").value.trim();
  if (!name) return;
  const id = $("cat-edit-id").value;
  const data = { name, icon: selectedCatIcon, colorIdx: selectedCatColor };
  try {
    if (id) {
      await catsRef.child(id).update(data);
      toast("Categoría actualizada ✓");
    } else {
      if (state.categories.find(c => c.name === name)) { toast("Esa categoría ya existe"); return; }
      await catsRef.push({ ...data, createdAt: Date.now() });
      toast("Categoría añadida ✓");
    }
    closeModal("modal-cat");
  } catch(e) { toast("Error al guardar 😕"); console.error(e); }
});

$("btn-delete-cat").addEventListener("click", async () => {
  const id   = $("cat-edit-id").value;
  const name = $("cat-name-input").value;
  if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
  await catsRef.child(id).remove();
  toast("Categoría eliminada");
  closeModal("modal-cat");
});

async function deleteCat(id, name) {
  if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
  await catsRef.child(id).remove();
  toast("Categoría eliminada");
}

// ---- SECCIONES POR CATEGORÍA ----
const collapsedSections = new Set();

function getIconSvg(iconId) {
  const ic = CAT_ICONS.find(i => i.id === iconId) || CAT_ICONS[0];
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ic.svg}</svg>`;
}

function getCatStyle(cat, i) {
  const colorIdx = cat.colorIdx ?? (i % CAT_COLORS.length);
  return CAT_COLORS[colorIdx] || CAT_COLORS[0];
}

function toggleSection(catId) {
  if (collapsedSections.has(catId)) collapsedSections.delete(catId);
  else collapsedSections.add(catId);
  renderSections();
}
window.toggleSection = toggleSection;

function renderSections() {
  const search = ($("search-input")?.value || "").toLowerCase();
  const brand  = $("filter-brand")?.value || "";
  const color  = $("filter-color")?.value || "";
  const container = $("sections-container");
  if (!container) return;

  let html = "";

  state.categories.forEach((cat, i) => {
    const palette  = getCatStyle(cat, i);
    const iconSvg  = getIconSvg(cat.icon);
    const prods = state.products.filter(p => {
      if (p.categoryId !== cat.id) return false;
      if (brand && p.brand !== brand) return false;
      if (color && p.colorName !== color) return false;
      if (search && ![p.name, p.brand, p.categoryName, p.colorName, p.colorCode]
          .filter(Boolean).some(v => v.toLowerCase().includes(search))) return false;
      return true;
    });
    if (search && prods.length === 0) return;

    const isCollapsed = collapsedSections.has(cat.id);
    const safeName = cat.name.replace(/'/g, "\\'");
    const prodsHTML = prods.length
      ? prods.map((p, pi) => productCardHTML(p, false, pi)).join("")
      : `<div class="cat-section-empty">Sin productos en esta categoría</div>`;

    html += `
      <div class="cat-section ${isCollapsed ? "collapsed" : ""}">
        <div class="cat-section-header" onclick="toggleSection('${cat.id}')">
          <div class="cat-icon-wrap" style="background:${palette.bg};color:${palette.color}">${iconSvg}</div>
          <span class="cat-section-name">${cat.name}</span>
          <span class="cat-section-count" style="background:${palette.bg};color:${palette.color}">${prods.length}</span>
          <button class="cat-section-edit" data-id="${cat.id}"
            onclick="event.stopPropagation();openCatModalById(this.dataset.id)" title="Editar categoría">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="cat-section-add" data-id="${cat.id}"
            onclick="event.stopPropagation();openProductModalWithCat(this.dataset.id)" title="Añadir producto a esta categoría">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <svg class="cat-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="cat-section-products">${prodsHTML}</div>
      </div>`;
  });

  // Productos sin categoría
  const uncategorized = state.products.filter(p => {
    if (p.categoryId && state.categories.find(c => c.id === p.categoryId)) return false;
    if (brand && p.brand !== brand) return false;
    if (color && p.colorName !== color) return false;
    if (search && ![p.name, p.brand, p.categoryName, p.colorName, p.colorCode]
        .filter(Boolean).some(v => v.toLowerCase().includes(search))) return false;
    return true;
  });
  if (uncategorized.length) {
    const isCollapsed = collapsedSections.has("__uncategorized__");
    html += `
      <div class="cat-section ${isCollapsed ? "collapsed" : ""}">
        <div class="cat-section-header" onclick="toggleSection('__uncategorized__')">
          <div class="cat-icon-wrap" style="background:var(--gray-100);color:var(--gray-400)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <span class="cat-section-name" style="color:var(--gray-400)">Sin categoría</span>
          <span class="cat-section-count" style="background:var(--gray-100);color:var(--gray-400)">${uncategorized.length}</span>
          <svg class="cat-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="cat-section-products">${uncategorized.map((p,pi) => productCardHTML(p,false,pi)).join("")}</div>
      </div>`;
  }

  if (!html) {
    html = search || brand || color
      ? `<div class="empty-state"><div class="empty-icon">🔍</div><p>Sin resultados.<br>Prueba con otros filtros.</p></div>`
      : `<div class="empty-state"><div class="empty-icon">✨</div><p>Añade tu primera categoría<br>para empezar.</p></div>`;
  }
  container.innerHTML = html;
}

function openCatModalById(id) {
  const cat = state.categories.find(c => c.id === id);
  if (cat) openCatModal(cat);
}
window.openCatModalById = openCatModalById;
window.openCatModal     = openCatModal;

// ---- PRODUCTS ----
$("btn-add-product").addEventListener("click", () => openProductModal(null));

function openProductModal(productId) {
  const product = productId ? state.products.find(p => p.id === productId) : null;
  $("p-id").value           = product ? product.id : "";
  $("p-name").value         = product ? product.name : "";
  $("p-brand").value        = product ? product.brand || "" : "";
  $("p-color-name").value   = product ? product.colorName || "" : "";
  $("p-color-code").value   = product ? product.colorCode || "" : "";
  $("p-color-text").value   = product ? product.color || "" : "";
  $("p-color-pick").value   = product && product.color && product.color.startsWith("#") ? product.color : "#D4537E";
  $("p-price").value        = product ? product.price || "" : "";
  $("p-pack-size").value    = product ? product.packSize || 1 : 1;
  $("p-qty").value          = product !== null ? product.qty : "";
  $("p-storage").value      = product ? product.storage || "" : "";
  $("p-single").checked     = product ? !!product.singleUse : false;

  // Toggle color: activo si el producto tiene algún dato de color, o si es nuevo
  const hasColor = product ? (!!product.colorName || !!product.colorCode || !!product.color) : true;
  $("p-has-color").checked = hasColor;
  $("color-fields").style.display = hasColor ? "block" : "none";

  $("modal-product-title").textContent = product ? "Editar producto" : "Nuevo producto";
  $("btn-delete-product").style.display = product ? "flex" : "none";
  $("p-cat").innerHTML = '<option value="">Sin categoría</option>' +
    state.categories.map(c =>
      `<option value="${c.id}" ${product && product.categoryId === c.id ? "selected" : ""}>${c.name}</option>`
    ).join("");
  openModal("modal-product");
  setTimeout(() => $("p-name").focus(), 150);
}

function openProductModalWithCat(catId) {
  openProductModal(null);
  // Pre-selecciona la categoría en el select
  const sel = $("p-cat");
  if (sel) sel.value = catId;
}
window.openProductModalWithCat = openProductModalWithCat;

$("p-color-pick").addEventListener("input", function() { $("p-color-text").value = this.value; });
$("p-color-text").addEventListener("input", function() {
  if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) $("p-color-pick").value = this.value;
});
$("p-has-color").addEventListener("change", function() {
  $("color-fields").style.display = this.checked ? "block" : "none";
});

$("btn-save-product").addEventListener("click", async () => {
  const name = $("p-name").value.trim();
  const qty  = parseInt($("p-qty").value);
  if (!name) { toast("El nombre es obligatorio"); return; }
  if (isNaN(qty) || qty < 0) { toast("La cantidad debe ser ≥ 0"); return; }
  const catId   = $("p-cat").value;
  const catName = catId ? (state.categories.find(c => c.id === catId)?.name || "") : "";
  const hasColor = $("p-has-color").checked;
  const data = {
    name,
    brand:        $("p-brand").value.trim(),
    colorName:    hasColor ? $("p-color-name").value.trim() : "",
    colorCode:    hasColor ? $("p-color-code").value.trim() : "",
    color:        hasColor ? ($("p-color-text").value.trim() || $("p-color-pick").value) : "",
    price:        parseFloat($("p-price").value) || 0,
    packSize:     parseInt($("p-pack-size").value) || 1,
    qty,
    storage:      $("p-storage").value.trim(),
    singleUse:    $("p-single").checked,
    categoryId:   catId,
    categoryName: catName,
    updatedAt:    Date.now(),
  };
  const id = $("p-id").value;
  try {
    if (id) {
      await prodsRef.child(id).update(data);
      toast("Producto actualizado ✓");
    } else {
      data.createdAt = Date.now();
      await prodsRef.push(data);
      toast("Producto añadido ✓");
    }
    closeModal("modal-product");
  } catch(e) { toast("Error al guardar 😕"); console.error(e); }
});

$("btn-delete-product").addEventListener("click", async () => {
  const id = $("p-id").value;
  if (!confirm("¿Eliminar este producto?")) return;
  state.cart = state.cart.filter(i => i.productId !== id);
  await saveCart();
  await prodsRef.child(id).remove();
  closeModal("modal-product");
  toast("Producto eliminado");
});

// ---- FILTERS ----
$("search-input").addEventListener("input", renderSections);
$("filter-brand").addEventListener("change", function() { state.filterBrand = this.value; renderSections(); });
$("filter-color").addEventListener("change", function() { state.filterColor = this.value; renderSections(); });

function updateFilterOptions() {
  const brands = [...new Set(state.products.map(p => p.brand).filter(Boolean))].sort();
  const colors = [...new Set(state.products.map(p => p.colorName).filter(Boolean))].sort();
  const brandSel = $("filter-brand"), curBrand = brandSel.value;
  brandSel.innerHTML = '<option value="">Todas las marcas</option>' +
    brands.map(b => `<option value="${b}" ${curBrand===b?"selected":""}>${b}</option>`).join("");
  const colorSel = $("filter-color"), curColor = colorSel.value;
  colorSel.innerHTML = '<option value="">Todos los colores</option>' +
    colors.map(c => `<option value="${c}" ${curColor===c?"selected":""}>${c}</option>`).join("");
}

// ---- RENDER PRODUCTS ----
function renderProducts() {
  const search = $("search-input").value.toLowerCase();
  const brand  = $("filter-brand").value;
  const color  = $("filter-color").value;
  const prods  = state.products.filter(p => {
    if (state.selectedCat && p.categoryId !== state.selectedCat) return false;
    if (brand && p.brand !== brand) return false;
    if (color && p.colorName !== color) return false;
    if (search && ![p.name, p.brand, p.categoryName, p.colorName, p.colorCode]
        .filter(Boolean).some(v => v.toLowerCase().includes(search))) return false;
    return true;
  });
  const el = $("products-list");
  if (!prods.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Sin resultados.<br>Prueba con otros filtros.</p></div>`;
    return;
  }
  el.innerHTML = prods.map((p, i) => productCardHTML(p, false, i)).join("");
}

// ---- SINGLE USE TAB ----
function renderSingle() {
  $("limit-red-val").textContent   = state.limits.red;
  $("limit-amber-val").textContent = state.limits.amber;
  const prods = state.products.filter(p => p.singleUse).sort((a, b) => a.qty - b.qty);
  const el = $("single-list");
  if (!prods.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚡</div><p>No hay productos de un solo uso.<br>Márcalos al crear o editar un producto.</p></div>`;
    return;
  }
  el.innerHTML = prods.map((p, i) => productCardHTML(p, true, i)).join("");
}

async function changeLimitVal(type, delta) {
  state.limits[type] = Math.max(1, state.limits[type] + delta);
  renderSingle();
  try { await configRef.child("limits").set({ red: state.limits.red, amber: state.limits.amber }); } catch(e) {}
}
window.changeLimitVal = changeLimitVal;

// ---- QTY ----
async function changeQty(productId, delta) {
  const p = state.products.find(p => p.id === productId);
  if (!p) return;
  try { await prodsRef.child(productId).update({ qty: Math.max(0, p.qty + delta), updatedAt: Date.now() }); }
  catch(e) { toast("Error al actualizar 😕"); console.error(e); }
}
window.changeQty = changeQty;

// ---- CART ----
function isInCart(productId) { return state.cart.some(i => i.productId === productId); }

function toggleCart(productId) {
  if (isInCart(productId)) {
    state.cart = state.cart.filter(i => i.productId !== productId);
    toast("Eliminado de la lista");
  } else {
    const p = state.products.find(p => p.id === productId);
    if (!p) return;
    state.cart.push({ productId: p.id, name: p.name, brand: p.brand||"", colorName: p.colorName||"", colorCode: p.colorCode||"", color: p.color||"", price: p.price||0, packSize: p.packSize||1 });
    toast("Añadido a la lista de compra 🛒");
  }
  saveCart(); renderProducts(); renderSingle(); updateCartBadge();
}
window.toggleCart = toggleCart;

async function saveCart() {
  try { await cartRef.set({ items: state.cart }); } catch(e) { console.error("Error guardando carrito:", e); }
}

function updateCartBadge() {
  const badge = $("cart-badge"), count = state.cart.length;
  badge.textContent = count;
  count > 0 ? badge.classList.remove("hidden") : badge.classList.add("hidden");
}

function markBought(productId) {
  state.cart = state.cart.filter(i => i.productId !== productId);
  saveCart(); renderCart(); updateCartBadge(); toast("¡Comprado! ✓");
}
window.markBought = markBought;

function renderCart() {
  const el = $("cart-list");
  if (!state.cart.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><p>La lista está vacía.<br>Pulsa el carrito en cualquier producto para añadirlo.</p></div>`;
    return;
  }

  const total = state.cart.reduce((sum, item) => sum + (item.price || 0), 0);

  el.innerHTML = `
    <div class="cart-total">
      <span class="cart-total-label">Total estimado</span>
      <span class="cart-total-amount">${total.toFixed(2)} €</span>
    </div>` +
  state.cart.map((item, i) => {
    const colorDot = item.color
      ? `<span class="tag-color-dot" style="background:${item.color};width:10px;height:10px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,0.1);flex-shrink:0"></span>`
      : "";
    const subParts = [item.brand, item.colorName, item.colorCode ? `#${item.colorCode}` : ""].filter(Boolean).join(" · ");
    const priceLabel = item.price ? `${item.price.toFixed(2)} €${item.packSize > 1 ? ` / ${item.packSize} uds` : ""}` : "";
    return `
      <div class="product-card" style="animation-delay:${i*0.04}s">
        <div class="card-row">
          <div class="card-main">
            <div class="card-name" style="display:flex;align-items:center;gap:8px">${colorDot}${item.name}</div>
            ${subParts ? `<div class="card-sub">${subParts}</div>` : ""}
            ${priceLabel ? `<div class="card-sub" style="color:var(--pink);font-weight:500;margin-top:2px">💰 ${priceLabel}</div>` : ""}
          </div>
          <button class="btn-bought" data-id="${item.productId}" onclick="markBought(this.dataset.id)" title="Marcar como comprado">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>`;
  }).join("");
}

$("btn-clear-cart").addEventListener("click", async () => {
  if (!state.cart.length || !confirm("¿Vaciar toda la lista de la compra?")) return;
  state.cart = []; await saveCart(); renderCart(); updateCartBadge(); toast("Lista vaciada");
});

// ---- CARD HTML ----
function productCardHTML(p, isSingle, idx) {
  let statusClass = "";
  if (isSingle) {
    if (p.qty <= state.limits.red)        statusClass = "status-alert";
    else if (p.qty <= state.limits.amber) statusClass = "status-warn";
    else                                  statusClass = "status-ok";
  }
  const subParts = [p.brand, p.categoryName].filter(Boolean).join(" · ");
  const tags = [];
  if (p.color || p.colorName) {
    const dot = p.color ? `<span class="tag-color-dot" style="background:${p.color}"></span>` : "";
    const label = [p.colorName, p.colorCode ? `#${p.colorCode}` : ""].filter(Boolean).join(" ");
    tags.push(`<span class="tag">${dot} ${label || "Color"}</span>`);
  }
  if (p.price) tags.push(`<span class="tag">💰 ${Number(p.price).toFixed(2)} €/ud</span>`);
  if (p.storage) tags.push(`<span class="tag">📍 ${p.storage}</span>`);
  if (p.singleUse && !isSingle) tags.push(`<span class="tag tag-single-use">Un solo uso</span>`);
  const inCart    = isInCart(p.id);
  const cartTitle = inCart ? "Quitar de la lista" : "Añadir a la lista de compra";
  const cartStyle = inCart ? "color:var(--pink); background:var(--pink-light);" : "";
  return `
    <div class="product-card ${statusClass}" style="animation-delay:${idx*0.04}s">
      <div class="card-row">
        <div class="card-main" data-id="${p.id}" onclick="openProductModal(this.dataset.id)" style="cursor:pointer;flex:1;min-width:0">
          <div class="card-name">${p.name}</div>
          ${subParts ? `<div class="card-sub">${subParts}</div>` : ""}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <div class="card-qty-controls">
            <button class="qty-card-btn" data-id="${p.id}" onclick="changeQty(this.dataset.id, -1)">−</button>
            <div class="card-qty-block" data-id="${p.id}" onclick="openProductModal(this.dataset.id)" style="cursor:pointer">
              <div class="card-qty">${p.qty}</div>
              <div class="card-qty-label">uds</div>
            </div>
            <button class="qty-card-btn" data-id="${p.id}" onclick="changeQty(this.dataset.id, 1)">+</button>
          </div>
          <button class="btn-cart" data-id="${p.id}" onclick="toggleCart(this.dataset.id)" title="${cartTitle}" style="${cartStyle}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </button>
        </div>
      </div>
      ${tags.length ? `<div class="card-tags">${tags.join("")}</div>` : ""}
    </div>`;
}

// ---- FIREBASE LISTENERS ----
function initListeners() {
  catsRef.on("value", snap => {
    const val = snap.val() || {};
    state.categories = Object.entries(val).map(([id, d]) => ({ id, ...d })).sort((a, b) => a.createdAt - b.createdAt);
    updateFilterOptions(); renderSections();
  }, err => console.error("Cats error:", err));

  prodsRef.on("value", snap => {
    const val = snap.val() || {};
    state.products = Object.entries(val).map(([id, d]) => ({ id, ...d })).sort((a, b) => a.createdAt - b.createdAt);
    updateFilterOptions(); renderSections();
    if (document.querySelector('.tab[data-tab="single"]')?.classList.contains("active")) renderSingle();
    if (document.querySelector('.tab[data-tab="cart"]')?.classList.contains("active"))   renderCart();
  }, err => {
    console.error("Products error:", err);
    const c = $("sections-container");
    if (c) c.innerHTML = `<div class="firebase-error"><strong>⚠️ Error de conexión con Firebase</strong><br>Comprueba tu conexión a internet.</div>`;
  });
}

// ---- OFFLINE ----
window.addEventListener("online",  () => document.body.classList.remove("offline"));
window.addEventListener("offline", () => document.body.classList.add("offline"));

// ---- GLOBALS ----
window.deleteCat        = deleteCat;
window.openProductModal = openProductModal;
window.toggleSection    = toggleSection;

// ---- INIT ----
function hideSplash() {
  $("splash").classList.add("fade-out");
  setTimeout(() => { $("splash").classList.add("hidden"); $("app").classList.remove("hidden"); }, 400);
}

async function init() {
  const splashTimer = setTimeout(hideSplash, 2000);
  try {
    const [limSnap, cartSnap] = await Promise.all([
      configRef.child("limits").get(),
      cartRef.get()
    ]);
    if (limSnap.exists()) { const d = limSnap.val(); state.limits.red = d.red||3; state.limits.amber = d.amber||8; }
    if (cartSnap.exists() && cartSnap.val()?.items) { state.cart = cartSnap.val().items; }
    updateCartBadge();
    initListeners();
  } catch(e) { console.error(e); }
  clearTimeout(splashTimer);
  hideSplash();
}

init();
