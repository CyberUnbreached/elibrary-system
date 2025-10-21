const apiBase = "https://elibrary-system.onrender.com"; // Your live API

// Fetch and display all books
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
      <td>${book.available ? "✅" : "❌"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Handle new book form submission
document.getElementById("add-book-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const newBook = {
    title: document.getElementById("title").value,
    author: document.getElementById("author").value,
    genre: document.getElementById("genre").value,
    available: true
  };

  await fetch(`${apiBase}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newBook)
  });

  e.target.reset();
  loadBooks();
});

window.onload = loadBooks;
