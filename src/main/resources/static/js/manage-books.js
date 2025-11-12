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
            loadBooks();
          } else {
            showAlert("danger", "Failed to delete book.");
          }
        }
      });
    });

    // Inject price cells and edit buttons for each row
    Array.from(document.querySelectorAll('#books-body tr')).forEach((tr, i) => {
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 5 && !tr.querySelector('.book-price')) {
        const priceTd = document.createElement('td');
        priceTd.className = 'book-price';
        // books[i] corresponds to this row since we rendered in order
        const book = (typeof books !== 'undefined' && Array.isArray(books)) ? books[i] : null;
        priceTd.textContent = formatPrice(book && book.price);
        // Insert before the Available cell (index 3 originally)
        tr.insertBefore(priceTd, tds[3]);

        // Prepend Edit button in Actions cell
        const actionsCell = tr.lastElementChild;
        const id = book && book.id;
        if (actionsCell && id != null && !actionsCell.querySelector('.edit-price-btn')) {
          const editBtn = document.createElement('button');
          editBtn.className = 'btn btn-default btn-sm edit-price-btn';
          editBtn.setAttribute('data-id', id);
          editBtn.innerHTML = '<span class="glyphicon glyphicon-pencil"></span> Edit Price';
          actionsCell.insertBefore(editBtn, actionsCell.firstChild);
        }
      }
    });

    // Bind edit price interactions
    document.querySelectorAll('.edit-price-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const tr = btn.closest('tr');
        const priceCell = tr.querySelector('.book-price');
        const actionsCell = tr.querySelector('td:last-child');
        const currentText = (priceCell ? priceCell.textContent.trim() : '');
        const currentVal = (currentText && currentText.startsWith('$')) ? currentText.slice(1) : currentText;
        const currentPrice = parseFloat(currentVal) || 0;

        if (priceCell) priceCell.innerHTML = '<input type="number" class="form-control input-sm price-input" min="0" step="0.01" value="' + currentPrice + '">';
        if (actionsCell) actionsCell.innerHTML = '<button class="btn btn-primary btn-sm save-price-btn" data-id="' + id + '"><span class="glyphicon glyphicon-ok"></span> Save</button> <button class="btn btn-default btn-sm cancel-price-btn" data-id="' + id + '"><span class="glyphicon glyphicon-remove"></span> Cancel</button> <button class="btn btn-danger btn-sm delete-btn" data-id="' + id + '"><span class="glyphicon glyphicon-trash"></span> Delete</button>';

        const saveBtn = tr.querySelector('.save-price-btn');
        const cancelBtn = tr.querySelector('.cancel-price-btn');
        const priceInput = tr.querySelector('.price-input');

        if (saveBtn) saveBtn.addEventListener('click', async () => {
          const newPrice = parseFloat(priceInput.value);
          if (isNaN(newPrice) || newPrice < 0) { showAlert('warning', 'Please enter a valid non-negative price.'); return; }
          try {
            const resGet = await fetch(`${apiBase}/books/${id}`, { headers: { 'Accept': 'application/json' } });
            const bookObj = await resGet.json();
            const payload = {
              id: bookObj.id,
              title: bookObj.title,
              author: bookObj.author,
              genre: bookObj.genre,
              available: !!bookObj.available,
              price: newPrice
            };
            let res = await fetch(`${apiBase}/books/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (res.status === 405 || res.status === 415 || res.status === 404) {
              // Fallback: some servers update via POST upsert
              res = await fetch(`${apiBase}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
              });
            }
            if (!res.ok) { const text = await res.text(); showAlert('danger', 'Failed to update price: ' + text); return; }
            showAlert('success', 'Price updated.');
            loadBooks();
          } catch (err) {
            console.error('Error updating price:', err);
            showAlert('danger', 'Network error updating price.');
          }
        });

        if (cancelBtn) cancelBtn.addEventListener('click', () => {
          if (priceCell) priceCell.textContent = formatPrice(currentPrice);
          if (actionsCell) actionsCell.innerHTML = '<button class="btn btn-default btn-sm edit-price-btn" data-id="' + id + '"><span class="glyphicon glyphicon-pencil"></span> Edit Price</button> <button class="btn btn-danger btn-sm delete-btn" data-id="' + id + '"><span class="glyphicon glyphicon-trash"></span> Delete</button>';
          const rebEdit = tr.querySelector('.edit-price-btn');
          const rebDel = tr.querySelector('.delete-btn');
          if (rebEdit) rebEdit.addEventListener('click', () => btn.click());
          if (rebDel) rebDel.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this book?')) {
              const res = await fetch(`${apiBase}/books/${id}`, { method: 'DELETE' });
              if (res.ok) { showAlert('success', 'Book deleted successfully!'); loadBooks(); }
              else { showAlert('danger', 'Failed to delete book.'); }
            }
          });
        });
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
      loadBooks();
    } else {
      showAlert("danger", "Error adding book.");
    }
  });

  // ✅ Load initial books
  loadBooks();
});
