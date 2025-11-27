const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));
let purchasesCache = [];
let purchaseSortField = "date";
let purchaseSortDirection = "desc";

// Require login
if (!user || user.role !== "CUSTOMER") {
  alert("You must be logged in as a customer to view your history.");
  window.location.href = "login.html";
}

// Navbar
if (typeof renderNav === 'function') { renderNav(); }

// Load user's transaction history
async function loadTransactions() {
  try {
    // Fetch transactions for this specific user only
    const res = await fetch(`${apiBase}/transactions/user/${user.id}`);
    const transactions = await res.json();

    const tbody = document.getElementById("transactions-body");
    tbody.innerHTML = "";

    if (!transactions || transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No transactions found.</td></tr>`;
      return;
    }

    transactions.forEach(t => {
      const tr = document.createElement("tr");
      const status = t.returned ? "Returned" : "Borrowed";

      tr.innerHTML = `
        <td>${t.book ? t.book.title : "Unknown Book"}</td>
        <td>${t.book ? t.book.author : "Unknown"}</td>
        <td>${t.borrowDate || "-"}</td>
        <td>${t.returnDate || "-"}</td>
        <td>${status}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading transaction history:", err);
    const tbody = document.getElementById("transactions-body");
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error loading transactions.</td></tr>`;
  }
}

// Load user's purchase history
async function loadPurchases() {
  try {
    const res = await fetch(`${apiBase}/purchases/user/${user.id}`);
    const purchases = await res.json();
    purchasesCache = Array.isArray(purchases) ? purchases : [];

    renderPurchases();
  } catch (err) {
    console.error("Error loading purchase history:", err);
    const tbody = document.getElementById("purchases-body");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error loading purchases.</td></tr>`;
    }
  }
}

function renderPurchases() {
  const tbody = document.getElementById("purchases-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!purchasesCache || purchasesCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No purchases found.</td></tr>`;
    return;
  }

  const sorted = [...purchasesCache].sort((a, b) => {
    const direction = purchaseSortDirection === "asc" ? 1 : -1;
    if (purchaseSortField === "quantity") {
      const qtyA = Number.isFinite(a.quantity) ? a.quantity : 0;
      const qtyB = Number.isFinite(b.quantity) ? b.quantity : 0;
      if (qtyA === qtyB) return 0;
      return qtyA > qtyB ? direction : -direction;
    }

    const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
    const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);
    const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
    const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
    if (timeA === timeB) return 0;
    return timeA > timeB ? direction : -direction;
  });

  sorted.forEach(p => {
    const tr = document.createElement("tr");
    const qty = p.quantity && p.quantity > 0 ? p.quantity : 1;
    const finalPaid = typeof p.price === "number" ? p.price : 0;
    const saleTag = p.saleApplied ? "Yes" : "No";
    const discountTag =
      typeof p.discountPercentApplied === "number" && p.discountPercentApplied > 0
        ? `${p.discountPercentApplied}%`
        : p.discountCodeUsed
          ? "Yes"
          : "No";
    tr.innerHTML = `
      <td>${p.book ? p.book.title : "Unknown Book"}</td>
      <td>${p.book ? p.book.author : "Unknown"}</td>
      <td>${p.purchaseDate || "-"}</td>
      <td>${qty}</td>
      <td>$${finalPaid.toFixed(2)}</td>
      <td>${saleTag}</td>
      <td>${discountTag}</td>
    `;
    tbody.appendChild(tr);
  });
}

function attachPurchaseSortHandlers() {
  const sortFieldSelect = document.getElementById("purchase-sort-field");
  const sortDirectionSelect = document.getElementById("purchase-sort-direction");
  if (!sortFieldSelect || !sortDirectionSelect) return;

  sortFieldSelect.addEventListener("change", () => {
    purchaseSortField = sortFieldSelect.value;
    renderPurchases();
  });

  sortDirectionSelect.addEventListener("change", () => {
    purchaseSortDirection = sortDirectionSelect.value;
    renderPurchases();
  });
}

window.onload = function () {
  loadTransactions();
  loadPurchases();
  attachPurchaseSortHandlers();
};
