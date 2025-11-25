// manage-books.js
const apiBase = "https://elibrary-system.onrender.com";

function formatPrice(v) {
  if (v === undefined || v === null || isNaN(Number(v))) return "-";
  return `$${Number(v).toFixed(2)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const alertContainer = document.getElementById("alert-container");
  const searchInput = document.getElementById("mb-search-box");

  if (!user || user.role !== "STAFF") {
    alert("Access denied. Staff only.");
    window.location.href = "home.html";
    return;
  }

  if (typeof renderNav === "function") {
    renderNav();
  }

  function showAlert(type, message) {
    alertContainer.innerHTML =
      `<div class="alert alert-${type} alert-dismissible fade in">
        <a href="#" class="close" data-dismiss="alert">&times;</a>
        ${message}
      </div>`;
    setTimeout(() => $(".alert").alert("close"), 4000);
  }

  async function loadBooks(searchTerm = "") {
    const query = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : "";
    const res = await fetch(`${apiBase}/books${query}`);
    const books = await res.json();
    const tbody = document.getElementById("books-body");
    tbody.innerHTML = "";

    if (!books.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No books found.</td></tr>`;
      return;
    }

    books.forEach(book => {
      const imgCell = book.imageUrl
        ? `<img src="${book.imageUrl}" style="width:50px;height:70px;object-fit:cover;border-radius:3px;">`
        : `<span class="text-muted">-</span>`;
      const qtyVal = (typeof book.quantity === "number") ? book.quantity : 0;
      const desc = (book.description || "").trim() || "-";
      const availabilityText = book.available ? "Available" : "Checked Out";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${imgCell}</td>
        <td>${book.title || "-"}</td>
        <td>${book.author || "-"}</td>
        <td>${book.genre || "-"}</td>
        <td class="text-muted" style="max-width:260px;">${desc}</td>
        <td>${formatPrice(book.price)}</td>
        <td>${qtyVal} in stock</td>
        <td>${availabilityText}</td>
        <td class="text-nowrap">
          <button class="btn btn-primary btn-sm edit-btn" data-id="${book.id}">
            <span class="glyphicon glyphicon-edit"></span> Edit
          </button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${book.id}">
            <span class="glyphicon glyphicon-trash"></span> Delete
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Delete this book?")) {
          const resp = await fetch(`${apiBase}/books/${id}`, { method: "DELETE" });
          if (resp.ok) {
            showAlert("success", "Book deleted.");
            await loadBooks(searchInput?.value.trim() || "");
          } else {
            showAlert("danger", "Delete failed.");
          }
        }
      });
    });

    tbody.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          const res = await fetch(`${apiBase}/books/${btn.dataset.id}`);
          if (!res.ok) return showAlert("danger", "Failed to load book.");
          const b = await res.json();

          const set = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.value = (v ?? "").toString();
          };

          set("edit-book-id", b.id);
          set("edit-title", b.title);
          set("edit-author", b.author);
          set("edit-genre", b.genre);
          set("edit-description", b.description);
          set("edit-price", b.price);
          set("edit-imageUrl", b.imageUrl);
          set("edit-available", b.available);
          set("edit-quantity", b.quantity ?? 0);

          $("#editBookModal").modal("show");
        } catch {
          showAlert("danger", "Unexpected error.");
        }
      });
    });
  }

  searchInput?.addEventListener("input", e => {
    loadBooks(e.target.value.trim());
  });

  (async () => {
    await loadBooks();
  })();

  document.getElementById("open-add-modal").addEventListener("click", () => {
    document.getElementById("add-title").value = "";
    document.getElementById("add-author").value = "";
    document.getElementById("add-genre").value = "";
    document.getElementById("add-description").value = "";
    document.getElementById("add-price").value = "";
    document.getElementById("add-quantity").value = "0";
    document.getElementById("add-imageUrl").value = "";
    $("#addBookModal").modal("show");
  });

  document.getElementById("save-add-btn").addEventListener("click", async () => {
    const title = document.getElementById("add-title").value.trim();
    const author = document.getElementById("add-author").value.trim();
    const genre = document.getElementById("add-genre").value.trim();
    const description = document.getElementById("add-description").value.trim();
    const price = Number(document.getElementById("add-price").value.trim());
    const quantity = Number(document.getElementById("add-quantity").value.trim());
    const imageUrlInput = document.getElementById("add-imageUrl").value.trim();

    if (!title || !author || !genre || isNaN(price) || price < 0 || isNaN(quantity) || quantity < 0) {
      showAlert("warning", "Please fill in all fields correctly.");
      return;
    }

    let imageUrl = imageUrlInput ||
      "https://hds.hel.fi/images/foundation/visual-assets/placeholders/image-m@3x.png";

    const newBook = {
      title, author, genre, description, price, quantity, imageUrl,
      available: true
    };

    const res = await fetch(`${apiBase}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBook)
    });

    if (res.ok) {
      $("#addBookModal").modal("hide");
      showAlert("success", "Book added successfully!");
      await loadBooks(searchInput?.value.trim() || "");
    } else {
      showAlert("danger", "Failed to add book.");
    }
  });

  const saveBtn = document.getElementById("save-edit-btn");
  saveBtn.addEventListener("click", async () => {
    const id = document.getElementById("edit-book-id").value;
    const title = document.getElementById("edit-title").value.trim();
    const author = document.getElementById("edit-author").value.trim();
    const genre = document.getElementById("edit-genre").value.trim();
    const description = document.getElementById("edit-description").value.trim();
    const price = Number(document.getElementById("edit-price").value.trim());
    const imageUrl = document.getElementById("edit-imageUrl").value.trim();
    const available = document.getElementById("edit-available").value === "true";
    const quantity = Number(document.getElementById("edit-quantity").value.trim());

    if (!title || !author || !genre || isNaN(price) || price < 0) {
      showAlert("warning", "Invalid input.");
      return;
    }

    if (quantity < 0 || isNaN(quantity)) {
      showAlert("warning", "Quantity must be non-negative.");
      return;
    }

    const payload = { title, author, genre, description, price, available, imageUrl, quantity };

    const res = await fetch(`${apiBase}/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      $("#editBookModal").modal("hide");
      showAlert("success", "Book updated!");
      await loadBooks(searchInput?.value.trim() || "");
    } else showAlert("danger", "Update failed.");
  });
});
