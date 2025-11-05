const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

const navAuth = document.getElementById("nav-auth");

if (user) {
  // Build navigation links based on role
  let roleLinks = "";

  if (user.role === "CUSTOMER") {
    roleLinks = `
      <li><a href="customer.html"><span class="glyphicon glyphicon-book"></span> My Books</a></li>
      <li><a href="history.html"><span class="glyphicon glyphicon-time"></span> History</a></li>
    `;
  } else if (user.role === "STAFF") {
    roleLinks = `
      <li><a href="staff.html"><span class="glyphicon glyphicon-dashboard"></span> Staff Dashboard</a></li>
    `;
  }

  navAuth.innerHTML = `
    ${roleLinks}
    <li><a><span class="glyphicon glyphicon-user"></span> ${user.username} (${user.role})</a></li>
    <li><a href="#" id="logout-btn"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>
  `;

  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.reload(); // Refresh homepage to show guest view
  });
} else {
  // Not logged in
  navAuth.innerHTML = `
    <li><a href="login.html"><span class="glyphicon glyphicon-log-in"></span> Login</a></li>
  `;
}


// Load books
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
      <td>${book.available ? "✅ Available" : "❌ Checked Out"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ✅ Run loadBooks() right after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.addEventListener("input", (e) => {
      const term = e.target.value.trim();
      loadBooks(term);
    });
  }

  // Load all books initially
  loadBooks();
});
