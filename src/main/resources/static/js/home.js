const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// Navbar
if (typeof renderNav === 'function') { renderNav(); }

// Format price nicely
function formatPrice(v) {
  if (v === undefined || v === null || isNaN(Number(v))) return "-";
  return `$${Number(v).toFixed(2)}`;
}

// -----------------------------------------------
// BASE LOAD FUNCTION (search)
// -----------------------------------------------
async function loadBooks(searchTerm = "") {
  const res = await fetch(`${apiBase}/books`);
  const books = await res.json();
  const tbody = document.getElementById("books-body");
  tbody.innerHTML = "";

  const filteredBooks = books.filter(book => {
    const term = searchTerm.toLowerCase();
    return (
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      book.genre.toLowerCase().includes(term)
    );
  });

  filteredBooks.forEach(book => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.genre}</td>
      <td>${book.available ? "Available" : "Checked Out"}</td>
    `;
    tr.querySelectorAll('td')[2].insertAdjacentHTML('afterend', '<td>' + formatPrice(book.price) + '</td>');
    tbody.appendChild(tr);
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.addEventListener("input", (e) => {
      const term = e.target.value.trim();
      loadBooks(term);
    });
  }

  loadBooks();
});

// -----------------------------------------------
// OVERRIDE: Load books WITH sorting + images + quantity + correct borrow availability
// -----------------------------------------------
(function () {
  window.loadBooks = async function (searchTerm = "") {
    const res = await fetch(`${apiBase}/books`);
    let books = await res.json();

    const tbody = document.getElementById("books-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    // FILTER
    const term = (searchTerm || "").toLowerCase();
    let filteredBooks = books.filter(book =>
      (book.title || '').toLowerCase().includes(term) ||
      (book.author || '').toLowerCase().includes(term) ||
      (book.genre || '').toLowerCase().includes(term)
    );

    // SORTING
    const sortValue = document.getElementById("sort-select")?.value;

    if (sortValue) {
      switch (sortValue) {

        case "price-asc":
          filteredBooks.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;

        case "price-desc":
          filteredBooks.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;

        case "availability":
          filteredBooks.sort((a, b) => {
            const aAvail = a.available ? 1 : 0;
            const bAvail = b.available ? 1 : 0;
            return bAvail - aAvail;
          });
          break;

        case "qty-desc":
          filteredBooks.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
          break;

        case "qty-asc":
          filteredBooks.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
          break;
      }
    }

    // RENDER ROWS
    filteredBooks.forEach(book => {

      const tr = document.createElement("tr");

      const imgCell = book.imageUrl
        ? `<img src="${book.imageUrl}" alt="${book.title}" style="width:50px;height:70px;object-fit:cover;border-radius:3px;">`
        : `<span class="text-muted">-</span>`;

      // ❗ Correct Borrow Logic (NOT quantity)
      const availabilityText = book.available
        ? "Available to Borrow"
        : `Checked Out (Due: ${book.dueDate || "Unknown"})`;

      tr.innerHTML = `
        <td>${imgCell}</td>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.genre}</td>
        <td>${formatPrice(book.price)}</td>
        <td>${book.quantity} in stock</td>
        <td>${availabilityText}</td>
      `;

      tbody.appendChild(tr);
    });
  };

  // Re-run when sorting changes
  document.addEventListener("DOMContentLoaded", () => {
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        const searchBox = document.getElementById("search-box");
        const term = searchBox ? searchBox.value.trim() : "";
        window.loadBooks(term);
      });
    }
  });
})();
