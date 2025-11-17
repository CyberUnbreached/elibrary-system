const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

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

    const tbody = document.getElementById("purchases-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!purchases || purchases.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No purchases found.</td></tr>`;
      return;
    }

    purchases.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.book ? p.book.title : "Unknown Book"}</td>
        <td>${p.book ? p.book.author : "Unknown"}</td>
        <td>${p.purchaseDate || "-"}</td>
        <td>$${(p.price ?? 0).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading purchase history:", err);
    const tbody = document.getElementById("purchases-body");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading purchases.</td></tr>`;
    }
  }
}

window.onload = function () {
  loadTransactions();
  loadPurchases();
};

