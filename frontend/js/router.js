import { initHome } from "./homepage.js";
import { ButterflyAPI } from "./api.js"; // Import your new API service

document.addEventListener("DOMContentLoaded", () => {
  const screens = {
    welcome: document.getElementById("welcome-screen"),
    student: document.getElementById("student-login"),
    admin: document.getElementById("admin-login"),
    create: document.getElementById("create-account-screen"), // Added Create Screen
    home: document.getElementById("homepage"),
  };

  function toggleLogoutButtons(role) {
    const studentLogout = document.getElementById("studentLogoutLink");
    const adminLogout = document.getElementById("adminLogoutLink");

    if (studentLogout) {
      studentLogout.classList.add("d-none");
    }
    if (adminLogout) {
      adminLogout.classList.add("d-none");
    }

    if (role === "STUDENT" && studentLogout) {
      studentLogout.classList.remove("d-none");
    }
    if (role === "ADMIN" && adminLogout) {
      adminLogout.classList.remove("d-none");
    }
  }

  function showScreen(key) {
    Object.values(screens).forEach((s) => {
      if (s) {
        s.style.display = "none";
        s.classList.remove("d-flex");
      }
    });
    const target = screens[key];
    if (target) {
      if (key === "home") {
        target.style.display = "block";
      } else {
        target.style.display = "flex";
        target.classList.add("d-flex");
      }
    }
    window.scrollTo(0, 0);
  }

  // Navigation
  const studentLoginBtn = document.getElementById("studentLoginBtn");
  if (studentLoginBtn) {
    studentLoginBtn.onclick = () => showScreen("student");
  }

  const adminLoginBtn = document.getElementById("adminLoginBtn");
  if (adminLoginBtn) {
    adminLoginBtn.onclick = () => showScreen("admin");
  }

  const createAccountBtn = document.getElementById("goToCreateAccountBtn");
  if (createAccountBtn) {
    createAccountBtn.onclick = () => showScreen("create");
  }

  const backBtns = document.querySelectorAll("[id$='BackToWelcomeBtn']");
  backBtns.forEach((btn) => {
    btn.onclick = () => showScreen("welcome");
  });

  // Reusable Login Logic
  async function handleLogin(e, emailId, passId) {
    e.preventDefault();

    const credentials = {
      usernameOrEmail: document.getElementById(emailId).value,
      password: document.getElementById(passId).value,
    };

    try {
      const user = await ButterflyAPI.login(credentials);

      if (user && user.uType) {
        showScreen("home");
        initHome();
        toggleLogoutButtons(user.uType);

        const uploadBtn = document.getElementById("uploadBtn");
        const deleteButterflyBtn =
          document.getElementById("deleteButterflyBtn");

        if (user.uType === "ADMIN") {
          if (uploadBtn) {
            uploadBtn.classList.remove("d-none");
          }
          if (deleteButterflyBtn) {
            deleteButterflyBtn.classList.remove("d-none");
          }
        } else {
          if (uploadBtn) {
            uploadBtn.classList.add("d-none");
          }
        }
      } else {
        alert("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Could not connect to the server.");
    }
  }

  // Student Login Form
  const studentLoginForm = document.getElementById("studentLoginForm");
  if (studentLoginForm) {
    studentLoginForm.onsubmit = (e) =>
      handleLogin(e, "studentEmail", "studentPassword");
  }

  // Admin Login Form
  const adminLoginForm = document.getElementById("adminLoginForm");
  if (adminLoginForm) {
    adminLoginForm.onsubmit = (e) =>
      handleLogin(e, "adminEmail", "adminPassword");
  }

  // Handle Account Creation Submit
  const createAccountForm = document.getElementById("createAccountForm");
  if (createAccountForm) {
    createAccountForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newUser = {
        username: document.getElementById("createUsername").value,
        email: document.getElementById("createEmail").value,
        password: document.getElementById("createPassword").value,
        uType: "STUDENT",
      };

      try {
        await ButterflyAPI.createAccount(newUser);

        alert("Account created successfully! Please log in.");
        e.target.reset();
        showScreen("welcome");
      } catch (error) {
        console.error("Account Creation Error:", error);
        alert("Could not create account. Please try again.");
      }
    });
  }

  // Logout
  const handleLogout = (e) => {
    e.preventDefault();
    location.reload();
  };

  const studentLogoutLink = document.getElementById("studentLogoutLink");
  if (studentLogoutLink) {
    studentLogoutLink.addEventListener("click", handleLogout);
  }

  const adminLogoutLink = document.getElementById("adminLogoutLink");
  if (adminLogoutLink) {
    adminLogoutLink.addEventListener("click", handleLogout);
  }
});
