// js/router.js
document.addEventListener("DOMContentLoaded", () => {
  // Screens
  const welcomeScreen = document.getElementById("welcome-screen");
  const studentLoginScreen = document.getElementById("student-login");
  const adminLoginScreen = document.getElementById("admin-login");
  const mainContent = document.getElementById("main-app-content");

  // Welcome Screen Buttons
  const studentLoginBtn = document.getElementById("studentLoginBtn");
  const adminLoginBtn = document.getElementById("adminLoginBtn");

  // Back Buttons
  const studentBackToWelcomeBtn = document.getElementById(
    "studentBackToWelcomeBtn",
  );
  const adminBackToWelcomeBtn = document.getElementById(
    "adminBackToWelcomeBtn",
  );

  // Forms
  const studentLoginForm = document.getElementById("studentLoginForm");
  const adminLoginForm = document.getElementById("adminLoginForm");

  // Helper function to hide everything cleanly
  function hideAllScreens() {
    if (welcomeScreen) {
      welcomeScreen.classList.remove("d-flex");
      welcomeScreen.style.display = "none";
    }
    if (studentLoginScreen) {
      studentLoginScreen.classList.remove("d-flex");
      studentLoginScreen.style.display = "none";
    }
    if (adminLoginScreen) {
      adminLoginScreen.classList.remove("d-flex");
      adminLoginScreen.style.display = "none";
    }
    if (mainContent) {
      mainContent.style.display = "none";
    }
  }

  // -------------------------------------------
  // NAVIGATION ROUTES
  // -------------------------------------------

  // Route: Welcome -> Student Login
  if (studentLoginBtn) {
    studentLoginBtn.addEventListener("click", () => {
      hideAllScreens();
      studentLoginScreen.classList.add("d-flex");
      studentLoginScreen.style.display = "flex";
      window.scrollTo(0, 0);
    });
  }

  // Route: Welcome -> Admin Login
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", () => {
      hideAllScreens();
      adminLoginScreen.classList.add("d-flex");
      adminLoginScreen.style.display = "flex";
      window.scrollTo(0, 0);
    });
  }

  // Routes: Back Buttons -> Welcome
  if (studentBackToWelcomeBtn) {
    studentBackToWelcomeBtn.addEventListener("click", () => {
      hideAllScreens();
      welcomeScreen.classList.add("d-flex");
      welcomeScreen.style.display = "flex";
      window.scrollTo(0, 0);
    });
  }

  if (adminBackToWelcomeBtn) {
    adminBackToWelcomeBtn.addEventListener("click", () => {
      hideAllScreens();
      welcomeScreen.classList.add("d-flex");
      welcomeScreen.style.display = "flex";
      window.scrollTo(0, 0);
    });
  }

  // -------------------------------------------
  // FORM SUBMISSIONS
  // -------------------------------------------

  // Student Logs In
  if (studentLoginForm) {
    studentLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      console.log("Student successfully logged in!");

      hideAllScreens();
      mainContent.style.display = "block";
      window.scrollTo(0, 0);

      // Start Homepage in standard mode
      if (typeof window.initHome === "function") window.initHome();
    });
  }

  // Admin Logs In
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const user = document.getElementById("adminEmail").value;
      const pass = document.getElementById("adminPassword").value;

      // Simple credential check
      if (user === "admin" && pass === "123") {
        console.log("Admin successfully logged in!");

        hideAllScreens();
        mainContent.style.display = "block";
        window.scrollTo(0, 0);

        // Start Homepage and activate secret admin powers!
        if (typeof window.initHome === "function") window.initHome();
        if (typeof window.enableAdminMode === "function")
          window.enableAdminMode();
      } else {
        alert("Invalid credentials! Hint: Try user 'admin' and pass '123'");
      }
    });
  }
});
