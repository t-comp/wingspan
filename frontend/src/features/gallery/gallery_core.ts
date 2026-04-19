// src/features/gallery/gallery_core.ts

/**
 * This file acts as the main engine for displaying the primary butterfly grid.
 * Does all the pagination logic so we don't crash the browser loading all the
 * species pics at once. It also handles the main gallery navigation so you can
 * actually see the grid.
 */

import { AppState } from "../../core/state.js";
import { UI } from "../../shared/ui.js";
import { showSpeciesView } from "../species/species_view.js";

let currentPage = 1;
const itemsPerPage = 40;

export function refreshGallery(data = AppState.butterflies, page = 1) {
  currentPage = page;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const slicedData = data.slice(startIndex, endIndex);

  // Render the grid, and if they click a card, open the species view!
  UI.renderGrid(
    slicedData,
    async (b) => {
      await showSpeciesView(b);
    },
    AppState.currentDisplayMode,
  );
  renderPagination(data.length, totalPages);
}

function renderPagination(totalItems: number, totalPages: number) {
  const paginationContainer = document.getElementById("paginationControls");
  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  const wingSpanTeal = "#0399b0";

  // Removed the white pill background, shadow, and border!
  let html = `<ul class="pagination justify-content-center align-items-center mb-0 gap-2" style="background: transparent; border: none;">`;

  // Previous Arrow
  const prevDisabled = currentPage === 1;
  html += `
    <li class="page-item ${prevDisabled ? "disabled" : ""}">
        <a class="page-link text-decoration-none fw-bold border-0 d-flex align-items-center px-2" href="#" data-page="${prevDisabled ? currentPage : currentPage - 1}" style="color: ${prevDisabled ? "#6c757d" : wingSpanTeal}; background: transparent;">
            <i class="fas fa-chevron-left me-2 small"></i> Prev
        </a>
    </li>`;

  // Page Numbers
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  if (startPage > 1) {
    html += `<li class="page-item"><a class="page-link text-decoration-none fw-bold border-0 rounded-circle" href="#" data-page="1" style="color: var(--card-text); background: transparent; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">1</a></li>`;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link border-0 bg-transparent text-muted" style="background: transparent;">...</span></li>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      // Active Page (Solid Teal Circle remains!)
      html += `
        <li class="page-item active">
            <span class="page-link fw-bold border-0 shadow-sm" style="background-color: ${wingSpanTeal}; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">${i}</span>
        </li>`;
    } else {
      // Inactive Pages
      html += `
        <li class="page-item">
            <a class="page-link text-decoration-none fw-bold border-0 rounded-circle" href="#" data-page="${i}" style="color: var(--card-text); background: transparent; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">${i}</a>
        </li>`;
    }
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link border-0 bg-transparent text-muted" style="background: transparent;">...</span></li>`;
    }
    html += `<li class="page-item"><a class="page-link text-decoration-none fw-bold border-0 rounded-circle" href="#" data-page="${totalPages}" style="color: var(--card-text); background: transparent; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">${totalPages}</a></li>`;
  }

  // Next Arrow
  const nextDisabled = currentPage === totalPages;
  html += `
    <li class="page-item ${nextDisabled ? "disabled" : ""}">
        <a class="page-link text-decoration-none fw-bold border-0 d-flex align-items-center px-2" href="#" data-page="${nextDisabled ? currentPage : currentPage + 1}" style="color: ${nextDisabled ? "#6c757d" : wingSpanTeal}; background: transparent;">
            Next <i class="fas fa-chevron-right ms-2 small"></i>
        </a>
    </li>`;

  html += `</ul>`;
  paginationContainer.innerHTML = html;

  // Re-attach the click listeners
  paginationContainer.querySelectorAll(".page-link").forEach((link) => {
    // Prevent clicking on the active bubble or disabled ellipses
    if (
      link.parentElement?.classList.contains("active") ||
      link.parentElement?.classList.contains("disabled")
    )
      return;

    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetPage = parseInt(
        (e.currentTarget as HTMLElement).getAttribute("data-page") || "1",
      );
      if (!isNaN(targetPage) && targetPage !== currentPage) {
        refreshGallery(AppState.currentFilteredData, targetPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

export function goToGallery() {
  const docsView = document.getElementById("docsView");
  const portfolio = document.getElementById("portfolio");
  const speciesView = document.getElementById("speciesView");
  const teamView = document.getElementById("teamView");

  const galleryControls = document.getElementById("galleryControlsWrapper");
  const teamsControls = document.getElementById("teamsControlsWrapper");
  const usersControls = document.getElementById("usersControlsWrapper");
  const filterPanel = document.getElementById("filterPanel");

  // 1. Show Gallery content, hide ALL others
  if (portfolio) portfolio.style.display = "block";
  if (speciesView) speciesView.style.display = "none";
  if (teamView) teamView.style.display = "none";
  if (docsView) docsView.style.display = "none";

  // 2. Clean Slate the Navbar
  [teamsControls, usersControls].forEach((wrapper) => {
    if (wrapper) {
      wrapper.classList.add("d-none");
      wrapper.classList.remove("d-flex");
    }
  });

  if (galleryControls) {
    galleryControls.classList.remove("d-none");
    galleryControls.classList.add("d-flex");
  }

  // 3. Manage Filter Panel and Nav Highlights
  if (filterPanel) {
    filterPanel.style.display = "";
    filterPanel.classList.remove("show");
  }

  document
    .querySelectorAll(".nav-text-link")
    .forEach((btn) => btn.classList.remove("active"));
  const galleryBtn = document.getElementById("viewGalleryBtn");
  if (galleryBtn) galleryBtn.classList.add("active");

  window.scrollTo(0, 0);

  // Refresh the grid
  if (typeof (window as any).applyAllFilters === "function") {
    (window as any).applyAllFilters();
  }
}
