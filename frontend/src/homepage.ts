// src/homepage.ts

/**
 * This is the main file that boots up the application after a user logs in.
 * It acts as the traffic controller: initializing the global state, binding
 * the primary navbar navigation, and puts together all the individual feature
 * pages to bring into the website.
 */

import { ButterflyAPI } from "./core/api.js";
import { AppState } from "./core/state.js";
import { initSettings } from "./core/settings.js";

// imported features
import { TagManager } from "./features/admin/admin_tags.js";
import { loadStudentData } from "./features/student/student_dashboard.js";
import { initAdminApiKeys } from "./features/admin/admin_api_keys.js";
import { loadTeams, initAdminTeams } from "./features/admin/admin_teams.js";
import {
  renderAllUsersTable,
  initAdminUsers,
} from "./features/admin/admin_users.js";
import { initUpload } from "./features/upload/upload.js";
import { initSpeciesEditor } from "./features/species/species_editor.js";
import { initGalleryFilters } from "./features/gallery/gallery_filters.js";
import {
  showSpeciesView,
  initSpeciesView,
} from "./features/species/species_view.js";
import {
  refreshGallery,
  goToGallery,
} from "./features/gallery/gallery_core.js";

export async function initHome(userRole, userEmail) {
  console.log(
    "Home Initializing with role:",
    userRole,
    "and email:",
    userEmail,
  );

  // ==========================================
  // 1. STATE INITIALIZATION
  // ==========================================
  AppState.userRole = userRole;
  AppState.userEmail = userEmail;
  AppState.butterflies = await ButterflyAPI.getAll();

  let studentApiKey = "";
  if (userRole !== "ADMIN") {
    try {
      const dashboardData = await ButterflyAPI.getStudentDashboard(userEmail);
      if (dashboardData && dashboardData.apiKey) {
        studentApiKey = dashboardData.apiKey;
      } else {
        const allTeams = await ButterflyAPI.getAllTeams();
        for (const t of allTeams) {
          const members = await ButterflyAPI.getTeamMembers(t.id);
          if (members.some((m) => m.email === userEmail)) {
            const keys = await ButterflyAPI.getAllApiKeys();
            const teamKey = keys.find(
              (k) => k.teamName === t.name && k.active !== false,
            );
            if (teamKey) studentApiKey = teamKey.keyVal;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Could not fetch API key for modal", e);
    }
  }

  // ==========================================
  // 2. DOM ELEMENT CACHING
  // ==========================================
  const portfolio = document.getElementById("portfolio");
  const teamView = document.getElementById("teamView");
  const speciesView = document.getElementById("speciesView");
  const filterPanel = document.getElementById("filterPanel");
  const docsView = document.getElementById("docsView");

  const adminTeamContent = document.getElementById("adminTeamContent");
  const studentTeamContent = document.getElementById("studentTeamContent");

  const viewGalleryBtn = document.getElementById("viewGalleryBtn");
  const backBtn = document.getElementById("backToGalleryBtn");
  const navBrand = document.getElementById("navBrandLink");

  // ==========================================
  // 3. GLOBAL EVENT LISTENERS
  // ==========================================
  // Close butterfly image modal when clicking outside the image
  const butterflyModalEl = document.getElementById("butterflyModal");
  if (butterflyModalEl) {
    butterflyModalEl.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).id !== "butterflyModalImage") {
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(butterflyModalEl);
        if (bsModal) bsModal.hide();
      }
    });
  }

  // Global delete single image handler (Used by inline HTML string clicks)
  (window as any).handleDeleteSingleImage = async (imageId) => {
    if (confirm("Delete this specific photo?")) {
      try {
        await ButterflyAPI.deleteImage(imageId);
        alert("Image Deleted");

        if (AppState.currentSpeciesId) {
          const freshButterfly = await ButterflyAPI.getSpeciesById(
            AppState.currentSpeciesId,
          );
          await showSpeciesView(freshButterfly);
        } else {
          location.reload();
        }
      } catch (err: any) {
        alert("Error: " + err.message);
      }
    }
  };

  // ==========================================
  // 4. ADMIN DASHBOARD DATA ORCHESTRATOR
  // ==========================================
  async function loadAdminData() {
    try {
      const [users, teams, tags] = await Promise.all([
        ButterflyAPI.getAllUsers(),
        ButterflyAPI.getAllTeams(),
        ButterflyAPI.getAllTags(),
      ]);

      users.sort((a: any, b: any) =>
        a.username.toLowerCase().localeCompare(b.username.toLowerCase()),
      );
      AppState.allCachedUsers = users;

      AppState.globalUserTeamMap = {};
      const memberResults = await Promise.all(
        teams.map((t: any) => ButterflyAPI.getTeamMembers(t.id)),
      );

      teams.forEach((t: any, i: number) => {
        for (const m of memberResults[i]) {
          AppState.globalUserTeamMap[m.userId] = t.name;
        }
      });

      renderAllUsersTable(AppState.allCachedUsers);
      await loadTeams();
      await TagManager.refreshAdminTagsView();
    } catch (e) {
      console.error("Error loading admin data:", e);
    }
  }

  // Admin Dashboard Listeners
  const adminUserSearch = document.getElementById("adminUserSearch");
  if (adminUserSearch) {
    adminUserSearch.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      const filtered = AppState.allCachedUsers.filter((u: any) =>
        u.username.toLowerCase().includes(query),
      );
      renderAllUsersTable(filtered);
    });
  }

  document
    .getElementById("tags-tab")
    ?.addEventListener("shown.bs.tab", () => TagManager.refreshAdminTagsView());
  document
    .getElementById("teams-tab")
    ?.addEventListener("shown.bs.tab", () => loadTeams());
  document
    .getElementById("users-tab")
    ?.addEventListener("shown.bs.tab", () =>
      renderAllUsersTable(AppState.allCachedUsers),
    );

  // ==========================================
  // 5. NAVIGATION & ROUTING
  // ==========================================
  // Destroy ghost listeners on dashboard button
  const dashboardToggleBtn = document.getElementById("viewTeamBtn");
  if (dashboardToggleBtn) {
    const freshBtn = dashboardToggleBtn.cloneNode(true);
    dashboardToggleBtn.parentNode?.replaceChild(freshBtn, dashboardToggleBtn);
  }

  const openDashboard = async (tab: string) => {
    // 1. Manage Main View Visibility
    if (portfolio) portfolio.style.display = "none";
    if (speciesView) speciesView.style.display = "none";
    if (teamView) teamView.style.display = "block";
    if (docsView) docsView.style.display = "none";
    window.scrollTo(0, 0);

    // 2. Identify Navbar Containers
    const galleryControls = document.getElementById("galleryControlsWrapper");
    const teamsControls = document.getElementById("teamsControlsWrapper");
    const usersControls = document.getElementById("usersControlsWrapper");

    // 3. THE CLEAN SLATE: Reset all controls to hidden first
    [galleryControls, teamsControls, usersControls].forEach((wrapper) => {
      if (wrapper) {
        wrapper.classList.add("d-none");
        wrapper.classList.remove("d-flex");
      }
    });

    // 4. Manage Filter Panel and Nav Highlights
    if (filterPanel) filterPanel.classList.remove("show");
    const activeGalleryBtn = document.getElementById("viewGalleryBtn");
    const activeDashboardBtn = document.getElementById("viewTeamBtn");
    if (activeGalleryBtn) activeGalleryBtn.classList.remove("active");
    if (activeDashboardBtn) activeDashboardBtn.classList.add("active");

    // 5. Handle Role-Specific UI
    if (userRole === "ADMIN") {
      if (adminTeamContent) adminTeamContent.style.display = "block";
      if (studentTeamContent) studentTeamContent.style.display = "none";

      const tabTeams = document.getElementById("tab-teams");
      const tabUsers = document.getElementById("tab-users");
      const tabTags = document.getElementById("tab-tags");

      // Reset Tab Panes
      [tabTeams, tabUsers, tabTags].forEach((t) =>
        t?.classList.remove("show", "active"),
      );

      // Show ONLY the selected tab and its specific navbar controls
      if (tab === "teams") {
        tabTeams?.classList.add("show", "active");
        if (teamsControls) {
          teamsControls.classList.remove("d-none");
          teamsControls.classList.add("d-flex");
        }
      } else if (tab === "users") {
        tabUsers?.classList.add("show", "active");
        if (usersControls) {
          usersControls.classList.remove("d-none");
          usersControls.classList.add("d-flex");
        }
      } else if (tab === "tags") {
        tabTags?.classList.add("show", "active");
      }

      await loadAdminData();
    } else {
      // Student View logic
      if (adminTeamContent) adminTeamContent.style.display = "none";
      if (studentTeamContent) studentTeamContent.style.display = "block";

      // FIX 2: Added '|| ""' to resolve the TypeScript null error
      await loadStudentData(AppState.userEmail || "");
    }
  };

  document.getElementById("navAdminTeams")?.addEventListener("click", (e) => {
    e.preventDefault();
    openDashboard("teams");
  });
  document.getElementById("navAdminUsers")?.addEventListener("click", (e) => {
    e.preventDefault();
    openDashboard("users");
  });
  document.getElementById("navAdminTags")?.addEventListener("click", (e) => {
    e.preventDefault();
    openDashboard("tags");
  });
  document.getElementById("navStudentTeam")?.addEventListener("click", (e) => {
    e.preventDefault();
    openDashboard("studentTeam");
  });

  if (backBtn) backBtn.addEventListener("click", () => goToGallery());
  if (navBrand) navBrand.addEventListener("click", () => goToGallery());
  if (viewGalleryBtn)
    viewGalleryBtn.addEventListener("click", () => goToGallery());

  // Show/Hide Top Nav buttons based on role
  if (userRole === "ADMIN") {
    document
      .querySelectorAll(".admin-only-nav")
      .forEach((el) => ((el as HTMLElement).style.display = "block"));
    document
      .querySelectorAll(".student-only-nav")
      .forEach((el) => ((el as HTMLElement).style.display = "none"));
  } else {
    document
      .querySelectorAll(".admin-only-nav")
      .forEach((el) => ((el as HTMLElement).style.display = "none"));
    document
      .querySelectorAll(".student-only-nav")
      .forEach((el) => ((el as HTMLElement).style.display = "block"));
  }

  // ==========================================
  // 6. MODULE INITIALIZATIONS
  // ==========================================
  initAdminApiKeys(loadAdminData);
  initAdminTeams(loadAdminData);
  initAdminUsers(loadAdminData);

  initSpeciesEditor(
    async (freshSpecies) => {
      await showSpeciesView(freshSpecies);
    },
    () => {
      (window as any).applyAllFilters();
    },
  );

  initUpload({
    reloadGallery: async () => {
      (window as any).applyAllFilters();
    },
    reloadSpecies: async (species) => {
      await showSpeciesView(species);
    },
  });

  initSpeciesView();
  initSettings(userEmail);
  initGalleryFilters(refreshGallery);

  // force the app to show the gallery screen on boot
  goToGallery();
}
