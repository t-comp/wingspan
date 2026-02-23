// js/login.js

/* =========================================
   SESSION LOGIC (Identity Management)
   ========================================= */

// Triggered by router when a Student logs in
window.enableStudentMode = function () {
  console.log("Session: Student mode enabled.");
  const studentLogoutLink = document.getElementById("studentLogoutLink");
  const adminLogoutLink = document.getElementById("adminLogoutLink");
  const uploadBtn = document.getElementById("uploadBtn");

  if (studentLogoutLink) studentLogoutLink.classList.remove("d-none");
  if (adminLogoutLink) adminLogoutLink.classList.add("d-none");
  if (uploadBtn) uploadBtn.classList.add("d-none"); // Students can't upload
};

// Triggered by router when an Admin logs in
window.enableAdminMode = function () {
  console.log("Session: Admin mode enabled.");
  const studentLogoutLink = document.getElementById("studentLogoutLink");
  const adminLogoutLink = document.getElementById("adminLogoutLink");
  const uploadBtn = document.getElementById("uploadBtn");
  const deleteBtn = document.getElementById("deleteButterflyBtn");

  if (adminLogoutLink) adminLogoutLink.classList.remove("d-none");
  if (studentLogoutLink) studentLogoutLink.classList.add("d-none");
  if (uploadBtn) uploadBtn.classList.remove("d-none");
  if (deleteBtn) deleteBtn.classList.remove("d-none");
};

// Global Logout Handlers
document.addEventListener("DOMContentLoaded", () => {
  const studentLogoutLink = document.getElementById("studentLogoutLink");
  const adminLogoutLink = document.getElementById("adminLogoutLink");

  if (studentLogoutLink) {
    studentLogoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Student logged out.");
      if (typeof window.showWelcomeScreen === "function")
        window.showWelcomeScreen();
    });
  }

  if (adminLogoutLink) {
    adminLogoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Admin logged out.");
      if (typeof window.showWelcomeScreen === "function")
        window.showWelcomeScreen();
    });
  }
});
