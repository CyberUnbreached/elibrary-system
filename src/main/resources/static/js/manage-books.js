// manage-books.js
const apiBase = "https://elibrary-system.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const alertContainer = document.getElementById("alert-container");

  // Restrict access to staff only
  if (!user || user.role !== "STAFF") {
    alert("Access denied. Staff only.");
    window.location.href = "index.html";
    return;
  }

  // Navbar setup
  document.getElementById("staff-username").textContent = `${user.username} (${user.role})`;
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "index.html";
  });

  // ✅ Alert helper
  function showAlert(type, message) {
    alertContainer.innerHTML =
      `<div class="alert alert-${type} alert-dismissible fade in">
        <a href="#" class="close" data-dismiss="alert">&times;</a>
        ${message}
      </div>`;
    setTimeout(() => $(".alert").alert("close"), 4000);
  }

  // ✅ Load all books
  async function loadBooks() {
    const res = await fetch(`${apiBase}/books`);
    const books = await res.json();
    const tbody = document.getElementById("books-body");
    tbody.innerHTML = "";

    books.forEach((book) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.genre}</td>
        <td>${book.available ? "✅" : "❌"}</td>
        <td>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${book.id}">
            <span class="glyphicon glyphicon-trash"></span> Delete
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Delete book logic
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Are you sure you want to delete this book?")) {
          const res = await fetch(`${apiBase}/books/${id}`, { method: "DELETE" });
          if (res.ok) {
            showAlert("success", "Book deleted successfully!");
            loadBooks();
          } else {
            showAlert("danger", "Failed to delete book.");
          }
        }
      });
    });
  }

  // ✅ Add new book
  document.getElementById("add-book-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const newBook = {
      title: document.getElementById("title").value.trim(),
      author: document.getElementById("author").value.trim(),
      genre: document.getElementById("genre").value.trim(),
      available: true
    };

    const res = await fetch(`${apiBase}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBook)
    });

    if (res.ok) {
      showAlert("success", "Book added successfully!");
      e.target.reset();
      loadBooks();
    } else {
      showAlert("danger", "Error adding book.");
    }
  });

  // ✅ Load initial books
  loadBooks();
});
