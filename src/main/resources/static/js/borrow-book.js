const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "CUSTOMER") {
  alert("You must be logged in as a customer to view this page.");
  window.location.href = "login.html";
}

// Navbar
const navAuth = document.getElementById("nav-auth");
navAuth.innerHTML = `
  <li><a href="history.html"><span class="glyphicon glyphicon-time"></span> History</a></li>
  <li><a><span class="glyphicon glyphicon-user"></span> ${user.username} (${user.role})</a></li>
  <li><a href="#" id="logout-btn"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>
`;
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "home.html";
});

// Load all books
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

// Borrow book (open modal)
let selectedBookId = null;

async function borrowBook(bookId) {
  selectedBookId = bookId;

  const res = await fetch(`${apiBase}/books/${bookId}`);
  const book = await res.json();

  document.getElementById("borrowBookTitle").textContent =
    `Are you sure you want to borrow "${book.title}" by ${book.author}?`;

  const today = new Date();
  const maxReturn = new Date();
  maxReturn.setDate(today.getDate() + 14);

  const todayStr = today.toISOString().split("T")[0];
  const maxStr = maxReturn.toISOString().split("T")[0];

  const dateInput = document.getElementById("returnDate");
  dateInput.min = todayStr;
  dateInput.max = maxStr;
  dateInput.value = todayStr;

  $("#borrowModal").modal("show");
}

// Confirm borrow
document.getElementById("confirmBorrowBtn").addEventListener("click", async () => {
  const chosenDate = document.getElementById("returnDate").value;
  if (!chosenDate) {
    alert("Please select a return date.");
    return;
  }

  try {
    const response = await fetch(`${apiBase}/books/${selectedBookId}/borrow/${user.id}?returnDate=${chosenDate}`, {
      method: "PUT"
    });

    if (!response.ok) {
      const text = await response.text();
      alert(`Error: ${text}`);
      return;
    }

    $("#borrowModal").modal("hide");
    alert("Book borrowed successfully!");
    loadBooks();
    loadMyBooks();
  } catch (error) {
    console.error("Error borrowing book:", error);
    alert("Something went wrong while borrowing the book.");
  }
});

// Load user's borrowed books
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

// Return book
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

// Search and load
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
