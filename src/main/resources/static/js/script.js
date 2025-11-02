const apiBase = "https://elibrary-system.onrender.com";

const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "login.html";
}

document.getElementById("user-role").textContent = `Logged in as: ${user.role}`;
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "login.html";
});

// Only show Add Book section for staff
if (user.role !== "STAFF") {
  document.querySelectorAll(".staff-only").forEach(el => el.style.display = "none");
}

// Load books
async function loadBooks() {
  const res = await fetch(`${apiBase}/books`);
  const books = await res.json();
  const tbody = document.getElementById("books-body");
  tbody.innerHTML = "";

  books.forEach(book => {
    const tr = document.createElement("tr");
    let actions = "";

    // Customers can borrow
    if (user.role === "CUSTOMER" && book.available) {
      actions = `<button onclick="borrowBook(${book.id})">Borrow</button>`;
    }

    // Staff can edit or delete
    if (user.role === "STAFF") {
      actions = `
        <button onclick="deleteBook(${book.id})">Delete</button>
      `;
    }

    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.genre}</td>
      <td>${book.available ? "✅" : "❌"}</td>
      <td>${actions}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Borrow a book (Customer)
async function borrowBook(bookId) {
  const userId = user.id;
  const borrow = {
    user: { id: userId },
    book: { id: bookId },
    borrowDate: new Date().toISOString().split("T")[0],
    returnDate: null
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

  loadBooks();
}

// Delete a book (Staff)
async function deleteBook(bookId) {
  await fetch(`${apiBase}/books/${bookId}`, { method: "DELETE" });
  loadBooks();
}

// Add book (Staff)
document.getElementById("add-book-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newBook = {
    title: document.getElementById("title").value,
    author: document.getElementById("author").value,
    genre: document.getElementById("genre").value,
    available: true
  };

  await fetch(`${apiBase}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newBook)
  });

  e.target.reset();
  loadBooks();
});

window.onload = loadBooks;
