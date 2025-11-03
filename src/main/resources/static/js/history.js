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
  <li><a><span class="glyphicon glyphicon-user"></span> ${user.username} (${user.role})</a></li>
  <li><a href="#" id="logout-btn"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>
`;
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

// Load user's transactions
async function loadTransactions() {
  const res = await fetch(`${apiBase}/transactions`);
  const transactions = await res.json();

  const tbody = document.getElementById("transactions-body");
  tbody.innerHTML = "";

  // Filter transactions for logged-in user
  const myTransactions = transactions.filter(t => t.user && t.user.id === user.id);

  if (myTransactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No transactions found.</td></tr>`;
    return;
  }

  myTransactions.forEach(t => {
    const tr = document.createElement("tr");
    const status = t.returnDate ? "✅ Returned" : "📘 Borrowed";

    tr.innerHTML = `
      <td>${t.book.title}</td>
      <td>${t.book.author}</td>
      <td>${t.borrowDate || "-"}</td>
      <td>${t.returnDate || "-"}</td>
      <td>${status}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.onload = loadTransactions;
