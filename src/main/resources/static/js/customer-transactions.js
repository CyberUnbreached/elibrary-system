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
if (typeof renderNav === "function") {
  renderNav();
}

/* ============================================================
   GROUP PURCHASES BY TRANSACTION
   ============================================================ */
function groupPurchasesByTransaction(purchases) {
  const groups = {};

  purchases.forEach((p) => {
    const tx = p.transactionId || "legacy-" + p.id;

    if (!groups[tx]) {
      groups[tx] = {
        transactionId: tx,
        purchaseDate: p.purchaseDate,
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
      };
    }

    groups[tx].items.push(p);
    groups[tx].totalQuantity += p.quantity || 1;
    groups[tx].totalAmount += p.price || 0;
  });

  return Object.values(groups);
}

/* ============================================================
   SHOW TRANSACTION DETAILS (MODAL)
   ============================================================ */
function showPurchaseDetails(transactionId) {
  const items = purchasesCache.filter((p) => p.transactionId === transactionId);

  // Update modal title
  document.getElementById("details-transaction-id").textContent =
    `(Transaction ${transactionId})`;

  const tbody = document.getElementById("purchase-details-body");
  tbody.innerHTML = "";

  items.forEach((p) => {
    const isSale = p.saleApplied ? "Yes" : "No";
    const discountCode = p.discountCodeUsed ? p.discountCodeUsed : "-";
    const discountPct = p.discountPercentApplied
      ? p.discountPercentApplied + "%"
      : "-";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.book ? p.book.title : "Unknown"}</td>
      <td>${p.book ? p.book.author : "-"}</td>
      <td>${p.quantity || 1}</td>
      <td>$${(p.price || 0).toFixed(2)}</td>
      <td>${isSale}</td>
      <td>${discountCode}</td>
      <td>${discountPct}</td>
    `;

    tbody.appendChild(tr);
  });

  $("#purchaseDetailsModal").modal("show");
}

/* ============================================================
   LOAD PURCHASE HISTORY
   ============================================================ */
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
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
        Error loading purchases.
      </td></tr>`;
    }
  }
}

/* ============================================================
   RENDER PURCHASES (GROUPED)
   ============================================================ */
function renderPurchases() {
  const tbody = document.getElementById("purchases-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!purchasesCache || purchasesCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">
      No purchases found.
    </td></tr>`;
    return;
  }

  const grouped = groupPurchasesByTransaction(purchasesCache);

  const sorted = [...grouped].sort((a, b) => {
    const direction = purchaseSortDirection === "asc" ? 1 : -1;

    const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
    const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);

    return (dateA - dateB) * direction;
  });

  sorted.forEach((tx) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><b>${tx.transactionId}</b></td>
      <td>${tx.purchaseDate || "-"}</td>
      <td>${tx.items.length} item(s)</td>
      <td>${tx.totalQuantity}</td>
      <td>$${tx.totalAmount.toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="showPurchaseDetails('${
          tx.transactionId
        }')">
          Details
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* ============================================================
   SORT HANDLERS
   ============================================================ */
function attachPurchaseSortHandlers() {
  const sortFieldSelect = document.getElementById("purchase-sort-field");
  const sortDirectionSelect = document.getElementById(
    "purchase-sort-direction"
  );
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

/* ============================================================
   LOAD USER BORROW HISTORY (AFTER PURCHASES)
   ============================================================ */
async function loadTransactions() {
  try {
    const res = await fetch(`${apiBase}/transactions/user/${user.id}`);
    const transactions = await res.json();

    const tbody = document.getElementById("transactions-body");
    tbody.innerHTML = "";

    if (!transactions || transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">
        No transactions found.
      </td></tr>`;
      return;
    }

    transactions.forEach((t) => {
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
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">
      Error loading transactions.
    </td></tr>`;
  }
}

/* ============================================================
   PAGE LOAD
   ============================================================ */
window.onload = function () {
  loadPurchases().then(() => loadTransactions());
  attachPurchaseSortHandlers();
};
