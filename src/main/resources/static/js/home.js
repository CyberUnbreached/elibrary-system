const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

if (typeof renderNav === "function") {
  renderNav();
}

function formatPrice(v) {
  if (v === undefined || v === null || isNaN(Number(v))) return "-";
  return `$${Number(v).toFixed(2)}`;
}

async function loadBooks(searchTerm = "") {
  const query = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : "";
  const res = await fetch(`${apiBase}/books${query}`);
  let books = await res.json();

  const tbody = document.getElementById("books-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const term = (searchTerm || "").toLowerCase();
  let filteredBooks = books.filter(book =>
    (book.title || "").toLowerCase().includes(term) ||
    (book.author || "").toLowerCase().includes(term) ||
    (book.genre || "").toLowerCase().includes(term) ||
    (book.description || "").toLowerCase().includes(term)
  );

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

  if (!filteredBooks.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No books found.</td></tr>`;
    return;
  }

  filteredBooks.forEach(book => {
    const imgCell = book.imageUrl
      ? `<img src="${book.imageUrl}" alt="${book.title || "Book"}" style="width:50px;height:70px;object-fit:cover;border-radius:3px;">`
      : `<span class="text-muted">-</span>`;

    const availabilityText = book.available ? "Available to Borrow" : "Checked Out";
    const desc = (book.description || "").trim() || "-";
    const qtyVal = typeof book.quantity === "number" ? book.quantity : 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${imgCell}</td>
      <td>${book.title || "-"}</td>
      <td>${book.author || "-"}</td>
      <td>${book.genre || "-"}</td>
      <td class="text-muted" style="max-width:260px;">${desc}</td>
      <td>${formatPrice(book.price)}</td>
      <td>${qtyVal} in stock</td>
      <td>${availabilityText}</td>
    `;

    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("search-box");
  const sortSelect = document.getElementById("sort-select");

  if (searchBox) {
    searchBox.addEventListener("input", e => {
      loadBooks(e.target.value.trim());
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const term = searchBox ? searchBox.value.trim() : "";
      loadBooks(term);
    });
  }

  loadBooks();
});

window.loadBooks = loadBooks;
