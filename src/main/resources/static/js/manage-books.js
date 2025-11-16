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

    // Inject price cells for each row (with inline editor)
    Array.from(document.querySelectorAll('#books-body tr')).forEach((tr, i) => {
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 5 && !tr.querySelector('.book-price')) {
        const priceTd = document.createElement('td');
        priceTd.className = 'book-price';
        const book = (Array.isArray(books)) ? books[i] : null;

        const priceVal = (book && typeof book.price !== 'undefined') ? Number(book.price) : null;
        const priceHtml = `
          <span class="price-display">${formatPrice(priceVal)}</span>
          <input type="number" class="form-control input-sm price-input" style="display:none; width:110px; margin-top:4px" step="0.01" min="0" ${priceVal !== null ? `value="${priceVal}"` : ''}>
          <div class="btn-group btn-group-xs" style="margin-top:4px">
            <button type="button" class="btn btn-default edit-price-btn" title="Edit Price"><span class="glyphicon glyphicon-pencil"></span></button>
            <button type="button" class="btn btn-success save-price-btn" style="display:none" title="Save"><span class="glyphicon glyphicon-ok"></span></button>
            <button type="button" class="btn btn-default cancel-price-btn" style="display:none" title="Cancel"><span class="glyphicon glyphicon-remove"></span></button>
          </div>`;

        priceTd.innerHTML = priceHtml;
        // Insert before the Available cell (index 3 originally)
        tr.insertBefore(priceTd, tds[3]);

        // Hook up inline editor actions
        const displayEl = priceTd.querySelector('.price-display');
        const inputEl = priceTd.querySelector('.price-input');
        const editBtn = priceTd.querySelector('.edit-price-btn');
        const saveBtn = priceTd.querySelector('.save-price-btn');
        const cancelBtn = priceTd.querySelector('.cancel-price-btn');

        function enterEdit() {
          displayEl.style.display = 'none';
          inputEl.style.display = '';
          saveBtn.style.display = '';
          cancelBtn.style.display = '';
          editBtn.style.display = 'none';
          inputEl.focus();
          inputEl.select();
        }

        function exitEdit() {
          displayEl.style.display = '';
          inputEl.style.display = 'none';
          saveBtn.style.display = 'none';
          cancelBtn.style.display = 'none';
          editBtn.style.display = '';
        }

        editBtn.addEventListener('click', enterEdit);
        cancelBtn.addEventListener('click', () => {
          // reset input to current book price
          if (book) inputEl.value = book.price;
          exitEdit();
        });

        async function persistPrice(newPrice) {
          // Validate
          const parsed = Number(newPrice);
          if (isNaN(parsed) || parsed < 0) {
            showAlert('warning', 'Please enter a valid non-negative price.');
            return;
          }
          if (!book || !book.id) {
            showAlert('danger', 'Unable to update price: missing book id.');
            return;
          }

          // Construct payload with existing fields to avoid nulling others
          const payload = {
            title: book.title,
            author: book.author,
            genre: book.genre,
            price: parsed,
            available: book.available
          };

          const res = await fetch(`${apiBase}/books/${book.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            // Update local state and UI
            book.price = parsed;
            displayEl.textContent = formatPrice(parsed);
            exitEdit();
            showAlert('success', 'Price updated successfully.');
          } else {
            showAlert('danger', 'Failed to update price.');
          }
        }

        saveBtn.addEventListener('click', () => persistPrice(inputEl.value));
        inputEl.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') { persistPrice(inputEl.value); }
          if (ev.key === 'Escape') { cancelBtn.click(); }
        });
      }
    });

    // Add Image and Quantity columns after price injection
    Array.from(document.querySelectorAll('#books-body tr')).forEach((tr, i) => {
      const book = (Array.isArray(books)) ? books[i] : null;
      if (!book) return;

      // Insert image as first column if not already present (8 cols total expected after this)
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

      // Ensure quantity cell exists just after the price cell
      const cellsNow = tr.querySelectorAll('td');
      // After inserting image, the price cell ('.book-price') should be at index 4: [Image, Title, Author, Genre, Price, Available, Actions]
      const priceCell = tr.querySelector('.book-price');
      if (priceCell) {
        const qtyExisting = tr.querySelector('td.__qty');
        if (!qtyExisting) {
          const qtyTd = document.createElement('td');
          qtyTd.className = '__qty';
          qtyTd.textContent = (typeof book.quantity === 'number') ? `${book.quantity} in stock` : '-';
          const priceIndex = Array.prototype.indexOf.call(cellsNow, priceCell);
          const insertBeforeIndex = priceIndex >= 0 ? priceIndex + 1 : 5;
          tr.insertBefore(qtyTd, tr.querySelectorAll('td')[insertBeforeIndex]);
        }
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
});
