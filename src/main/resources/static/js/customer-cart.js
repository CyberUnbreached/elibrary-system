// customer-cart.js
// --------------------------------------------------
// E-Library - Customer Cart Page Logic
// --------------------------------------------------

const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// --------------------------------------------------
// Auth Guard
// --------------------------------------------------
if (!user || user.role !== "CUSTOMER") {
  alert("You must be logged in as a customer to view your cart.");
  window.location.href = "login.html";
}

// --------------------------------------------------
// Navigation (if available)
// --------------------------------------------------
if (typeof renderNav === "function") {
  renderNav();
}

// --------------------------------------------------
// State & Utility
// --------------------------------------------------
let state = {
  items: [],
  subtotal: 0,
  appliedDiscount: null, // { code: string, percent: number } or null
};

const dom = {
  cartBody: null,
  subtotal: null,
  tax: null,
  total: null,
  discountInput: null,
  discountMessage: null,
  applyDiscountBtn: null,
  checkoutBtn: null,
};

function formatMoney(n) {
  return (Math.round((n ?? 0) * 100) / 100).toFixed(2);
}

// --------------------------------------------------
// Cart Loading & Rendering
// --------------------------------------------------
async function loadCart() {
  if (!dom.cartBody) return;

  dom.cartBody.innerHTML =
    `<tr><td colspan="6" class="text-center text-muted">Loading...</td></tr>`;

  try {
    const res = await fetch(`${apiBase}/cart/${user.id}`);
    const text = await res.text();

    if (!res.ok) {
      console.error("Load cart failed:", text);
      dom.cartBody.innerHTML =
        `<tr><td colspan="6" class="text-center text-danger">Failed to load cart.</td></tr>`;
      state.items = [];
      state.subtotal = 0;
      updateTotals();
      return;
    }

    let cart;
    try {
      cart = JSON.parse(text);
    } catch (e) {
      console.error("Cart response not JSON:", text);
      dom.cartBody.innerHTML =
        `<tr><td colspan="6" class="text-center text-danger">Failed to parse cart.</td></tr>`;
      state.items = [];
      state.subtotal = 0;
      updateTotals();
      return;
    }

    const items = (cart && cart.items) ? cart.items : [];
    state.items = items;

    dom.cartBody.innerHTML = "";

    if (!items.length) {
      dom.cartBody.innerHTML =
        `<tr><td colspan="6" class="text-center text-muted">Your cart is empty.</td></tr>`;
      state.subtotal = 0;
      updateTotals();
      return;
    }

    let subtotal = 0;

    items.forEach((it) => {
      const qty = it.quantity || 1;
      const unit = it.price || 0;
      const line = qty * unit;
      subtotal += line;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${it.book ? it.book.title : "Unknown"}</td>
        <td>${it.book ? it.book.author : "-"}</td>
        <td class="text-center">${qty}</td>
        <td class="text-right">$${formatMoney(unit)}</td>
        <td class="text-right">$${formatMoney(line)}</td>
        <td class="text-center">
          <button class="btn btn-xs btn-danger" data-remove-id="${it.id}">
            <span class="glyphicon glyphicon-trash"></span> Remove
          </button>
        </td>
      `;

      dom.cartBody.appendChild(tr);
    });

    state.subtotal = subtotal;
    bindRemoveButtons();
    updateTotals();
  } catch (err) {
    console.error("Error loading cart:", err);
    dom.cartBody.innerHTML =
      `<tr><td colspan="6" class="text-center text-danger">Failed to load cart.</td></tr>`;
    state.items = [];
    state.subtotal = 0;
    updateTotals();
  }
}

function bindRemoveButtons() {
  dom.cartBody
    .querySelectorAll("[data-remove-id]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-remove-id");
        removeItem(id);
      });
    });
}

// --------------------------------------------------
// Totals Calculation
// --------------------------------------------------
function updateTotals() {
  const subtotal = state.subtotal || 0;
  let working = subtotal;
  let discountPercent = 0;

  if (state.appliedDiscount && typeof state.appliedDiscount.percent === "number") {
    // Clamp discount between 0 and 100
    discountPercent = Math.max(
      0,
      Math.min(100, state.appliedDiscount.percent)
    );
    working = working * (1 - discountPercent / 100);
  }

  const tax = working * 0.0825;
  const total = working + tax;

  if (dom.subtotal) dom.subtotal.textContent = formatMoney(subtotal);
  if (dom.tax) dom.tax.textContent = formatMoney(tax);
  if (dom.total) dom.total.textContent = formatMoney(total);
}

// --------------------------------------------------
// Remove Cart Item
// --------------------------------------------------
async function removeItem(cartItemId) {
  try {
    const res = await fetch(
      `${apiBase}/cart/${user.id}/remove/${encodeURIComponent(cartItemId)}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const text = await res.text();
      if (typeof showAlert === "function") {
        showAlert("danger", `Failed to remove item: ${text}`);
      } else {
        alert(`Failed to remove item: ${text}`);
      }
      return;
    }

    if (typeof showAlert === "function") {
      showAlert("success", "Item removed from cart.");
    }
    await loadCart();
  } catch (err) {
    console.error("Error removing item:", err);
    if (typeof showAlert === "function") {
      showAlert("danger", "Network error while removing item.");
    } else {
      alert("Network error while removing item.");
    }
  }
}

// --------------------------------------------------
// Discount Handling
// --------------------------------------------------
async function applyDiscount() {
  const codeRaw = (dom.discountInput.value || "").trim();
  const msgEl = dom.discountMessage;

  if (!codeRaw) {
    // Clear discount
    state.appliedDiscount = null;
    if (msgEl) msgEl.style.display = "none";
    updateTotals();
    return;
  }

  const code = codeRaw.toUpperCase();

  try {
    const res = await fetch(`${apiBase}/discounts`);
    if (!res.ok) {
      console.error("Failed to load discounts:", await res.text());
      if (msgEl) {
        msgEl.textContent = "Could not validate discount code.";
        msgEl.classList.remove("text-success");
        msgEl.classList.add("text-danger");
        msgEl.style.display = "";
      }
      return;
    }

    const discounts = await res.json();

    // Find active discount code (case-insensitive)
    const match = discounts.find(
      (d) => d.active && d.code && d.code.toUpperCase() === code
    );

    if (!match) {
      state.appliedDiscount = null;
      if (msgEl) {
        msgEl.textContent = "Invalid or inactive discount code.";
        msgEl.classList.remove("text-success");
        msgEl.classList.add("text-danger");
        msgEl.style.display = "";
      }
      updateTotals();
      return;
    }

    // Check expiration if present
    if (match.expirationDate) {
      const now = new Date();
      const exp = new Date(match.expirationDate);
      if (exp < now) {
        state.appliedDiscount = null;
        if (msgEl) {
          msgEl.textContent = "This discount code has expired.";
          msgEl.classList.remove("text-success");
          msgEl.classList.add("text-danger");
          msgEl.style.display = "";
        }
        updateTotals();
        return;
      }
    }

    // Valid discount
    state.appliedDiscount = {
      code: match.code,
      percent: match.discountPercent || 0,
    };

    if (msgEl) {
      msgEl.textContent = `Discount applied: ${state.appliedDiscount.percent}%`;
      msgEl.classList.remove("text-danger");
      msgEl.classList.add("text-success");
      msgEl.style.display = "";
    }

    updateTotals();
  } catch (err) {
    console.error("Error validating discount:", err);
    if (msgEl) {
      msgEl.textContent = "Error validating discount code.";
      msgEl.classList.remove("text-success");
      msgEl.classList.add("text-danger");
      msgEl.style.display = "";
    }
  }
}

// --------------------------------------------------
// Checkout
// --------------------------------------------------
async function checkout() {
  const code = (dom.discountInput.value || "").trim();

  try {
    const url = code
      ? `${apiBase}/cart/${user.id}/checkout?discountCode=${encodeURIComponent(
          code
        )}`
      : `${apiBase}/cart/${user.id}/checkout`;

    const res = await fetch(url, { method: "POST" });
    const text = await res.text();

    if (!res.ok) {
      if (typeof showAlert === "function") {
        showAlert("danger", text || "Checkout failed.");
      } else {
        alert(text || "Checkout failed.");
      }
      return;
    }

    if (typeof showAlert === "function") {
      showAlert("success", text || "Checkout complete.");
    } else {
      alert(text || "Checkout complete.");
    }

    // Reset discount + cart view
    state.appliedDiscount = null;
    if (dom.discountInput) dom.discountInput.value = "";
    if (dom.discountMessage) dom.discountMessage.style.display = "none";
    await loadCart();
  } catch (err) {
    console.error("Error during checkout:", err);
    if (typeof showAlert === "function") {
      showAlert("danger", "Network error during checkout.");
    } else {
      alert("Network error during checkout.");
    }
  }
}

// --------------------------------------------------
// Initialization
// --------------------------------------------------
function initCartPage() {
  // Cache DOM elements
  dom.cartBody = document.getElementById("cart-body");
  dom.subtotal = document.getElementById("subtotal");
  dom.tax = document.getElementById("tax");
  dom.total = document.getElementById("total");
  dom.discountInput = document.getElementById("discount-code");
  dom.discountMessage = document.getElementById("discount-applied");
  dom.applyDiscountBtn = document.getElementById("apply-discount");
  dom.checkoutBtn = document.getElementById("checkout-btn");

  // Bind events
  if (dom.applyDiscountBtn) {
    dom.applyDiscountBtn.addEventListener("click", applyDiscount);
  }

  if (dom.checkoutBtn) {
    dom.checkoutBtn.addEventListener("click", checkout);
  }

  loadCart();
}

window.addEventListener("load", initCartPage);
