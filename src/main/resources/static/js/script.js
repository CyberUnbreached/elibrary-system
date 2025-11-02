const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// Navbar handling
const navAuth = document.getElementById("nav-auth");
if (user) {
  navAuth.innerHTML = `
    <li><a><span class="glyphicon glyphicon-user"></span> ${user.username} (${user.role})</a></li>
    <li><a href="#" id="logout-btn"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>
  `;
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
} else {
  navAuth.innerHTML = `
    <li><a href="login.html"><span class="glyphicon glyphicon-log-in"></span> Login</a></li>
  `;
}

// Only show Add Book section for staff
if (!user || user.role !== "STAFF") {
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
    if (user && user.role === "CUSTOMER" && book.available) {
      actions = `<button class="btn btn-primary btn-sm" onclick="borrowBook(${book.id})">Borrow</button>`;
    }

    // Staff can delete
    if (user && user.role === "STAFF") {
      actions = `<button class="btn btn-danger btn-sm" onclick="deleteBook(${book.id})">Delete</button>`;
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
  if (!user) {
    alert("Please log in to borrow books.");
    window.location.href = "login.html";
    return;
  }

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
  if (!user || user.role !== "STAFF") {
    alert("Only staff members can delete books.");
    return;
  }

  await fetch(`${apiBase}/books/${bookId}`, { method: "DELETE" });
  loadBooks();
}

// Add book (Staff)
const addForm = document.getElementById("add-book-form");
if (addForm) {
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!user || user.role !== "STAFF") {
      alert("Only staff members can add books.");
      return;
    }

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
}

window.onload = loadBooks;
