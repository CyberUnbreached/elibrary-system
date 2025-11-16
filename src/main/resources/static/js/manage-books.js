// manage-books.js
const apiBase = "https://elibrary-system.onrender.com";

/* ---------------------------- UTILITIES ---------------------------- */

function formatPrice(v) {
  if (v === undefined || v === null || isNaN(Number(v))) return "-";
  return `$${Number(v).toFixed(2)}`;
}

// Validate image dimensions (client-side)
function validateImageDimensions(url, allowedSizes) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;

      const isValid = allowedSizes.some(size =>
        size.width === w && size.height === h
      );

      resolve(isValid);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/* ---------------------------- MAIN SCRIPT ---------------------------- */

document.addEventListener("DOMContentLoaded", () => {

  const user = JSON.parse(localStorage.getItem("user"));
  const alertContainer = document.getElementById("alert-container");

  /* ------------------------ ACCESS RESTRICTION ------------------------ */
  if (!user || user.role !== "STAFF") {
    alert("Access denied. Staff only.");
    window.location.href = "home.html";
    return;
  }

  if (typeof renderNav === 'function') { renderNav(); }

  /* ------------------------------ ALERT ------------------------------ */
  function showAlert(type, message) {
    alertContainer.innerHTML =
      `<div class="alert alert-${type} alert-dismissible fade in">
        <a href="#" class="close" data-dismiss="alert">&times;</a>
        ${message}
      </div>`;
    setTimeout(() => $(".alert").alert("close"), 4000);
  }

  /* (Removed) Inline quantity update; handled via modal now */

  /* ---------------------------- LOAD BOOKS ---------------------------- */
  async function loadBooks() {
    const res = await fetch(`${apiBase}/books`);
    const books = await res.json();
    const tbody = document.getElementById("books-body");
    tbody.innerHTML = "";

    /** Create base rows first **/
    books.forEach(book => {
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

    /** DELETE BUTTONS **/
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Delete this book?")) {
          const res = await fetch(`${apiBase}/books/${id}`, { method: "DELETE" });
          if (res.ok) {
            showAlert("success", "Book deleted.");
            const term = document.getElementById("mb-search-box").value.trim();
            await loadBooks();
            filterRows(term);
          } else showAlert("danger", "Delete failed.");
        }
      });
    });

    /** ADD IMAGE / PRICE / QUANTITY COLUMNS **/
    Array.from(document.querySelectorAll('#books-body tr')).forEach((tr, i) => {
      const book = books[i];
      if (!book) return;

      /* ----- IMAGE COLUMN ----- */
      const imgTd = document.createElement("td");
      imgTd.innerHTML = book.imageUrl
        ? `<img src="${book.imageUrl}" style="width:50px;height:70px;object-fit:cover;border-radius:3px;">`
        : `<span class="text-muted">-</span>`;
      tr.insertBefore(imgTd, tr.firstChild);

      /* ----- PRICE COLUMN ----- */
      const priceTd = document.createElement("td");
      priceTd.textContent = formatPrice(book.price);
      tr.insertBefore(priceTd, tr.querySelectorAll("td")[4]); // before Available

      /* ----- QUANTITY COLUMN (display only) ----- */
      const qtyTd = document.createElement("td");
      qtyTd.className = "__qty";
      const qtyVal = (typeof book.quantity === 'number') ? book.quantity : 0;
      qtyTd.textContent = `${qtyVal} in stock`;
      tr.insertBefore(qtyTd, tr.querySelectorAll("td")[5]); // after price
    });

    /* (Removed) Quantity +/- button events */

    /** ADD EDIT BUTTON **/
    Array.from(document.querySelectorAll('#books-body tr')).forEach((tr, i) => {
      const book = books[i];
      const td = tr.querySelectorAll("td");
      const actionsTd = td[td.length - 1];

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-primary btn-sm edit-btn";
      editBtn.innerHTML = `<span class="glyphicon glyphicon-edit"></span> Edit`;
      editBtn.dataset.id = book.id;

      actionsTd.insertBefore(editBtn, actionsTd.firstChild);
      actionsTd.insertBefore(document.createTextNode(" "), editBtn.nextSibling);

      editBtn.addEventListener("click", async () => {
        try {
          const res = await fetch(`${apiBase}/books/${book.id}`);
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

  /* ----------------------- SEARCH FILTER ---------------------- */
  function filterRows(term) {
    const q = term.toLowerCase();
    document.querySelectorAll("#books-body tr").forEach(tr => {
      const td = tr.querySelectorAll("td");
      const title = td[1]?.textContent.toLowerCase() || "";
      const author = td[2]?.textContent.toLowerCase() || "";
      const genre = td[3]?.textContent.toLowerCase() || "";
      tr.style.display = (title.includes(q) || author.includes(q) || genre.includes(q)) ? "" : "none";
    });
  }

  const mbSearch = document.getElementById("mb-search-box");
  mbSearch?.addEventListener("input", e => filterRows(e.target.value.trim()));

  /* ----------------------- INITIAL LOAD ----------------------- */
  (async () => {
    await loadBooks();
    filterRows(mbSearch?.value.trim() || "");
  })();

  /* ----------------------- OPEN ADD BOOK MODAL ----------------------- */
  document.getElementById("open-add-modal").addEventListener("click", () => {
    document.getElementById("add-title").value = "";
    document.getElementById("add-author").value = "";
    document.getElementById("add-genre").value = "";
    document.getElementById("add-price").value = "";
    document.getElementById("add-quantity").value = "0";
    document.getElementById("add-imageUrl").value = "";
    $("#addBookModal").modal("show");
  });

  /* ----------------------- SAVE NEW BOOK ----------------------- */
  document.getElementById("save-add-btn").addEventListener("click", async () => {

    const title = document.getElementById("add-title").value.trim();
    const author = document.getElementById("add-author").value.trim();
    const genre = document.getElementById("add-genre").value.trim();
    const price = Number(document.getElementById("add-price").value.trim());
    const quantity = Number(document.getElementById("add-quantity").value.trim());
    const imageUrlInput = document.getElementById("add-imageUrl").value.trim();

    if (!title || !author || !genre || isNaN(price) || price < 0 || isNaN(quantity) || quantity < 0) {
      showAlert("warning", "Please fill in all fields correctly.");
      return;
    }

    // Default placeholder image
    let imageUrl = imageUrlInput || 
      "https://hds.hel.fi/images/foundation/visual-assets/placeholders/image-m@3x.png";

    // Validate image dimensions
    const allowedSizes = [
      { width: 600, height: 900 },
      { width: 300, height: 450 },
      { width: 240, height: 360 }
    ];

    const validImg = await validateImageDimensions(imageUrl, allowedSizes);
    if (!validImg) {
      showAlert("danger", "Image must be 600×900, 300×450, or 240×360 px.");
      return;
    }

    const newBook = {
      title, author, genre, price, quantity, imageUrl,
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
      await loadBooks();
    } else {
      showAlert("danger", "Failed to add book.");
    }
  });

  /* ----------------------- SAVE EDITED BOOK ----------------------- */
  const saveBtn = document.getElementById("save-edit-btn");
  saveBtn.addEventListener("click", async () => {

    const id = document.getElementById("edit-book-id").value;
    const title = document.getElementById("edit-title").value.trim();
    const author = document.getElementById("edit-author").value.trim();
    const genre = document.getElementById("edit-genre").value.trim();
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

    // Validate image dimensions
    if (imageUrl) {
      const allowedSizes = [
        { width: 600, height: 900 },
        { width: 300, height: 450 },
        { width: 240, height: 360 }
      ];
      const validImg = await validateImageDimensions(imageUrl, allowedSizes);
      if (!validImg) {
        showAlert("danger", "Image must be 600×900, 300×450, or 240×360 px.");
        return;
      }
    }

    const payload = { title, author, genre, price, available, imageUrl, quantity };

    const res = await fetch(`${apiBase}/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      $("#editBookModal").modal("hide");
      showAlert("success", "Book updated!");
      await loadBooks();
    } else showAlert("danger", "Update failed.");
  });

});
