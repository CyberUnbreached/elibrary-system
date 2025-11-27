const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// Require login as CUSTOMER
if (!user || user.role !== "CUSTOMER") {
  alert("You must be logged in as a customer to purchase books.");
  window.location.href = "login.html";
}

if (typeof renderNav === "function") renderNav();

// Current displayed list (needed so Buy button works correctly)
let currentList = [];
let selectedBook = null;

function formatPrice(v) {
  if (v === undefined || v === null || isNaN(Number(v))) return "-";
  return `$${Number(v).toFixed(2)}`;
}

function resolveSale(book) {
  const basePrice = typeof book.price === "number" ? book.price : 0;
  const salePrice =
    typeof book.salePrice === "number"
      ? book.salePrice
      : typeof book.sale?.salePrice === "number"
        ? book.sale.salePrice
        : null;
  const startsAt = book.saleStart || book.sale?.startsAt;
  const endsAt = book.saleEnd || book.sale?.endsAt;
  const activeFlag = book.onSale ?? book.sale?.active ?? true;
  const now = Date.now();
  const inWindow =
    (!startsAt || Date.parse(startsAt) <= now) &&
    (!endsAt || Date.parse(endsAt) >= now);

  const isOnSale =
    activeFlag &&
    salePrice !== null &&
    isFinite(salePrice) &&
    salePrice < basePrice &&
    inWindow;

  return { basePrice, salePrice: isOnSale ? salePrice : null, isOnSale, endsAt, startsAt };
}

// Load books with search + sorting
async function loadBooks(searchTerm = "") {
  const query = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : "";
  const res = await fetch(`${apiBase}/books${query}`);
  let books = await res.json();

  const tbody = document.getElementById("books-body");
  tbody.innerHTML = "";

  const term = searchTerm.toLowerCase();
  let filtered = books.filter(b =>
    (b.title || "").toLowerCase().includes(term) ||
    (b.author || "").toLowerCase().includes(term) ||
    (b.genre || "").toLowerCase().includes(term) ||
    (b.description || "").toLowerCase().includes(term)
  );

  // ---------- SORTING ----------
  const sortValue = document.getElementById("sort-select")?.value;

  if (sortValue) {
    switch (sortValue) {
      case "price-asc":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;

      case "price-desc":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;

      case "qty-desc":
        filtered.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
        break;

      case "qty-asc":
        filtered.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
        break;
    }
  }

  currentList = filtered;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No books found.</td></tr>`;
    return;
  }

  filtered.forEach(book => {
    const qtyVal = typeof book.quantity === "number" ? book.quantity : 0;
    const imgCell = book.imageUrl
      ? `<img src="${book.imageUrl}" style="width:50px;height:70px;object-fit:cover;border-radius:3px;">`
      : `<span class="text-muted">-</span>`;
    const saleInfo = resolveSale(book);
    const priceHtml = saleInfo.isOnSale
      ? `<div><span class="text-danger">${formatPrice(saleInfo.salePrice)}</span> <small class="text-muted" style="text-decoration:line-through;">${formatPrice(saleInfo.basePrice)}</small></div><div><span class="label label-danger">Sale</span>${saleInfo.endsAt ? ` <small class="text-muted">Ends ${new Date(saleInfo.endsAt).toLocaleDateString()}</small>` : ""}</div>`
      : `<span class="text-right">${formatPrice(saleInfo.basePrice)}</span>`;

    const tr = document.createElement("tr");
    const desc = (book.description || "").trim() || "-";

    tr.innerHTML = `
      <td>${imgCell}</td>
      <td><a href="#" class="book-title-link" data-book-id="${book.id}">${book.title || "-"}</a></td>
      <td>${book.author}</td>
      <td>${book.genre}</td>
      <td class="text-muted" style="max-width:240px;">${desc}</td>
      <td class="text-right">${priceHtml}</td>
      <td class="text-center">${qtyVal}</td>
      <td class="text-center">
        <button class="btn btn-primary btn-sm" data-book-id="${book.id}">
          <span class="glyphicon glyphicon-shopping-cart"></span> Buy
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Connect Buy buttons
  tbody.querySelectorAll("button[data-book-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      openPurchaseModal(btn.getAttribute("data-book-id"));
    });
  });

  // Connect title clicks for details
  tbody.querySelectorAll(".book-title-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      openBookDetail(link.getAttribute("data-book-id"));
    });
  });
}

function openPurchaseModal(bookId) {
  const book = currentList.find(b => String(b.id) === String(bookId));
  if (!book) return;

  selectedBook = book;

  document.getElementById("purchase-book-id").value = book.id;
  document.getElementById("purchase-qty").value = 1;
  document.getElementById("purchase-book-info").textContent =
    `${book.title} by ${book.author} (${book.genre})`;

  $("#purchaseModal").modal("show");
}

function openBookDetail(bookId) {
  const book = currentList.find(b => String(b.id) === String(bookId));
  if (!book) return;
  const saleInfo = resolveSale(book);

  const placeholder = `<div class="text-muted" style="width:80px;height:110px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;border-radius:3px;">No image</div>`;
  const imgHtml = book.imageUrl
    ? `<img src="${book.imageUrl}" style="width:80px;height:110px;object-fit:cover;border-radius:3px;">`
    : placeholder;

  document.getElementById("detail-title").textContent = book.title || "Book Details";
  document.getElementById("detail-image").innerHTML = imgHtml;
  document.getElementById("detail-author").textContent = `Author: ${book.author || "-"}`;
  document.getElementById("detail-genre").textContent = `Genre: ${book.genre || "-"}`;
  const priceDetail = saleInfo.isOnSale
    ? `${formatPrice(saleInfo.salePrice)} (on sale, was ${formatPrice(saleInfo.basePrice)})`
    : formatPrice(saleInfo.basePrice);
  document.getElementById("detail-price").textContent = `Price: ${priceDetail}`;
  const qtyVal = typeof book.quantity === "number" ? book.quantity : 0;
  document.getElementById("detail-quantity").textContent = `Quantity: ${qtyVal}`;

  const desc = (book.description || "").trim() || "No description provided.";
  document.getElementById("detail-description").textContent = desc;

  $("#bookDetailModal").modal("show");
}

document.getElementById("purchase-form").addEventListener("submit", async e => {
  e.preventDefault();

  const qty = parseInt(document.getElementById("purchase-qty").value, 10);
  if (!selectedBook || qty < 1 || qty > 10) {
    showAlert("warning", "Invalid quantity.");
    return;
  }

  try {
    const res = await fetch(
      `${apiBase}/cart/${user.id}/add/${selectedBook.id}?quantity=${qty}`,
      { method: "POST" }
    );

    if (!res.ok) {
      showAlert("danger", "Failed to add to cart.");
      return;
    }

    $("#purchaseModal").modal("hide");
    showAlert("success", "Added to cart! <a href='customer-cart.html'>View cart</a>.");
  } catch (err) {
    console.error(err);
    showAlert("danger", "Network error.");
  }
});

// Search box
document.getElementById("search-box").addEventListener("input", e => {
  loadBooks(e.target.value.trim());
});

// Sorting dropdown
document.getElementById("sort-select").addEventListener("change", () => {
  const term = document.getElementById("search-box").value.trim();
  loadBooks(term);
});

// Init
window.onload = () => loadBooks();
