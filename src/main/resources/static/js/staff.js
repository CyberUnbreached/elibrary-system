// staff.js
const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// Restrict access to staff only
if (!user || user.role !== "STAFF") {
  alert("Access denied. Staff only.");
  window.location.href = "home.html";
}

// Navbar
if (typeof renderNav === 'function') { renderNav(); }

// --- 1️⃣ Load Book Statistics ---
async function loadBookStats() {
  const res = await fetch(`${apiBase}/books`);
  const books = await res.json();

  const available = books.filter(b => b.available).length;
  const checkedOut = books.filter(b => !b.available).length;

  const today = new Date().toISOString().split("T")[0];
  const overdue = books.filter(
    b => b.dueDate && b.dueDate < today && !b.available
  ).length;

  document.getElementById("available-count").textContent = available;
  document.getElementById("checkedout-count").textContent = checkedOut;
  document.getElementById("overdue-count").textContent = overdue;
}

// --- 2️⃣ Load Recent Transactions ---
async function loadRecentTransactions() {
  const res = await fetch(`${apiBase}/transactions`);
  const transactions = await res.json();
  const tbody = document.getElementById("recent-transactions-body");

  tbody.innerHTML = "";

  if (transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No transactions available.</td></tr>`;
    return;
  }

  const sorted = transactions.sort((a, b) => b.id - a.id).slice(0, 10);

  sorted.forEach(t => {
    const tr = document.createElement("tr");
    const status = t.returned ? "✅ Returned" : "📘 Borrowed";

    tr.innerHTML = `
      <td>${t.book ? t.book.title : "Unknown Book"}</td>
      <td>${t.user ? t.user.username : "Unknown User"}</td>
      <td>${t.borrowDate || "-"}</td>
      <td>${t.returnDate || "-"}</td>
      <td>${status}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- 3️⃣ Search for User Borrowed Books ---
async function searchUser() {
  const searchTerm = document.getElementById("user-search-box").value.trim().toLowerCase();
  const res = await fetch(`${apiBase}/users`);
  const users = await res.json();

  const foundUser = users.find(
    u =>
      u.username.toLowerCase() === searchTerm ||
      u.email.toLowerCase() === searchTerm
  );

  const userInfo = document.getElementById("user-info");
  const userBooksBody = document.getElementById("user-books-body");

  if (!foundUser) {
    alert("No user found with that name or email.");
    userInfo.style.display = "none";
    return;
  }

  userInfo.style.display = "block";
  document.getElementById("user-name").textContent = foundUser.username;
  document.getElementById("user-email").textContent = foundUser.email;

  const borrowedBooks = foundUser.borrowedBooks || [];

  userBooksBody.innerHTML = "";

  if (borrowedBooks.length === 0) {
    userBooksBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No borrowed books.</td></tr>`;
    return;
  }

  borrowedBooks.forEach(book => {
    const today = new Date().toISOString().split("T")[0];
    const overdue = book.dueDate && book.dueDate < today && !book.available;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.dueDate || "-"}</td>
      <td>${overdue ? "⚠️ Overdue" : book.available ? "✅ Returned" : "📘 Borrowed"}</td>
    `;
    userBooksBody.appendChild(tr);
  });
}

// --- 4️⃣ Attach Event Listeners ---
document.getElementById("search-user-btn").addEventListener("click", searchUser);

// --- 5️⃣ Load Dashboard Data ---
window.onload = function() {
  loadBookStats();
  loadRecentTransactions();
  if (typeof loadRecentPurchases === 'function') {
    loadRecentPurchases();
  }
};

// --- Load Recent Purchases ---
async function loadRecentPurchases() {
  const res = await fetch(`${apiBase}/purchases`);
  const purchases = await res.json();
  const tbody = document.getElementById("recent-purchases-body");

  tbody.innerHTML = "";

  if (!purchases || purchases.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No purchases available.</td></tr>`;
    return;
  }

  const sorted = purchases.sort((a, b) => b.id - a.id).slice(0, 10);

  sorted.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.book ? p.book.title : "Unknown Book"}</td>
      <td>${p.user ? p.user.username : "Unknown User"}</td>
      <td>$${(p.price ?? 0).toFixed(2)}</td>
      <td>${p.purchaseDate || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== Enhanced sorting implementation (appended) =====
let __borrowTxs = [];
let __purchaseTxs = [];

function renderBorrowTransactionsEnhanced() {
  const tbody = document.getElementById('recent-transactions-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!__borrowTxs || __borrowTxs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No transactions available.</td></tr>`;
    return;
  }

  const sortBy = (document.getElementById('borrow-sort-by')?.value) || 'date';
  const dir = (document.getElementById('borrow-sort-dir')?.value) || 'desc';
  const factor = dir === 'asc' ? 1 : -1;

  const sorted = [...__borrowTxs].sort((a, b) => {
    if (sortBy === 'customer') {
      const an = (a.user && a.user.username ? a.user.username.toLowerCase() : '');
      const bn = (b.user && b.user.username ? b.user.username.toLowerCase() : '');
      if (an < bn) return -1 * factor;
      if (an > bn) return 1 * factor;
      return 0;
    }
    const ad = a.borrowDate ? Date.parse(a.borrowDate) : 0;
    const bd = b.borrowDate ? Date.parse(b.borrowDate) : 0;
    return (ad - bd) * factor;
  }).slice(0, 10);

  sorted.forEach(t => {
    const tr = document.createElement('tr');
    const status = t.returned ? '✅ Returned' : '📘Borrowed';
    tr.innerHTML = `
      <td>${t.book ? t.book.title : 'Unknown Book'}</td>
      <td>${t.user ? t.user.username : 'Unknown User'}</td>
      <td>${t.borrowDate || '-'}</td>
      <td>${t.returnDate || '-'}</td>
      <td>${status}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPurchasesEnhanced() {
  const tbody = document.getElementById('recent-purchases-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!__purchaseTxs || __purchaseTxs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No purchases available.</td></tr>`;
    return;
  }

  const sortBy = (document.getElementById('purchase-sort-by')?.value) || 'date';
  const dir = (document.getElementById('purchase-sort-dir')?.value) || 'desc';
  const factor = dir === 'asc' ? 1 : -1;

  const sorted = [...__purchaseTxs].sort((a, b) => {
    if (sortBy === 'customer') {
      const an = (a.user && a.user.username ? a.user.username.toLowerCase() : '');
      const bn = (b.user && b.user.username ? b.user.username.toLowerCase() : '');
      if (an < bn) return -1 * factor;
      if (an > bn) return 1 * factor;
      return 0;
    }
    if (sortBy === 'dollars') {
      const ap = typeof a.price === 'number' ? a.price : 0;
      const bp = typeof b.price === 'number' ? b.price : 0;
      return (ap - bp) * factor;
    }
    const ad = a.purchaseDate ? Date.parse(a.purchaseDate) : 0;
    const bd = b.purchaseDate ? Date.parse(b.purchaseDate) : 0;
    return (ad - bd) * factor;
  }).slice(0, 10);

  sorted.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.book ? p.book.title : 'Unknown Book'}</td>
      <td>${p.user ? p.user.username : 'Unknown User'}</td>
      <td>$${(p.price ?? 0).toFixed(2)}</td>
      <td>${p.purchaseDate || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Override loaders to cache then render with sorting
async function loadRecentTransactions() {
  const res = await fetch(`${apiBase}/transactions`);
  __borrowTxs = await res.json();
  renderBorrowTransactionsEnhanced();
}

async function loadRecentPurchases() {
  const res = await fetch(`${apiBase}/purchases`);
  __purchaseTxs = await res.json();
  renderPurchasesEnhanced();
}

// Override onload to wire sorting controls
window.onload = function () {
  loadBookStats();
  loadRecentTransactions();
  loadRecentPurchases();

  const bBy = document.getElementById('borrow-sort-by');
  const bDir = document.getElementById('borrow-sort-dir');
  if (bBy) bBy.addEventListener('change', renderBorrowTransactionsEnhanced);
  if (bDir) bDir.addEventListener('change', renderBorrowTransactionsEnhanced);

  const pBy = document.getElementById('purchase-sort-by');
  const pDir = document.getElementById('purchase-sort-dir');
  if (pBy) pBy.addEventListener('change', renderPurchasesEnhanced);
  if (pDir) pDir.addEventListener('change', renderPurchasesEnhanced);
};
