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
