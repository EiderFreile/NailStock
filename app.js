// =====================================================
//  NAIL STOCK — App Logic
// =====================================================

import { db } from "./firebase-config.js";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc,
  onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---- State ----
const state = {
  categories: [],
  products: [],
  cart: [],           // [{ productId, name, brand, colorName, colorCode, color }]
  selectedCat: null,
  limits: { red: 3, amber: 8 },
  filterBrand: "",
  filterColor: "",
};

// ---- Firebase refs ----
const catsRef   = collection(db, "nailstock_categories");
const prodsRef  = collection(db, "nailstock_products");
const configRef = doc(db, "nailstock_config", "limits");
const cartRef   = doc(db, "nailstock_config", "cart");

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
    if (tab === "cart")   renderCart();
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
  if (state.categories.find(c => c.name === name)) { toast("Esa categoría ya existe"); return; }
  try {
    await addDoc(catsRef, { name, createdAt: Date.now() });
    toast("Categoría añadida ✓");
    closeModal("modal-cat");
  } catch(e) { toast("Error al guardar 😕"); console.error(e); }
});

async function deleteCat(id, name) {
  if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
  await deleteDoc(doc(db, "nailstock_categories", id));
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
  el.innerHTML = state.categories.map(c => {
    const safeName = c.name.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    return `
      <div class="cat-pill ${state.selectedCat === c.id ? "active" : ""}" onclick="selectCat('${c.id}')">
        ${c.name}
        <button class="cat-pill-del" data-id="${c.id}" data-name="${safeName}"
          onclick="event.stopPropagation(); deleteCat(this.dataset.id, this.dataset.name)">×</button>
      </div>`;
  }).join("");
}

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
  $("p-qty").value          = product !== null ? product.qty : "";
  $("p-storage").value      = product ? product.storage || "" : "";
  $("p-single").checked     = product ? !!product.singleUse : false;
  $("modal-product-title").textContent = product ? "Editar producto" : "Nuevo producto";
  $("btn-delete-product").style.display = product ? "flex" : "none";

  const catSel = $("p-cat");
  catSel.innerHTML = '<option value="">Sin categoría</option>' +
    state.categories.map(c =>
      `<option value="${c.id}" ${product && product.categoryId === c.id ? "selected" : ""}>${c.name}</option>`
    ).join("");

  openModal("modal-product");
  setTimeout(() => $("p-name").focus(), 150);
}

// Color sync
$("p-color-pick").addEventListener("input", function() { $("p-color-text").value = this.value; });
$("p-color-text").addEventListener("input", function() {
  if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) $("p-color-pick").value = this.value;
});

$("btn-save-product").addEventListener("click", async () => {
  const name = $("p-name").value.trim();
  const qty  = parseInt($("p-qty").value);
  if (!name) { toast("El nombre es obligatorio"); return; }
  if (isNaN(qty) || qty < 0) { toast("La cantidad debe ser ≥ 0"); return; }

  const catId   = $("p-cat").value;
  const catName = catId ? (state.categories.find(c => c.id === catId)?.name || "") : "";

  const data = {
    name,
    brand:      $("p-brand").value.trim(),
    colorName:  $("p-color-name").value.trim(),
    colorCode:  $("p-color-code").value.trim(),
    color:      $("p-color-text").value.trim() || $("p-color-pick").value,
    price:      parseFloat($("p-price").value) || 0,
    qty,
    storage:    $("p-storage").value.trim(),
    singleUse:  $("p-single").checked,
    categoryId: catId,
    categoryName: catName,
    updatedAt:  Date.now(),
  };

  const id = $("p-id").value;
  try {
    if (id) {
      await updateDoc(doc(db, "nailstock_products", id), data);
      toast("Producto actualizado ✓");
    } else {
      data.createdAt = Date.now();
      await addDoc(prodsRef, data);
      toast("Producto añadido ✓");
    }
    closeModal("modal-product");
  } catch(e) { toast("Error al guardar 😕"); console.error(e); }
});

$("btn-delete-product").addEventListener("click", async () => {
  const id = $("p-id").value;
  if (!confirm("¿Eliminar este producto?")) return;
  // Quitar del carrito si estaba
  state.cart = state.cart.filter(i => i.productId !== id);
  await saveCart();
  await deleteDoc(doc(db, "nailstock_products", id));
  closeModal("modal-product");
  toast("Producto eliminado");
});

// ---- FILTERS ----
$("search-input").addEventListener("input", renderProducts);
$("filter-brand").addEventListener("change", function() { state.filterBrand = this.value; renderProducts(); });
$("filter-color").addEventListener("change", function() { state.filterColor = this.value; renderProducts(); });

function updateFilterOptions() {
  const brands = [...new Set(state.products.map(p => p.brand).filter(Boolean))].sort();
  const colors = [...new Set(state.products.map(p => p.colorName).filter(Boolean))].sort();

  const brandSel = $("filter-brand");
  const curBrand = brandSel.value;
  brandSel.innerHTML = '<option value="">Todas las marcas</option>' +
    brands.map(b => `<option value="${b}" ${curBrand===b?"selected":""}>${b}</option>`).join("");

  const colorSel = $("filter-color");
  const curColor = colorSel.value;
  colorSel.innerHTML = '<option value="">Todos los colores</option>' +
    colors.map(c => `<option value="${c}" ${curColor===c?"selected":""}>${c}</option>`).join("");
}

// ---- RENDER PRODUCTS ----
function renderProducts() {
  const search = $("search-input").value.toLowerCase();
  const brand  = $("filter-brand").value;
  const color  = $("filter-color").value;

  let prods = state.products.filter(p => {
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
  await saveLimits();
}
window.changeLimitVal = changeLimitVal;

async function changeQty(productId, delta) {
  const p = state.products.find(p => p.id === productId);
  if (!p) return;
  const newQty = Math.max(0, p.qty + delta);
  try {
    await updateDoc(doc(db, "nailstock_products", productId), { qty: newQty, updatedAt: Date.now() });
  } catch(e) { toast("Error al actualizar 😕"); console.error(e); }
}
window.changeQty = changeQty;

// ---- CART ----
function isInCart(productId) {
  return state.cart.some(i => i.productId === productId);
}

function toggleCart(productId) {
  if (isInCart(productId)) {
    state.cart = state.cart.filter(i => i.productId !== productId);
    toast("Eliminado de la lista");
  } else {
    const p = state.products.find(p => p.id === productId);
    if (!p) return;
    state.cart.push({
      productId: p.id,
      name:      p.name,
      brand:     p.brand || "",
      colorName: p.colorName || "",
      colorCode: p.colorCode || "",
      color:     p.color || "",
    });
    toast("Añadido a la lista de compra 🛒");
  }
  saveCart();
  renderProducts();
  renderSingle();
  updateCartBadge();
}
window.toggleCart = toggleCart;

async function saveCart() {
  try {
    await setDoc(cartRef, { items: state.cart });
  } catch(e) { console.error("Error guardando carrito:", e); }
}

async function loadCart() {
  try {
    const snap = await getDoc(cartRef);
    if (snap.exists()) {
      state.cart = snap.data().items || [];
    }
  } catch(e) { console.error("Error cargando carrito:", e); }
}

function updateCartBadge() {
  const badge = $("cart-badge");
  const count = state.cart.length;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function markBought(productId) {
  state.cart = state.cart.filter(i => i.productId !== productId);
  saveCart();
  renderCart();
  updateCartBadge();
  toast("¡Comprado! ✓");
}
window.markBought = markBought;

function renderCart() {
  const el = $("cart-list");
  if (!state.cart.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><p>La lista está vacía.<br>Pulsa el carrito en cualquier producto para añadirlo.</p></div>`;
    return;
  }
  el.innerHTML = state.cart.map((item, i) => {
    const colorDot = item.color
      ? `<span class="tag-color-dot" style="background:${item.color};width:10px;height:10px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,0.1);flex-shrink:0"></span>`
      : "";
    const subParts = [item.brand, item.colorName, item.colorCode ? `#${item.colorCode}` : ""].filter(Boolean).join(" · ");
    return `
      <div class="product-card" style="animation-delay:${i*0.04}s">
        <div class="card-row">
          <div class="card-main">
            <div class="card-name" style="display:flex;align-items:center;gap:8px">
              ${colorDot}${item.name}
            </div>
            ${subParts ? `<div class="card-sub">${subParts}</div>` : ""}
          </div>
          <button class="btn-bought" data-id="${item.productId}" onclick="markBought(this.dataset.id)" title="Marcar como comprado">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>`;
  }).join("");
}

$("btn-clear-cart").addEventListener("click", async () => {
  if (!state.cart.length) return;
  if (!confirm("¿Vaciar toda la lista de la compra?")) return;
  state.cart = [];
  await saveCart();
  renderCart();
  updateCartBadge();
  toast("Lista vaciada");
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
            <button class="qty-card-btn" data-id="${p.id}" data-delta="-1" onclick="changeQty(this.dataset.id, -1)">−</button>
            <div class="card-qty-block" data-id="${p.id}" onclick="openProductModal(this.dataset.id)" style="cursor:pointer">
              <div class="card-qty">${p.qty}</div>
              <div class="card-qty-label">uds</div>
            </div>
            <button class="qty-card-btn" data-id="${p.id}" data-delta="1" onclick="changeQty(this.dataset.id, 1)">+</button>
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
async function loadLimits() {
  try {
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      const data = snap.data();
      state.limits.red   = data.red   || 3;
      state.limits.amber = data.amber || 8;
    }
  } catch(e) { console.error("Error cargando límites:", e); }
}

async function saveLimits() {
  try {
    await setDoc(configRef, { red: state.limits.red, amber: state.limits.amber });
  } catch(e) { console.error("Error guardando límites:", e); }
}

function initListeners() {
  onSnapshot(query(catsRef, orderBy("createdAt")), snap => {
    state.categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAll();
  }, err => console.error("Cats error:", err));

  onSnapshot(query(prodsRef, orderBy("createdAt")), snap => {
    state.products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateFilterOptions();
    renderAll();
    if (document.querySelector('.tab[data-tab="single"]')?.classList.contains("active")) renderSingle();
    if (document.querySelector('.tab[data-tab="cart"]')?.classList.contains("active"))   renderCart();
  }, err => { console.error("Products error:", err); showFirebaseError(); });
}

function renderAll() {
  renderCats();
  updateFilterOptions();
  renderProducts();
}

function showFirebaseError() {
  $("products-list").innerHTML = `<div class="firebase-error">
    <strong>⚠️ Error de conexión con Firebase</strong>
    Revisa que has configurado correctamente el archivo <code>js/firebase-config.js</code>.
  </div>`;
}

// ---- OFFLINE ----
window.addEventListener("online",  () => document.body.classList.remove("offline"));
window.addEventListener("offline", () => document.body.classList.add("offline"));

// ---- INIT ----
function hideSplash() {
  $("splash").classList.add("fade-out");
  setTimeout(() => {
    $("splash").classList.add("hidden");
    $("app").classList.remove("hidden");
  }, 400);
}

async function init() {
  // Mostramos la app en máximo 2 segundos pase lo que pase
  const splashTimer = setTimeout(hideSplash, 2000);

  try {
    await Promise.all([loadLimits(), loadCart()]);
    updateCartBadge();
    initListeners();
  } catch(e) {
    showFirebaseError();
    console.error(e);
  }

  // Si Firebase respondió antes de 2s, quitamos el splash ya
  clearTimeout(splashTimer);
  hideSplash();
}

window.selectCat        = selectCat;
window.deleteCat        = deleteCat;
window.openProductModal = openProductModal;

init();
