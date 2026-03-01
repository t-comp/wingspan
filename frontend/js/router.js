import { initHome } from "./homepage.js";

document.addEventListener("DOMContentLoaded", () => {
  const screens = {
    welcome: document.getElementById("welcome-screen"),
    student: document.getElementById("student-login"),
    admin: document.getElementById("admin-login"),
    home: document.getElementById("homepage"),
  };

  // Helper to show/hide the correct logout link
  function toggleLogoutButtons(role) {
    const studentLogout = document.getElementById("studentLogoutLink");
    const adminLogout = document.getElementById("adminLogoutLink");

    // Reset both first
    if (studentLogout) studentLogout.classList.add("d-none");
    if (adminLogout) adminLogout.classList.add("d-none");

    // Show the relevant one
    if (role === "student" && studentLogout)
      studentLogout.classList.remove("d-none");
    if (role === "admin" && adminLogout) adminLogout.classList.remove("d-none");
  }

  function showScreen(key) {
    Object.values(screens).forEach((s) => {
      if (s) {
        s.style.display = "none";
        s.classList.remove("d-flex");
      }
    });
    const target = screens[key];
    if (key === "home") target.style.display = "block";
    else {
      target.style.display = "flex";
      target.classList.add("d-flex");
    }
    window.scrollTo(0, 0);
  }

  // Nav Buttons
  document.getElementById("studentLoginBtn").onclick = () =>
    showScreen("student");
  document.getElementById("adminLoginBtn").onclick = () => showScreen("admin");
  document
    .querySelectorAll("[id$='BackToWelcomeBtn']")
    .forEach((btn) => (btn.onclick = () => showScreen("welcome")));

  // Student Login
  document.getElementById("studentLoginForm").onsubmit = (e) => {
    e.preventDefault();
    showScreen("home");
    initHome();
    toggleLogoutButtons("student"); // <--- Restore Student Logout
    document.getElementById("uploadBtn")?.classList.add("d-none");
  };

  // Admin Login
  document.getElementById("adminLoginForm").onsubmit = (e) => {
    e.preventDefault();
    if (
      document.getElementById("adminEmail").value === "admin" &&
      document.getElementById("adminPassword").value === "123"
    ) {
      showScreen("home");
      initHome();
      toggleLogoutButtons("admin"); // <--- Restore Admin Logout
      document.getElementById("uploadBtn")?.classList.remove("d-none");
      document.getElementById("deleteButterflyBtn")?.classList.remove("d-none");
    } else {
      alert("Wrong login!");
    }
  };

  // Logout Click Handler (Refresh the page to reset state)
  const handleLogout = (e) => {
    e.preventDefault();
    location.reload();
  };

  document
    .getElementById("studentLogoutLink")
    ?.addEventListener("click", handleLogout);
  document
    .getElementById("adminLogoutLink")
    ?.addEventListener("click", handleLogout);
});

// // js/router.js
// document.addEventListener("DOMContentLoaded", () => {
//   // Screens
//   const welcomeScreen = document.getElementById("welcome-screen");
//   const studentLoginScreen = document.getElementById("student-login");
//   const adminLoginScreen = document.getElementById("admin-login");
//   const mainContent = document.getElementById("homepage");

//   // Welcome Screen Buttons
//   const studentLoginBtn = document.getElementById("studentLoginBtn");
//   const adminLoginBtn = document.getElementById("adminLoginBtn");

//   // Back Buttons
//   const studentBackToWelcomeBtn = document.getElementById(
//     "studentBackToWelcomeBtn",
//   );
//   const adminBackToWelcomeBtn = document.getElementById(
//     "adminBackToWelcomeBtn",
//   );

//   // Forms
//   const studentLoginForm = document.getElementById("studentLoginForm");
//   const adminLoginForm = document.getElementById("adminLoginForm");

//   // Helper function to hide everything cleanly and handle Bootstrap d-flex
//   function hideAllScreens() {
//     if (welcomeScreen) {
//       welcomeScreen.classList.remove("d-flex");
//       welcomeScreen.style.display = "none";
//     }
//     if (studentLoginScreen) {
//       studentLoginScreen.classList.remove("d-flex");
//       studentLoginScreen.style.display = "none";
//     }
//     if (adminLoginScreen) {
//       adminLoginScreen.classList.remove("d-flex");
//       adminLoginScreen.style.display = "none";
//     }
//     if (mainContent) {
//       mainContent.style.display = "none";
//     }
//   }

//   // -------------------------------------------
//   // NAVIGATION ROUTES
//   // -------------------------------------------

//   // Route: Welcome -> Student Login
//   if (studentLoginBtn) {
//     studentLoginBtn.addEventListener("click", () => {
//       hideAllScreens();
//       if (studentLoginScreen) {
//         studentLoginScreen.classList.add("d-flex");
//         studentLoginScreen.style.display = "flex";
//       }
//       window.scrollTo(0, 0);
//     });
//   }

//   // Route: Welcome -> Admin Login
//   if (adminLoginBtn) {
//     adminLoginBtn.addEventListener("click", () => {
//       hideAllScreens();
//       if (adminLoginScreen) {
//         adminLoginScreen.classList.add("d-flex");
//         adminLoginScreen.style.display = "flex";
//       }
//       window.scrollTo(0, 0);
//     });
//   }

//   // Routes: Back Buttons -> Welcome Screen
//   if (studentBackToWelcomeBtn) {
//     studentBackToWelcomeBtn.addEventListener("click", () => {
//       hideAllScreens();
//       if (welcomeScreen) {
//         welcomeScreen.classList.add("d-flex");
//         welcomeScreen.style.display = "flex";
//       }
//       window.scrollTo(0, 0);
//     });
//   }

//   if (adminBackToWelcomeBtn) {
//     adminBackToWelcomeBtn.addEventListener("click", () => {
//       hideAllScreens();
//       if (welcomeScreen) {
//         welcomeScreen.classList.add("d-flex");
//         welcomeScreen.style.display = "flex";
//       }
//       window.scrollTo(0, 0);
//     });
//   }

//   // -------------------------------------------
//   // FORM SUBMISSIONS
//   // -------------------------------------------

//   // Student Logs In
//   if (studentLoginForm) {
//     studentLoginForm.addEventListener("submit", (e) => {
//       e.preventDefault();
//       console.log("Student successfully logged in!");

//       hideAllScreens();
//       if (mainContent) {
//         mainContent.style.display = "block";
//       }
//       window.scrollTo(0, 0);

//       // Initialize the gallery
//       if (typeof window.initHome === "function") {
//         window.initHome();
//       }

//       // ACTIVATE STUDENT LOGOUT FEATURE
//       if (typeof window.enableStudentMode === "function") {
//         window.enableStudentMode();
//       }
//     });
//   }

//   // Admin Logs In
//   if (adminLoginForm) {
//     adminLoginForm.addEventListener("submit", (e) => {
//       e.preventDefault();

//       const user = document.getElementById("adminEmail").value;
//       const pass = document.getElementById("adminPassword").value;

//       // Simple credential check
//       if (user === "admin" && pass === "123") {
//         console.log("Admin successfully logged in!");

//         hideAllScreens();
//         if (mainContent) {
//           mainContent.style.display = "block";
//         }
//         window.scrollTo(0, 0);

//         // Start Homepage and activate admin powers
//         if (typeof window.initHome === "function") {
//           window.initHome();
//         }
//         if (typeof window.enableAdminMode === "function") {
//           window.enableAdminMode();
//         }
//       } else {
//         alert("Invalid credentials! Hint: Try user 'admin' and pass '123'");
//       }
//     });
//   }
// });

// // Global function to reset the app during logout
// window.showWelcomeScreen = function () {
//   // We use location.reload() to cleanly wipe all session states and roles
//   location.reload();
// };
