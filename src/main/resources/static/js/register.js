const apiBase = "https://elibrary-system.onrender.com";
const form = document.getElementById("register-form");
const msg = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // --- Validate fields ---
  if (!username || !email || !password) {
    showMessage("All fields are required.", "danger");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMessage("Please enter a valid email address.", "warning");
    return;
  }

  // Check if username already exists
  const res = await fetch(`${apiBase}/users`);
  const users = await res.json();
  const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (existing) {
    showMessage("Username already exists. Choose another one.", "warning");
    return;
  }

  // Create new user
  const newUser = {
    username,
    password,
    email,
    role: "CUSTOMER"
  };

  const createRes = await fetch(`${apiBase}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUser)
  });

  if (createRes.ok) {
    showMessage("Account created successfully! Redirecting to login...", "success");
    setTimeout(() => (window.location.href = "login.html"), 2000);
  } else {
    showMessage("Error creating account. Please try again.", "danger");
  }
});

function showMessage(text, type) {
  msg.innerHTML = `
    <div class="alert alert-${type}">
      ${text}
    </div>
  `;
}
