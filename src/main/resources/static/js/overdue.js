const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// Restrict access to staff only
if (!user || user.role !== "STAFF") {
  alert("Access denied. Staff only.");
  window.location.href = "home.html";
}

// Navbar
if (typeof renderNav === 'function') { renderNav(); }

function formatDate(s) {
  if (!s) return "-";
  return s;
}

function daysBetween(aStr, bStr) {
  const a = new Date(aStr);
  const b = new Date(bStr);
  const diffMs = b - a;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

async function loadOverdue(searchTerm = "") {
  const tbody = document.getElementById("overdue-body");
  tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Loading...</td></tr>`;

  try {
    const res = await fetch(`${apiBase}/transactions`);
    const transactions = await res.json();

    const today = new Date().toISOString().split("T")[0];

    const activeOverdue = transactions
      .filter(t => !t.returned && t.returnDate && t.returnDate < today)
      .map(t => ({
        title: t.book ? t.book.title : "Unknown Book",
        author: t.book ? t.book.author : "Unknown",
        borrower: t.user ? t.user.username : "Unknown",
        email: t.user ? t.user.email : "-",
        borrowDate: t.borrowDate,
        dueDate: t.returnDate,
        daysOverdue: daysBetween(t.returnDate, today)
      }));

    const term = searchTerm.toLowerCase();
    const filtered = activeOverdue.filter(r =>
      r.title.toLowerCase().includes(term) ||
      r.author.toLowerCase().includes(term) ||
      r.borrower.toLowerCase().includes(term) ||
      (r.email || "").toLowerCase().includes(term)
    );

    tbody.innerHTML = "";

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No overdue books found.</td></tr>`;
      return;
    }

    filtered
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.title}</td>
          <td>${row.author}</td>
          <td>${row.borrower}</td>
          <td>${row.email}</td>
          <td>${formatDate(row.borrowDate)}</td>
          <td>${formatDate(row.dueDate)}</td>
          <td><span class="overdue-badge">${row.daysOverdue}d</span></td>
        `;
        tbody.appendChild(tr);
      });
  } catch (err) {
    console.error("Error loading overdue list:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error loading data.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.addEventListener("input", (e) => {
      loadOverdue(e.target.value.trim());
    });
  }
  loadOverdue();
});
