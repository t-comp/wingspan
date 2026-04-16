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

  let html = `<ul class="pagination pagination-sm justify-content-center mb-4 shadow-sm" style="border-radius: 12px; overflow: hidden;">`;

  // Previous Button
  html += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link text-muted fw-bold px-3 border-0 bg-white" href="#" data-page="${currentPage - 1}" style="cursor: ${currentPage === 1 ? "not-allowed" : "pointer"};">
            <i class="fas fa-chevron-left small"></i>
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
    html += `<li class="page-item"><a class="page-link text-dark fw-bold border-0 bg-white" href="#" data-page="1">1</a></li>`;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link text-muted border-0 bg-white px-2">...</span></li>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      html += `<li class="page-item active"><span class="page-link text-white fw-bold border-0" style="background-color: #0399b0;">${i}</span></li>`;
    } else {
      html += `<li class="page-item"><a class="page-link text-dark fw-bold border-0 bg-white" href="#" data-page="${i}">${i}</a></li>`;
    }
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link text-muted border-0 bg-white px-2">...</span></li>`;
    }
    html += `<li class="page-item"><a class="page-link text-dark fw-bold border-0 bg-white" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
  }

  // Next Button
  html += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link text-muted fw-bold px-3 border-0 bg-white" href="#" data-page="${currentPage + 1}" style="cursor: ${currentPage === totalPages ? "not-allowed" : "pointer"};">
            <i class="fas fa-chevron-right small"></i>
        </a>
    </li>`;

  html += `</ul>`;
  paginationContainer.innerHTML = html;

  paginationContainer.querySelectorAll(".page-link").forEach((link) => {
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
