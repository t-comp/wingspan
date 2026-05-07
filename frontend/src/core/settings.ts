// src/core/settings.ts

/**
 * This module manages the global user preferences and account settings.
 * It contains the logic for toggling the application between light and dark modes, as well as
 * the functions for users to securely change their personal passwords.
 */

import { ButterflyAPI } from "./api.js";

// the logic for the Scientific/Common Name Toggle is actually not in settings.ts
// it's in src/features/gallery/gallery_filters.ts

export function initSettings(userEmail: string) {
  // --- Change Password Logic ---
  const openChangePasswordBtn = document.getElementById(
    "openChangePasswordBtn",
  );
  const changePasswordForm = document.getElementById("changePasswordForm");

  if (openChangePasswordBtn) {
    openChangePasswordBtn.addEventListener("click", (e) => {
      e.preventDefault();
      new bootstrap.Modal(
        document.getElementById("changePasswordModal"),
      ).show();
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const pass1 = (
        document.getElementById("newPersonalPassword") as HTMLInputElement
      ).value;
      const pass2 = (
        document.getElementById("confirmPersonalPassword") as HTMLInputElement
      ).value;

      if (pass1 !== pass2) {
        return alert("Passwords do not match! Please try again.");
      }
      if (pass1.length < 7) {
        return alert("Password must be at least 7 characters long.");
      }

      try {
        await ButterflyAPI.resetPassword(userEmail, pass1);
        alert("Password successfully updated!");
        (e.target as HTMLFormElement).reset();
        bootstrap.Modal.getInstance(
          document.getElementById("changePasswordModal"),
        )?.hide();
      } catch (err: any) {
        alert("Failed to update password: " + err.message);
      }
    });
  }
  // --- Theme Toggle Logic ---
  const themeToggle = document.getElementById("toggleTheme");
  if (themeToggle) {
    themeToggle.addEventListener("click", (e) => {
      e.preventDefault();
      const body = document.body;
      const isDark = body.getAttribute("data-bs-theme") === "dark";

      body.setAttribute("data-bs-theme", isDark ? "light" : "dark");
      body.classList.toggle("bg-dark");
      body.classList.toggle("text-white");

      document.querySelectorAll(".modal-content").forEach((m) => {
        m.classList.toggle("bg-dark");
      });
    });
  }

  // --- Documentation View Logic ---
  const openDocs = () => {
    //  Grab and hide all the other main views
    const portfolio = document.getElementById("portfolio");
    const speciesView = document.getElementById("speciesView");
    const teamView = document.getElementById("teamView");
    const coverageDashboard = document.getElementById("coverageDashboard");

    if (portfolio) portfolio.style.display = "none";
    if (speciesView) speciesView.style.display = "none";
    if (teamView) teamView.style.display = "none";
    if (coverageDashboard) coverageDashboard.style.display = "none";

    //  Hide the navbar filter controls
    const galleryControls = document.getElementById("galleryControlsWrapper");
    const teamsControls = document.getElementById("teamsControlsWrapper");
    const usersControls = document.getElementById("usersControlsWrapper");
    [galleryControls, teamsControls, usersControls].forEach((wrapper) => {
      if (wrapper) {
        wrapper.classList.add("d-none");
        wrapper.classList.remove("d-flex");
      }
    });

    // Show the docs
    const docsView = document.getElementById("docsView");
    if (docsView) docsView.style.display = "block";

    //  Manage active states on the top nav text links
    const activeGalleryBtn = document.getElementById("viewGalleryBtn");
    const activeDashboardBtn = document.getElementById("viewTeamBtn");
    if (activeGalleryBtn) activeGalleryBtn.classList.remove("active");
    if (activeDashboardBtn) activeDashboardBtn.classList.remove("active");

    window.scrollTo(0, 0);
  };

  // Attach the click listener to the Documentation button
  const navDocsBtn = document.getElementById("navDocsBtn");
  if (navDocsBtn) {
    navDocsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openDocs();
    });
  }
}
