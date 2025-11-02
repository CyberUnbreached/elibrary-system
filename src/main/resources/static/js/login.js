const apiBase = "https://elibrary-system.onrender.com";


// Handle login
document.getElementById("login-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      showAlert('danger', "Invalid credentials!");
      return;
    }

    const user = await response.json();
    localStorage.setItem("user", JSON.stringify(user));
    showAlert('success', `Welcome, ${user.username}!`);

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);

  } catch (error) {
    console.error(error);
    showAlert('danger', "An error occurred during login.");
  }
});

