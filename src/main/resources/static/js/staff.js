// staff.js

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const alertContainer = document.getElementById("alert-container");

  // Restrict access to staff only
  if (!user || user.role !== "STAFF") {
    alert("Access denied. Staff only.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("staff-username").textContent = user.username;

  // Alert helper
  function showAlert(type, message) {
    alertContainer.innerHTML =
      '<div class="alert alert-' + type + ' alert-dismissible fade in">' +
      '<a href="#" class="close" data-dismiss="alert">&times;</a>' +
      message +
      "</div>";
    setTimeout(() => $(".alert").alert("close"), 4000);
  }

  // Load all books
  async function loadBooks() {
    const res = await fetch("/books");
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

    // Attach delete events
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Delete this book?")) {
          const res = await fetch(`/books/${id}`, { method: "DELETE" });
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

  // Add book form
  document.getElementById("add-book-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const book = {
      title: document.getElementById("title").value,
      author: document.getElementById("author").value,
      genre: document.getElementById("genre").value,
      available: true
    };

    const res = await fetch("/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book)
    });

    if (res.ok) {
      showAlert("success", "Book added successfully!");
      e.target.reset();
      loadBooks();
    } else {
      showAlert("danger", "Failed to add book.");
    }
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });

  loadBooks();
});
