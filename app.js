// =====================================================
//  NAIL STOCK — App Logic
// =====================================================

import { db } from "./firebase-config.js";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---- State ----
const state = {
  categories: [],
  products: [],
  selectedCat: null,
  limits: { red: 3, amber: 8 },
  filterBrand: "",
  filterStorage: "",
};

// ---- Firebase refs ----
const catsRef  = collection(db, "categories");
const prodsRef = collection(db, "products");

// ---- DOM helpers ----
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
  });
});

// ---- MODALS ----
function openModal(id) {
  $("modal-backdrop").classList.remove("hidden");
  $(id).classList.remove("hidden");
}
function closeModal(id) {
  $("modal-backdrop").classList.add("hidden");
  $(id).classList.add("hidden");
}

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});
$("modal-backdrop").addEventListener("click", () => {
  ["modal-cat", "modal-product"].forEach(id => closeModal(id));
});

// ---- CATEGORIES ----
$("btn-add-cat").addEventListener("click", () => {
  $("cat-name-input").value = "";
  openModal("modal-cat");
  setTimeout(() => $("cat-name-input").focus(), 150);
});

$("btn-save-cat").addEventListener("click", async () => {
  const name = $("cat-name-input").value.trim();
  if (!name) return;
  if (state.categories.find(c => c.name === name)) {
    toast("Esa categoría ya existe"); return;
  }
  try {
    await addDoc(catsRef, { name, createdAt: Date.now() });
    toast("Categoría añadida ✓");
    closeModal("modal-cat");
  } catch (e) {
    toast("Error al guardar 😕");
    console.error(e);
  }
});

async function deleteCat(id, name) {
  if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
  await deleteDoc(doc(db, "categories", id));
  if (state.selectedCat === id) state.selectedCat = null;
  toast("Categoría eliminada");
  renderAll();
}

function selectCat(id) {
  state.selectedCat = state.selectedCat === id ? null : id;
  renderCats();
  renderProducts();
}

function renderCats() {
  const el = $("cats-list");
  if (!state.categories.length) {
    el.innerHTML = '<span style="font-size:13px;color:var(--gray-400)">Sin categorías todavía</span>';
    return;
  }
  el.innerHTML = state.categories.map(c => `
    <div class="cat-pill ${state.selectedCat === c.id ? "active" : ""}" onclick="selectCat('${c.id}')">
      ${c.name}
      <button class="cat-pill-del" onclick="event.stopPropagation(); deleteCat('${c.id}','${c.name.replace(/'/g,"\\'")}')">×</button>
    </div>
  `).join("");
}

// ---- PRODUCTS ----
$("btn-add-product").addEventListener("click", () => openProductModal(null));

function openProductModal(product) {
  // Reset form
  $("p-id").value = product ? product.id : "";
  $("p-name").value = product ? product.name : "";
  $("p-brand").value = product ? product.brand || "" : "";
  $("p-color-text").value = product ? product.color || "" : "";
  $("p-color-pick").value = product && product.color && product.color.startsWith("#") ? product.color : "#D4537E";
  $("p-price").value = product ? product.price || "" : "";
  $("p-qty").value = product ? product.qty : "";
  $("p-storage").value = product ? product.storage || "" : "";
  $("p-single").checked = product ? !!product.singleUse : false;
  $("modal-product-title").textContent = product ? "Editar producto" : "Nuevo producto";
  $("btn-delete-product").style.display = product ? "flex" : "none";

  // Populate categories
  const catSel = $("p-cat");
  catSel.innerHTML = '<option value="">Sin categoría</option>' +
    state.categories.map(c =>
      `<option value="${c.id}" ${product && product.categoryId === c.id ? "selected" : ""}>${c.name}</option>`
    ).join("");

  openModal("modal-product");
  setTimeout(() => $("p-name").focus(), 150);
}

// Color sync
$("p-color-pick").addEventListener("input", function() {
  $("p-color-text").value = this.value;
});
$("p-color-text").addEventListener("input", function() {
  if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) $("p-color-pick").value = this.value;
});

$("btn-save-product").addEventListener("click", async () => {
  const name = $("p-name").value.trim();
  const qty  = parseInt($("p-qty").value);
  if (!name) { toast("El nombre es obligatorio"); return; }
  if (isNaN(qty) || qty < 0) { toast("La cantidad debe ser ≥ 0"); return; }

  const catId = $("p-cat").value;
  const catName = catId ? (state.categories.find(c => c.id === catId)?.name || "") : "";

  const data = {
    name,
    brand: $("p-brand").value.trim(),
    color: $("p-color-text").value.trim() || $("p-color-pick").value,
    price: parseFloat($("p-price").value) || 0,
    qty,
    storage: $("p-storage").value.trim(),
    singleUse: $("p-single").checked,
    categoryId: catId,
    categoryName: catName,
    updatedAt: Date.now(),
  };

  const id = $("p-id").value;
  try {
    if (id) {
      await updateDoc(doc(db, "products", id), data);
      toast("Producto actualizado ✓");
    } else {
      data.createdAt = Date.now();
      await addDoc(prodsRef, data);
      toast("Producto añadido ✓");
    }
    closeModal("modal-product");
  } catch (e) {
    toast("Error al guardar 😕");
    console.error(e);
  }
});

$("btn-delete-product").addEventListener("click", async () => {
  const id = $("p-id").value;
  if (!confirm("¿Eliminar este producto?")) return;
  await deleteDoc(doc(db, "products", id));
  closeModal("modal-product");
  toast("Producto eliminado");
});

// ---- FILTERS ----
$("search-input").addEventListener("input", renderProducts);
$("filter-brand").addEventListener("change", function() { state.filterBrand = this.value; renderProducts(); });
$("filter-storage").addEventListener("change", function() { state.filterStorage = this.value; renderProducts(); });

function updateFilterOptions() {
  const brands   = [...new Set(state.products.map(p => p.brand).filter(Boolean))].sort();
  const storages = [...new Set(state.products.map(p => p.storage).filter(Boolean))].sort();

  const brandSel = $("filter-brand");
  const curBrand = brandSel.value;
  brandSel.innerHTML = '<option value="">Todas las marcas</option>' +
    brands.map(b => `<option value="${b}" ${curBrand===b?"selected":""}>${b}</option>`).join("");

  const storageSel = $("filter-storage");
  const curStorage = storageSel.value;
  storageSel.innerHTML = '<option value="">Todas las ubicaciones</option>' +
    storages.map(s => `<option value="${s}" ${curStorage===s?"selected":""}>${s}</option>`).join("");
}

// ---- RENDER PRODUCTS ----
function renderProducts() {
  const search  = $("search-input").value.toLowerCase();
  const brand   = $("filter-brand").value;
  const storage = $("filter-storage").value;

  let prods = state.products.filter(p => {
    if (state.selectedCat && p.categoryId !== state.selectedCat) return false;
    if (brand   && p.brand   !== brand)   return false;
    if (storage && p.storage !== storage) return false;
    if (search && ![p.name, p.brand, p.categoryName, p.storage]
        .filter(Boolean).some(v => v.toLowerCase().includes(search))) return false;
    return true;
  });

  const el = $("products-list");
  if (!prods.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>Sin resultados.<br>Prueba con otros filtros.</p>
    </div>`;
    return;
  }
  el.innerHTML = prods.map((p, i) => productCardHTML(p, false, i)).join("");
}

// ---- SINGLE USE TAB ----
function renderSingle() {
  const red   = state.limits.red;
  const amber = state.limits.amber;
  $("limit-red-val").textContent   = red;
  $("limit-amber-val").textContent = amber;

  const prods = state.products
    .filter(p => p.singleUse)
    .sort((a, b) => a.qty - b.qty);

  const el = $("single-list");
  if (!prods.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⚡</div>
      <p>No hay productos de un solo uso.<br>Márcalos al crear o editar un producto.</p>
    </div>`;
    return;
  }
  el.innerHTML = prods.map((p, i) => productCardHTML(p, true, i)).join("");
}

function changeLimitVal(type, delta) {
  state.limits[type] = Math.max(1, state.limits[type] + delta);
  renderSingle();
}
window.changeLimitVal = changeLimitVal;

// ---- CARD HTML ----
function productCardHTML(p, isSingle, idx) {
  let statusClass = "";
  if (isSingle) {
    const red   = state.limits.red;
    const amber = state.limits.amber;
    if (p.qty <= red)   statusClass = "status-alert";
    else if (p.qty <= amber) statusClass = "status-warn";
    else                statusClass = "status-ok";
  }

  const catLabel = p.categoryName ? `${p.categoryName}` : "";
  const subParts = [p.brand, catLabel].filter(Boolean).join(" · ");

  const tags = [];
  if (p.color) {
    tags.push(`<span class="tag"><span class="tag-color-dot" style="background:${p.color}"></span> Color</span>`);
  }
  if (p.price) {
    tags.push(`<span class="tag">💰 ${Number(p.price).toFixed(2)} €/ud</span>`);
  }
  if (p.storage) {
    tags.push(`<span class="tag">📍 ${p.storage}</span>`);
  }
  if (p.singleUse && !isSingle) {
    tags.push(`<span class="tag tag-single-use">Un solo uso</span>`);
  }

  return `
    <div class="product-card ${statusClass}" onclick='openProductModal(${JSON.stringify(p)})' style="animation-delay:${idx * 0.04}s">
      <div class="card-row">
        <div class="card-main">
          <div class="card-name">${p.name}</div>
          ${subParts ? `<div class="card-sub">${subParts}</div>` : ""}
        </div>
        <div class="card-qty-block">
          <div class="card-qty">${p.qty}</div>
          <div class="card-qty-label">uds</div>
        </div>
      </div>
      ${tags.length ? `<div class="card-tags">${tags.join("")}</div>` : ""}
    </div>`;
}

// ---- FIREBASE REALTIME LISTENERS ----
function initListeners() {
  // Categories
  onSnapshot(query(catsRef, orderBy("createdAt")), snap => {
    state.categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCats();
    renderAll();
  }, err => console.error("Cats error:", err));

  // Products
  onSnapshot(query(prodsRef, orderBy("createdAt")), snap => {
    state.products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateFilterOptions();
    renderAll();
    // Also refresh single tab if active
    if (document.querySelector('.tab[data-tab="single"]')?.classList.contains("active")) {
      renderSingle();
    }
  }, err => {
    console.error("Products error:", err);
    showFirebaseError();
  });
}

function renderAll() {
  renderCats();
  updateFilterOptions();
  renderProducts();
}

function showFirebaseError() {
  $("products-list").innerHTML = `<div class="firebase-error">
    <strong>⚠️ Error de conexión con Firebase</strong>
    Revisa que has configurado correctamente el archivo <code>js/firebase-config.js</code> con tus credenciales.
  </div>`;
}

// ---- OFFLINE DETECTION ----
window.addEventListener("online",  () => document.body.classList.remove("offline"));
window.addEventListener("offline", () => document.body.classList.add("offline"));

// ---- INIT ----
function init() {
  try {
    initListeners();
  } catch(e) {
    showFirebaseError();
    console.error(e);
  }

  // Hide splash
  setTimeout(() => {
    $("splash").classList.add("fade-out");
    setTimeout(() => {
      $("splash").classList.add("hidden");
      $("app").classList.remove("hidden");
    }, 400);
  }, 1200);
}

// Expose globals needed by inline onclick handlers
window.selectCat        = selectCat;
window.deleteCat        = deleteCat;
window.openProductModal = openProductModal;

init();
