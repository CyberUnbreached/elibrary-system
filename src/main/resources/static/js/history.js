const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// Require login
if (!user || user.role !== "CUSTOMER") {
  alert("You must be logged in as a customer to view your history.");
  window.location.href = "login.html";
}

// Navbar setup
const navAuth = document.getElementById("nav-auth");
navAuth.innerHTML = `
  <li><a href="customer.html"><span class="glyphicon glyphicon-book"></span> My Books</a></li>
  <li><a><span class="glyphicon glyphicon-user"></span> ${user.username} (${user.role})</a></li>
  <li><a href="#" id="logout-btn"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>
`;
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

// Load user's transaction history
async function loadTransactions() {
  try {
    // Fetch user data directly (includes transactions)
    const res = await fetch(`${apiBase}/users/${user.id}`);
    const userData = await res.json();

    const transactions = userData.transactions || [];
    const tbody = document.getElementById("transactions-body");
    tbody.innerHTML = "";

    if (transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No transactions found.</td></tr>`;
      return;
    }

    transactions.forEach(t => {
      const tr = document.createElement("tr");
      const status = t.returned ? "✅ Returned" : "📘 Borrowed";

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

window.onload = loadTransactions;
