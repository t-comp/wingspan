// js/router.js
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Welcome Screen logic
  if (typeof window.initWelcome === "function") {
    window.initWelcome();
  }

  // Grab the new buttons
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  const studentLoginBtn = document.getElementById("studentLoginBtn");

  const welcomeScreen = document.getElementById("welcome-screen");
  const mainContent = document.getElementById("main-app-content");

  // Helper function to enter the gallery
  function enterGallery() {
    if (welcomeScreen && welcomeScreen.parentNode) {
      welcomeScreen.parentNode.removeChild(welcomeScreen);
    }
    mainContent.style.display = "block";
    window.scrollTo(0, 0);

    if (typeof window.initHome === "function") {
      window.initHome();
    } else {
      console.error(
        "Router Error: initHome function not found! Check homepage.js.",
      );
    }
  }

  // Listener for "Student Login" - Just enter the gallery
  if (studentLoginBtn) {
    studentLoginBtn.addEventListener("click", () => {
      enterGallery();
    });
  }

  // Listener for "Admin Login" - Enter gallery THEN show login modal
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", () => {
      enterGallery();

      // Open the admin login modal automatically
      const loginModal = new bootstrap.Modal(
        document.getElementById("loginModal"),
      );
      loginModal.show();
    });
  }
});
