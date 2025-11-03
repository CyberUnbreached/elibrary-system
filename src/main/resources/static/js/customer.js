const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// 🔒 Require login
if (!user || user.role !== "CUSTOMER") {
  alert("You must be logged in as a customer to view this page.");
  window.location.href = "login.html";
}

// 🧭 Navbar
const navAuth = document.getElementById("nav-auth");
navAuth.innerHTML = `
  <li><a><span class="glyphicon glyphicon-user"></span> ${user.username} (${user.role})</a></li>
  <li><a href="#" id="logout-btn"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>
`;
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

// 📚 Load all books (available and checked-out)
async function loadBooks(searchTerm = "") {
  const res = await fetch(`${apiBase}/books`);
  const books = await res.json();
  const tbody = document.getElementById("books-body");
  tbody.innerHTML = "";

  const term = searchTerm.toLowerCase();
  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(term) ||
    b.author.toLowerCase().includes(term) ||
    b.genre.toLowerCase().includes(term)
  );

  filtered.forEach(book => {
    const tr = document.createElement("tr");
    let action = "";

    if (book.available) {
      action = `<button class="btn btn-success btn-sm" onclick="borrowBook(${book.id})">Borrow</button>`;
    } else {
      const borrowerName = book.borrowedBy ? book.borrowedBy.username : "Another user";
      action = `<span class="text-muted">Checked Out (${borrowerName})</span>`;
    }

    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.genre}</td>
      <td>${book.available ? "✅ Available" : "❌ Checked Out"}</td>
      <td>${action}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 🕓 Borrow book
async function borrowBook(bookId) {
  const today = new Date();
  const maxReturn = new Date();
  maxReturn.setDate(today.getDate() + 14); // 2 weeks max

  const latestReturn = maxReturn.toISOString().split("T")[0];
  const chosenDate = prompt(`Enter return date (YYYY-MM-DD) up to ${latestReturn}:`);
  if (!chosenDate) return;

  const returnDate = new Date(chosenDate);
  if (returnDate > maxReturn) {
    alert("Return date cannot be more than 2 weeks from today.");
    return;
  }

  try {
    const response = await fetch(`${apiBase}/books/${bookId}/borrow/${user.id}?returnDate=${chosenDate}`, {
      method: "PUT"
    });

    if (!response.ok) {
      const text = await response.text();
      alert(`Error: ${text}`);
      return;
    }

    alert("Book borrowed successfully!");
    loadBooks();
    loadMyBooks();
  } catch (error) {
    console.error("Error borrowing book:", error);
  }
}

// 📘 Load user’s borrowed books
async function loadMyBooks() {
  const res = await fetch(`${apiBase}/transactions/user/${user.id}`);
  const transactions = await res.json();
  const tbody = document.getElementById("my-books-body");
  tbody.innerHTML = "";

  transactions
    .filter(t => !t.returned)
    .forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.book.title}</td>
        <td>${t.book.author}</td>
        <td>${t.borrowDate}</td>
        <td>${t.returnDate}</td>
        <td><button class="btn btn-warning btn-sm" onclick="returnBook(${t.book.id})">Return</button></td>
      `;
      tbody.appendChild(tr);
    });
}

// 🔁 Return book
async function returnBook(bookId) {
  try {
    const response = await fetch(`${apiBase}/books/${bookId}/return/${user.id}`, { method: "PUT" });
    if (!response.ok) {
      const text = await response.text();
      alert(`Error: ${text}`);
      return;
    }

    alert("Book returned successfully!");
    loadBooks();
    loadMyBooks();
  } catch (error) {
    console.error("Error returning book:", error);
  }
}

// 🔍 Search functionality
document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.addEventListener("input", (e) => {
      loadBooks(e.target.value.trim());
    });
  }

  loadBooks();
  loadMyBooks();
});
