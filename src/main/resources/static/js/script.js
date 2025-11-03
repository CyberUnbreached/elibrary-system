const apiBase = "https://elibrary-system.onrender.com";
const user = JSON.parse(localStorage.getItem("user"));

// Navbar handling
const navAuth = document.getElementById("nav-auth");
if (user) {
  navAuth.innerHTML = `
    <li><a><span class="glyphicon glyphicon-user"></span> ${user.username} (${user.role})</a></li>
    <li><a href="#" id="logout-btn"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>
  `;
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.reload(); // Refresh homepage on logout
  });
} else {
  navAuth.innerHTML = `
    <li><a href="login.html"><span class="glyphicon glyphicon-log-in"></span> Login</a></li>
  `;
}

// Load books
async function loadBooks() {
  const res = await fetch(`${apiBase}/books`);
  const books = await res.json();
  const tbody = document.getElementById("books-body");
  tbody.innerHTML = "";

  books.forEach(book => {
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

window.onload = loadBooks;
