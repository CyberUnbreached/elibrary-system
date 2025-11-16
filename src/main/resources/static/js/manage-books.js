// manage-books.js
const apiBase = "https://elibrary-system.onrender.com";

function formatPrice(v) {
  if (v === undefined || v === null || isNaN(Number(v))) return "-";
  return `$${Number(v).toFixed(2)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const alertContainer = document.getElementById("alert-container");

  // Restrict access to staff only
  if (!user || user.role !== "STAFF") {
    alert("Access denied. Staff only.");
    window.location.href = "home.html";
    return;
  }

  // Navbar
  if (typeof renderNav === 'function') { renderNav(); }

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
            const mbSearch = document.getElementById('mb-search-box');
            const term = mbSearch ? mbSearch.value.trim() : '';
            await loadBooks();
            filterRows(term);
          } else {
            showAlert("danger", "Failed to delete book.");
          }
        }
      });
    });

    // Add Image, Price, and Quantity columns to match header
    Array.from(document.querySelectorAll('#books-body tr')).forEach((tr, i) => {
      const book = (Array.isArray(books)) ? books[i] : null;
      if (!book) return;

      // Insert image as first column if not already present
      const firstTd = tr.querySelector('td');
      const hasImage = firstTd && firstTd.querySelector('img');
      if (!hasImage) {
        const imgTd = document.createElement('td');
        if (book.imageUrl) {
          imgTd.innerHTML = `<img src="${book.imageUrl}" alt="${book.title || 'cover'}" style="width:50px;height:70px;object-fit:cover;border-radius:3px;">`;
        } else {
          imgTd.innerHTML = `<span class="text-muted">-</span>`;
        }
        tr.insertBefore(imgTd, tr.querySelectorAll('td')[0]);
      }

      // Insert static price cell before the Available column (index 3 originally)
      const tdsNow = tr.querySelectorAll('td');
      const priceTd = document.createElement('td');
      priceTd.textContent = formatPrice(book.price);
      tr.insertBefore(priceTd, tdsNow[3]);

      // Insert quantity cell immediately after price
      const cellsAfterPrice = tr.querySelectorAll('td');
      const priceIndex = Array.prototype.indexOf.call(cellsAfterPrice, priceTd);
      const qtyTd = document.createElement('td');
      qtyTd.className = '__qty';
      qtyTd.textContent = (typeof book.quantity === 'number') ? `${book.quantity} in stock` : '-';
      tr.insertBefore(qtyTd, tr.querySelectorAll('td')[priceIndex + 1]);
    });

    // Ensure Edit button exists in Actions cell and wire handler
    Array.from(document.querySelectorAll('#books-body tr')).forEach((tr, i) => {
      const book = (Array.isArray(books)) ? books[i] : null;
      if (!book) return;
      const tds = tr.querySelectorAll('td');
      const actionsTd = tds[tds.length - 1];
      if (!actionsTd) return;
      if (!actionsTd.querySelector('.edit-btn')) {
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary btn-sm edit-btn';
        editBtn.setAttribute('data-id', book.id);
        editBtn.innerHTML = '<span class="glyphicon glyphicon-edit"></span> Edit';
        // Insert Edit button before Delete
        actionsTd.insertBefore(editBtn, actionsTd.firstChild);
        // Space between buttons
        actionsTd.insertBefore(document.createTextNode(' '), editBtn.nextSibling);

        editBtn.addEventListener('click', async () => {
          try {
            const res = await fetch(`${apiBase}/books/${book.id}`);
            if (!res.ok) { showAlert('danger', 'Failed to load book for editing.'); return; }
            const b = await res.json();
            const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = (v ?? '').toString(); };
            setVal('edit-book-id', b.id);
            setVal('edit-available', b.available);
            setVal('edit-title', b.title);
            setVal('edit-author', b.author);
            setVal('edit-genre', b.genre);
            setVal('edit-price', (typeof b.price === 'number') ? b.price : '');
            setVal('edit-imageUrl', b.imageUrl || '');
            if (typeof $ !== 'undefined' && $('#editBookModal').modal) {
              $('#editBookModal').modal('show');
            }
          } catch (e) {
            showAlert('danger', 'Unexpected error loading book.');
          }
        });
      }
    });
  }

  // ✅ Add new book
  document.getElementById("add-book-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const newBook = {
      title: document.getElementById("title").value.trim(),
      author: document.getElementById("author").value.trim(),
      genre: document.getElementById("genre").value.trim(),
      price: parseFloat(document.getElementById("price").value.trim()),
      available: true
    };

    if (isNaN(newBook.price) || newBook.price < 0) {
      showAlert("warning", "Please enter a valid non-negative price.");
      return;
    }

    const res = await fetch(`${apiBase}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBook)
    });

    if (res.ok) {
      showAlert("success", "Book added successfully!");
      e.target.reset();
      const mbSearch = document.getElementById('mb-search-box');
      const term = mbSearch ? mbSearch.value.trim() : '';
      await loadBooks();
      filterRows(term);
    } else {
      showAlert("danger", "Error adding book.");
    }
  });
  // Client-side filter utility: matches Title/Author/Genre
  function filterRows(term) {
    const tbody = document.getElementById('books-body');
    if (!tbody) return;
    const q = (term || '').toLowerCase();
    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
      const tds = tr.querySelectorAll('td');
      // After injections: [Image, Title, Author, Genre, Price, Quantity, Available, Actions]
      const title = (tds[1]?.textContent || '').toLowerCase();
      const author = (tds[2]?.textContent || '').toLowerCase();
      const genre = (tds[3]?.textContent || '').toLowerCase();
      const match = title.includes(q) || author.includes(q) || genre.includes(q);
      tr.style.display = match ? '' : 'none';
    });
  }

  // Wire up search input
  const mbSearch = document.getElementById('mb-search-box');
  if (mbSearch) {
    mbSearch.addEventListener('input', (e) => {
      filterRows(e.target.value.trim());
    });
  }

  // Load initial books then apply filter if any
  (async () => { await loadBooks(); filterRows(mbSearch ? mbSearch.value.trim() : ''); })();
  
  // Save edited book from modal
  const saveBtn = document.getElementById('save-edit-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const idEl = document.getElementById('edit-book-id');
      if (!idEl || !idEl.value) { showAlert('danger', 'Missing book id.'); return; }
      const id = idEl.value;
      const title = (document.getElementById('edit-title')?.value || '').trim();
      const author = (document.getElementById('edit-author')?.value || '').trim();
      const genre = (document.getElementById('edit-genre')?.value || '').trim();
      const priceStr = (document.getElementById('edit-price')?.value || '').trim();
      const imageUrl = (document.getElementById('edit-imageUrl')?.value || '').trim();
      const availableStr = (document.getElementById('edit-available')?.value || 'true');
      const available = ('' + availableStr) === 'true';

      const price = Number(priceStr);
      if (!title || !author || !genre || isNaN(price) || price < 0) {
        showAlert('warning', 'Please provide valid title, author, genre, and non-negative price.');
        return;
      }

      const payload = { title, author, genre, price, available, imageUrl };
      const res = await fetch(`${apiBase}/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (typeof $ !== 'undefined' && $('#editBookModal').modal) {
          $('#editBookModal').modal('hide');
        }
        showAlert('success', 'Book updated successfully.');
        const term = mbSearch ? mbSearch.value.trim() : '';
        await loadBooks();
        filterRows(term);
      } else {
        showAlert('danger', 'Failed to update book.');
      }
    });
  }
});

