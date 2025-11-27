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
let __booksCache = [];
let __salesCache = [];

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

  const createBtn = document.getElementById('create-discount-btn');
  if (createBtn) createBtn.addEventListener('click', createDiscount);

  const saleForm = document.getElementById('sale-form');
  if (saleForm) saleForm.addEventListener('submit', createSale);
  loadBooksForSaleSelect();
  loadSales();
};

// --- Create Discount Code ---
async function createDiscount() {
  const codeInput = document.getElementById('discount-code');
  const percentInput = document.getElementById('discount-percent');
  const alertBox = document.getElementById('discount-alert');

  const code = (codeInput?.value || '').trim();
  const percent = parseFloat(percentInput?.value || '');

  // reset alert
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.className = 'alert';
    alertBox.textContent = '';
  }

  if (!code) {
    return showDiscountAlert('Please enter a discount code.', 'danger');
  }
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    return showDiscountAlert('Percent must be between 1 and 100.', 'danger');
  }

  try {
    const res = await fetch(`${apiBase}/discounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, discountPercent: percent, active: true })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed with status ${res.status}`);
    }

    // success
    showDiscountAlert('Discount code created successfully.', 'success');
    if (codeInput) codeInput.value = '';
    if (percentInput) percentInput.value = '';
  } catch (err) {
    showDiscountAlert(`Error creating discount: ${err.message}`, 'danger');
  }
}

function showDiscountAlert(message, type) {
  const alertBox = document.getElementById('discount-alert');
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.style.display = 'block';
}

// --- Sales Management ---
function showSaleAlert(message, type) {
  const alertBox = document.getElementById('sale-alert');
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.style.display = 'block';
}

async function loadBooksForSaleSelect() {
  const select = document.getElementById('sale-book');
  if (!select) return;
  try {
    const res = await fetch(`${apiBase}/books`);
    __booksCache = await res.json();
    select.innerHTML = `<option value="">Select a book...</option>`;
    __booksCache.forEach(b => {
      const option = document.createElement('option');
      option.value = b.id;
      const price = typeof b.price === 'number' ? `$${b.price.toFixed(2)}` : '-';
      option.textContent = `${b.title || 'Untitled'} (${price})`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to load books for sale form', err);
    showSaleAlert('Could not load books for sale form.', 'danger');
  }
}

async function loadSales() {
  const tbody = document.getElementById('sales-table-body');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Loading...</td></tr>`;
  }
  try {
    const res = await fetch(`${apiBase}/sales`);
    if (!res.ok) throw new Error(await res.text());
    __salesCache = await res.json();
    renderSales();
  } catch (err) {
    console.error('Failed to load sales', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load sales.</td></tr>`;
    }
    showSaleAlert('Could not load sales data.', 'danger');
  }
}

function renderSales() {
  const tbody = document.getElementById('sales-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!__salesCache || __salesCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No sales configured.</td></tr>`;
    return;
  }

  __salesCache
    .sort((a, b) => (a.startsAt || '').localeCompare(b.startsAt || ''))
    .forEach(sale => {
      const bookTitle = sale.book?.title || (sale.bookTitle ?? 'Unknown Book');
      const basePrice =
        typeof sale.book?.price === 'number'
          ? sale.book.price
          : typeof sale.basePrice === 'number'
            ? sale.basePrice
            : null;
      const basePriceText = basePrice !== null ? `$${basePrice.toFixed(2)}` : '-';
      const salePriceText =
        typeof sale.salePrice === 'number' ? `$${sale.salePrice.toFixed(2)}` : '-';

      const status = sale.active === false ? 'Inactive' : 'Active';
      const windowText = `${sale.startsAt || 'Now'} \u2192 ${sale.endsAt || 'No end'}`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${bookTitle}</td>
        <td>${salePriceText}</td>
        <td>${basePriceText}</td>
        <td>${windowText}</td>
        <td>${status}</td>
        <td class="text-right">
          <button class="btn btn-xs btn-default" data-end-sale="${sale.id}">
            End Sale
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  tbody.querySelectorAll('[data-end-sale]').forEach(btn => {
    btn.addEventListener('click', () => {
      endSale(btn.getAttribute('data-end-sale'));
    });
  });
}

async function createSale(event) {
  event?.preventDefault();
  const bookId = document.getElementById('sale-book')?.value;
  const salePriceInput = document.getElementById('sale-price')?.value;
  const startsAt = document.getElementById('sale-start')?.value || null;
  const endsAt = document.getElementById('sale-end')?.value || null;
  const alertBox = document.getElementById('sale-alert');

  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.className = 'alert';
    alertBox.textContent = '';
  }

  const salePrice = parseFloat(salePriceInput);
  if (!bookId) {
    return showSaleAlert('Please choose a book.', 'danger');
  }
  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return showSaleAlert('Enter a valid sale price greater than 0.', 'danger');
  }

  const book = __booksCache.find(b => String(b.id) === String(bookId));
  if (book && typeof book.price === 'number' && salePrice >= book.price) {
    return showSaleAlert('Sale price must be lower than the regular price.', 'danger');
  }
  if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) {
    return showSaleAlert('End date must be after start date.', 'danger');
  }

  try {
    const res = await fetch(`${apiBase}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId: Number(bookId),
        salePrice,
        startsAt,
        endsAt,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed with status ${res.status}`);
    }

    showSaleAlert('Sale created.', 'success');
    document.getElementById('sale-form').reset();
    await loadSales();
  } catch (err) {
    console.error('Error creating sale', err);
    showSaleAlert(`Error creating sale: ${err.message}`, 'danger');
  }
}

async function endSale(id) {
  if (!id) return;
  try {
    const res = await fetch(`${apiBase}/sales/${id}/deactivate`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    await loadSales();
    showSaleAlert('Sale ended.', 'success');
  } catch (err) {
    console.error('Failed to end sale', err);
    showSaleAlert(`Failed to end sale: ${err.message}`, 'danger');
  }
}
