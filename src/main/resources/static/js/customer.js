const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// 🔒 Require login
if (!user || user.role !== "CUSTOMER") {
  alert("You must be logged in as a customer to view this page.");
  window.location.href = "login.html";
}

// Navbar
const navAuth = document.getElementById("nav-auth");
navAuth.innerHTML = `
  <li><a><span class="glyphicon glyphicon-user"></span> ${user.username} (${user.role})</a></li>
  <li><a href="#" id="logout-btn"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>
`;
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

// Load all books
async function loadBooks(searchTerm = "") {
  const res = await fetch(`${apiBase}/books`);
  const books = await res.json();
  const tbody = document.getElementById("books-body");
  tbody.innerHTML = "";

  const filtered = books.filter(b => {
    const term = searchTerm.toLowerCase();
    return (
      b.title.toLowerCase().includes(term) ||
      b.author.toLowerCase().includes(term) ||
      b.genre.toLowerCase().includes(term)
    );
  });

  filtered.forEach(book => {
    const tr = document.createElement("tr");
    let action = "";
    if (book.available) {
      action = `<button class="btn btn-success btn-sm" onclick="borrowBook(${book.id})">Borrow</button>`;
    } else {
      action = `<span class="text-muted">Checked Out</span>`;
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

// Borrow book
async function borrowBook(bookId) {
  const today = new Date();
  const maxReturn = new Date();
  maxReturn.setDate(today.getDate() + 14); // 2 weeks max

  const chosenDate = prompt(
    `Enter return date (YYYY-MM-DD) up to ${maxReturn.toISOString().split("T")[0]}:`
  );
  if (!chosenDate) return;

  const returnDate = new Date(chosenDate);
  if (returnDate > maxReturn) {
    alert("Return date cannot be more than 2 weeks from today.");
    return;
  }

  const borrow = {
    user: { id: user.id },
    book: { id: bookId },
    borrowDate: today.toISOString().split("T")[0],
    returnDate: chosenDate
  };

  await fetch(`${apiBase}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(borrow)
  });

  await fetch(`${apiBase}/books/${bookId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ available: false })
  });

  alert("Book borrowed successfully!");
  loadBooks();
  loadMyBooks();
}

// Load my borrowed books
async function loadMyBooks() {
  const res = await fetch(`${apiBase}/transactions`);
  const transactions = await res.json();
  const tbody = document.getElementById("my-books-body");
  tbody.innerHTML = "";

  const myTransactions = transactions.filter(t => t.user.id === user.id);

  myTransactions.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.book.title}</td>
      <td>${t.book.author}</td>
      <td>${t.borrowDate}</td>
      <td>${t.returnDate}</td>
      <td><button class="btn btn-warning btn-sm" onclick="returnBook(${t.book.id}, ${t.id})">Return</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Return book
async function returnBook(bookId, transactionId) {
  await fetch(`${apiBase}/books/${bookId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ available: true })
  });

  await fetch(`${apiBase}/transactions/${transactionId}`, {
    method: "DELETE"
  });

  alert("Book returned successfully!");
  loadBooks();
  loadMyBooks();
}

// Search
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
