// js/router.js
import { initHome } from "./homepage.js";
import { ButterflyAPI } from "./api.js";
import { TagManager } from "./tags.js";

document.addEventListener("DOMContentLoaded", () => {
  const screens = {
    welcome: document.getElementById("welcome-screen"),
    login: document.getElementById("login-screen"),
    create: document.getElementById("create-account-screen"),
    home: document.getElementById("homepage"),
  };

  function toggleLogoutButtons(role) {
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) logoutLink.classList.remove("d-none");
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

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.onclick = () => showScreen("login");

  const createAccountBtn = document.getElementById("goToCreateAccountBtn");
  if (createAccountBtn) {
    createAccountBtn.onclick = (e) => {
      e.preventDefault();
      showScreen("create");
    };
  }

  const backBtns = document.querySelectorAll("[id$='BackToWelcomeBtn']");
  backBtns.forEach((btn) => {
    btn.onclick = () => showScreen("welcome");
  });

    // TAYLOR CHANGE: auto save JWT token
    async function handleLogin(e) {
    e.preventDefault();
    const emailVal = document.getElementById("loginEmail").value;
    const passVal = document.getElementById("loginPassword").value;

    if (emailVal.length < 5) return alert("Username must be at least 5 characters long.");
    if (passVal.length < 7) return alert("Password must be at least 7 characters long.");

    try {
      const user = await ButterflyAPI.login(emailVal, passVal);
      console.log("BACKEND LOGIN RESPONSE:", user);
      const role = user.userType || user.utype || user.uType;

      if (user && role) {
        localStorage.setItem("butterflyUser", JSON.stringify(user));

        showScreen("home");
        initHome(role, user.email);
        toggleLogoutButtons(role);

        const uploadBtn = document.getElementById("uploadBtn");
        if (role === "ADMIN") {
          if (uploadBtn) uploadBtn.classList.remove("d-none");
        } else {
          if (uploadBtn) uploadBtn.classList.add("d-none");
        }
      } else {
        alert("Login failed: couldn't get user role from server");
      }
    } catch (error) {
      console.error("Login Error:", error);
      if (confirm(`Login failed. Account not found or incorrect password.\n\nWould you like to create a new account?`)) {
        showScreen("create");
      }
    }
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.onsubmit = (e) => handleLogin(e);

  const createAccountForm = document.getElementById("createAccountForm");
  if (createAccountForm) {
    createAccountForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameVal = document.getElementById("createUsername").value;
      const emailVal = document.getElementById("createEmail").value;
      const passVal = document.getElementById("createPassword").value;

      // Email Format Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) return alert("Please enter a valid email address.");
      if (usernameVal.length < 5) return alert("Username must be at least 5 characters long.");
      if (passVal.length < 7) return alert("Password must be at least 7 characters long.");

      try {
        // Uniqueness Check: See if username already exists
        const allUsers = await ButterflyAPI.getAllUsers();
        if (allUsers.some((u) => u.username.toLowerCase() === usernameVal.toLowerCase())) {
          return alert("This username already exists. Please choose a different one.");
        }
        await ButterflyAPI.createAccount({ username: usernameVal, email: emailVal, password: passVal, utype: "STUDENT" });
        alert("Account created successfully! Please log in.");
        e.target.reset();
        showScreen("welcome");
      } catch (error) {
        alert(`Could not create account: ${error.message}`);
      }
    });
  }

  // TAYLOR CHANGE: remove jwt token and butterfl user after logout
  const handleLogout = async (e) => {
    e.preventDefault();
    await ButterflyAPI.logout();
    localStorage.removeItem("butterflyUser");
    location.reload();
  };

  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) logoutLink.addEventListener("click", handleLogout);

  const savedUser = localStorage.getItem("butterflyUser");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      const role = user.userType || user.utype || user.uType;
      showScreen("home");
      initHome(role, user.email);
      toggleLogoutButtons(role);
      const uploadBtn = document.getElementById("uploadBtn");
      if (role === "ADMIN" && uploadBtn) uploadBtn.classList.remove("d-none");
    } catch (e) {
      console.error("Error loading saved user", e);
      localStorage.removeItem("butterflyUser");
      localStorage.removeItem("jwt");
    }
  }
  document.addEventListener("show.bs.modal", function (event) {
    if (event.target.id === "addButterflyModal") {
      TagManager.initTagContainer();
    }
  });
});