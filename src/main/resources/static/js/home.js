const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// Navbar
if (typeof renderNav === 'function') { renderNav(); }

function formatPrice(v) {
  if (v === undefined || v === null || isNaN(Number(v))) return "-";
  return `$${Number(v).toFixed(2)}`;
}

// --- Load Books Function ---
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
      <td>${book.available ? "✅ Available to Borrow" : "❌ Checked Out"}</td>
    `;
    tr.querySelectorAll('td')[2].insertAdjacentHTML('afterend', '<td>' + formatPrice(book.price) + '</td>');
    tbody.appendChild(tr);
  });
}

// --- Initialize on Page Load ---
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


// --- Override: render books with image + quantity ---
(function() {
  const originalLoadBooks = window.loadBooks;
  window.loadBooks = async function(searchTerm = "") {
    const res = await fetch(`${apiBase}/books`);
    const books = await res.json();
    const tbody = document.getElementById("books-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const filteredBooks = books.filter(book => {
      const term = (searchTerm || "").toLowerCase();
      return (
        (book.title || '').toLowerCase().includes(term) ||
        (book.author || '').toLowerCase().includes(term) ||
        (book.genre || '').toLowerCase().includes(term)
      );
    });

    filteredBooks.forEach(book => {
      const tr = document.createElement("tr");
      const imgCell = book.imageUrl
        ? `<img src="${book.imageUrl}" alt="${book.title}" style="width:50px;height:70px;object-fit:cover;border-radius:3px;">`
        : `<span class="text-muted">-</span>`;
      const availabilityText = (typeof book.quantity === 'number')
        ? (book.quantity > 0 ? 'Available to Borrow' : 'Out of Stock')
        : (book.available ? 'Available to Borrow' : 'Checked Out');

      tr.innerHTML = `
        <td>${imgCell}</td>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.genre}</td>
        <td>${formatPrice(book.price)}</td>
        <td>${book.quantity ?? '-'}</td>
        <td>${availabilityText}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  if (document.readyState !== 'loading') {
    const sb = document.getElementById('search-box');
    const term = sb ? sb.value.trim() : "";
    window.loadBooks(term);
  }
})();
