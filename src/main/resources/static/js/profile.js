const apiBase = "https://elibrary-system.onrender.com";
let user = JSON.parse(localStorage.getItem("user"));

const form = document.getElementById("profile-form");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const statusBox = document.getElementById("status");

function showMessage(type, text) {
  statusBox.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      ${text}
    </div>
  `;
}

function initForm() {
  if (!user) return;
  usernameInput.value = user.username || "";
  emailInput.value = user.email || "";
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!user) {
    return;
  }

  const newUsername = usernameInput.value.trim();
  const newEmail = emailInput.value.trim();

  if (!newUsername || !newEmail) {
    showMessage("warning", "Username and email are required.");
    return;
  }

  try {
    const response = await fetch(`${apiBase}/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, email: newEmail })
    });

    if (response.status === 409) {
      const conflictMsg = await response.text();
      showMessage("danger", conflictMsg || "That username or email is already taken.");
      return;
    }

    if (!response.ok) {
      const errorMsg = await response.text();
      showMessage("danger", errorMsg || "Could not update profile. Please try again.");
      return;
    }

    const updatedUser = await response.json();
    user = updatedUser;
    localStorage.setItem("user", JSON.stringify(updatedUser));
    showMessage("success", "Profile updated successfully.");

    if (typeof renderNav === "function") {
      renderNav();
    }
  } catch (err) {
    console.error("Profile update failed", err);
    showMessage("danger", "An unexpected error occurred.");
  }
});

if (!user) {
  alert("You must be logged in to update your profile.");
  window.location.href = "login.html";
} else {
  if (typeof renderNav === "function") {
    renderNav();
  }
  window.onload = initForm;
}
