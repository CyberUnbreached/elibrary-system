// customer-cart.js
const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "CUSTOMER") {
  alert("You must be logged in as a customer to view your cart.");
  window.location.href = "login.html";
}

if (typeof renderNav === 'function') { renderNav(); }

let appliedDiscount = null; // simple client flag for UI only

function formatMoney(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

async function loadCart() {
  const tbody = document.getElementById("cart-body");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Loading...</td></tr>`;
  try {
    const res = await fetch(`${apiBase}/cart/${user.id}`);
    const cart = await res.json();
    const items = (cart && cart.items) ? cart.items : [];

    tbody.innerHTML = "";
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Your cart is empty.</td></tr>`;
      updateTotals(0);
      return;
    }

    let subtotal = 0;
    items.forEach(it => {
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
        </td>`;
      tbody.appendChild(tr);
    });

    // Bind remove buttons
    tbody.querySelectorAll("[data-remove-id]").forEach(btn => {
      btn.addEventListener("click", () => removeItem(btn.getAttribute("data-remove-id")));
    });

    updateTotals(subtotal);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load cart.</td></tr>`;
    updateTotals(0);
  }
}

function updateTotals(subtotal) {
  // apply a simple display-time discount if set (server will compute real total)
  let working = subtotal;
  let discount = 0;
  if (appliedDiscount) {
    discount = Math.max(0, Math.min(100, appliedDiscount.percent || 0));
    working = working * (1 - discount / 100);
  }
  const tax = working * 0.0825;
  const total = working + tax;
  document.getElementById("subtotal").textContent = formatMoney(subtotal);
  document.getElementById("tax").textContent = formatMoney(tax);
  document.getElementById("total").textContent = formatMoney(total);
}

async function removeItem(cartItemId) {
  try {
    const res = await fetch(`${apiBase}/cart/${user.id}/remove/${cartItemId}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      showAlert('danger', `Failed to remove item: ${text}`);
      return;
    }
    showAlert('success', 'Item removed from cart.');
    loadCart();
  } catch (err) {
    console.error(err);
    showAlert('danger', 'Network error while removing item.');
  }
}

document.getElementById('apply-discount').addEventListener('click', () => {
  const code = (document.getElementById('discount-code').value || '').trim();
  if (!code) {
    appliedDiscount = null;
    document.getElementById('discount-applied').style.display = 'none';
    loadCart();
    return;
  }
  // For UI only; server handles real validation. Assume 10% for preview.
  appliedDiscount = { code, percent: 10 };
  const el = document.getElementById('discount-applied');
  el.textContent = `Preview discount applied: ${appliedDiscount.percent}% (final computed at checkout)`;
  el.style.display = '';
  loadCart();
});

document.getElementById('checkout-btn').addEventListener('click', async () => {
  const code = (document.getElementById('discount-code').value || '').trim();
  try {
    const url = code ? `${apiBase}/cart/${user.id}/checkout?discountCode=${encodeURIComponent(code)}`
                     : `${apiBase}/cart/${user.id}/checkout`;
    const res = await fetch(url, { method: 'POST' });
    const text = await res.text();
    if (!res.ok) {
      showAlert('danger', text || 'Checkout failed.');
      return;
    }
    showAlert('success', text || 'Checkout complete.');
    appliedDiscount = null;
    document.getElementById('discount-code').value = '';
    document.getElementById('discount-applied').style.display = 'none';
    loadCart();
  } catch (err) {
    console.error(err);
    showAlert('danger', 'Network error during checkout.');
  }
});

window.onload = function () {
  loadCart();
};

