const apiBase = "https://elibrary-system.onrender.com";

// Handle login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  // Basic check (in production you'd verify password properly)
  const res = await fetch(`${apiBase}/users`);
  const users = await res.json();
  const user = users.find(u => u.username === username && u.password === password && u.role === role);

  if (user) {
    // Save user info to localStorage
    localStorage.setItem("currentUser", JSON.stringify(user));
    window.location.href = "index.html";
  } else {
    document.getElementById("login-error").textContent = "Invalid credentials or role!";
  }
});
