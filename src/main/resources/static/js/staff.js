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
};

// --- 6) Add Book (with Price) ---
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('add-book-form-staff');
  if (!form) return;

  const alertBox = document.getElementById('add-book-alert');
  function showAlert(type, msg) {
    if (!alertBox) return;
    alertBox.innerHTML =
      '<div class="alert alert-' + type + ' alert-dismissible" role="alert">' +
      '  <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
      '  ' + msg +
      '</div>';
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const genre = document.getElementById('genre').value.trim();
    const priceStr = document.getElementById('price').value.trim();
    const price = parseFloat(priceStr);

    if (!title || !author || !genre || isNaN(price) || price < 0) {
      showAlert('warning', 'Please enter valid Title, Author, Genre, and a non-negative Price.');
      return;
    }

    const newBook = { title, author, genre, price, available: true };

    try {
      const res = await fetch(`${apiBase}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      });

      if (!res.ok) {
        const text = await res.text();
        showAlert('danger', 'Failed to add book: ' + text);
        return;
      }

      showAlert('success', 'Book added successfully.');
      form.reset();
      loadBookStats();
    } catch (err) {
      console.error('Error adding book:', err);
      showAlert('danger', 'Network error adding book.');
    }
  });
});
