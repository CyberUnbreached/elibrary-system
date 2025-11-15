// purchase-book.js
const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// Require login as CUSTOMER
if (!user || user.role !== "CUSTOMER") {
  alert("You must be logged in as a customer to purchase books.");
  window.location.href = "login.html";
}

// Navbar
if (typeof renderNav === 'function') { renderNav(); }

// State for selected book
let selectedBook = null;

// Load books
async function loadBooks(searchTerm = "") {
  const res = await fetch(`${apiBase}/books`);
  const books = await res.json();
  const tbody = document.getElementById("books-body");
  tbody.innerHTML = "";

  const term = searchTerm.toLowerCase();
  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(term) ||
    b.author.toLowerCase().includes(term) ||
    b.genre.toLowerCase().includes(term)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No books found.</td></tr>`;
    return;
  }

  filtered.forEach(book => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.genre}</td>
      <td>${typeof book.price === 'number' ? `$${book.price.toFixed(2)}` : '-'}</td>
      <td class="text-center">
        <button class="btn btn-primary btn-sm" data-book-id="${book.id}">
          <span class="glyphicon glyphicon-shopping-cart"></span> Buy
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Hook up Buy buttons
  tbody.querySelectorAll("button[data-book-id]").forEach(btn => {
    btn.addEventListener("click", () => openPurchaseModal(btn.getAttribute("data-book-id"), filtered));
  });
}

// Open modal
function openPurchaseModal(bookId, sourceList) {
  const book = sourceList.find(b => String(b.id) === String(bookId));
  if (!book) return;

  selectedBook = book;
  document.getElementById("purchase-book-id").value = book.id;
  document.getElementById("purchase-qty").value = 1;
  document.getElementById("purchase-book-info").textContent =
    `${book.title} by ${book.author} (${book.genre})`;

  $("#purchaseModal").modal("show");
}

// Submit add-to-cart
document.getElementById("purchase-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedBook) return;

  const qty = parseInt(document.getElementById("purchase-qty").value, 10);
  if (isNaN(qty) || qty < 1 || qty > 10) {
    showAlert("warning", "Please choose a valid quantity (1–10).");
    return;
  }

  try {
    const res = await fetch(`${apiBase}/cart/${user.id}/add/${selectedBook.id}?quantity=${qty}`, { method: "POST" });

    if (!res.ok) {
      const text = await res.text();
      showAlert("danger", `Add to cart failed: ${text}`);
      return;
    }

    $("#purchaseModal").modal("hide");
    showAlert("success", "Added to cart. <a href=\"customer-cart.html\">View cart</a>.");
  } catch (err) {
    console.error(err);
    showAlert("danger", "Network error while adding to cart.");
  }
});


// Search
document.getElementById("search-box").addEventListener("input", (e) => {
  loadBooks(e.target.value.trim());
});

// Init
window.onload = function () {
  loadBooks();
};
