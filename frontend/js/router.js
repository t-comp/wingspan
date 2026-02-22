// js/router.js
document.addEventListener("DOMContentLoaded", () => {
  // Welcome Screen logic
  if (typeof window.initWelcome === "function") {
    window.initWelcome();
  }

  const enterBtn = document.getElementById("enterBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const mainContent = document.getElementById("main-app-content");

  if (enterBtn) {
    enterBtn.addEventListener("click", () => {
      // remove the welcome screen from the page
      if (welcomeScreen && welcomeScreen.parentNode) {
        welcomeScreen.parentNode.removeChild(welcomeScreen);
      }

      // show your main gallery
      mainContent.style.display = "block";

      // make the browser to start exactly at the top of the new content
      window.scrollTo(0, 0);

      // launch Homepage Logic
      if (typeof window.initHome === "function") {
        window.initHome();
      } else {
        console.error(
          "Router Error: initHome function not found! Check homepage.js.",
        );
      }
    });
  }
});
