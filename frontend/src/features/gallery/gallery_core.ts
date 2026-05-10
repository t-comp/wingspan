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
let currentGalleryData: any[] = [];
let observer: IntersectionObserver | null = null;
let savedScrollPosition = 0;

export function getCurrentPage() {
  return currentPage;
}

export function refreshGallery(data = AppState.butterflies, page = 1) {
  currentPage = page;
  currentGalleryData = data;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

  const itemsToShow = data.slice(0, currentPage * itemsPerPage);

  // save the scroll position right before opening the species view!
  UI.renderGrid(
    itemsToShow,
    async (b) => {
      savedScrollPosition = window.scrollY;
      await showSpeciesView(b);
    },
    AppState.currentDisplayMode,
  );

  // If the data array is empty, show the "No results" message
  if (data.length === 0) {
    const grid = document.getElementById("butterflyGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5 mt-5">
          <i class="fas fa-search fa-3x text-muted mb-3" style="opacity: 0.3;"></i>
          <h4 class="text-muted fw-bold">Nothing matched your results</h4>
          <p class="text-muted">Try adjusting your search or clearing your filters.</p>
        </div>
      `;
    }
    const paginationContainer = document.getElementById("paginationControls");
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  setupInfiniteScroll(totalPages);
}

function setupInfiniteScroll(totalPages: number) {
  const sentinelContainer = document.getElementById("paginationControls");
  if (!sentinelContainer) return;

  // Disconnect the old tripwire before creating a new one
  if (observer) observer.disconnect();

  // If we have loaded everything, show the end message and reset button
  if (currentPage >= totalPages) {
    sentinelContainer.innerHTML = `
      <div class="w-100 d-flex justify-content-center align-items-center py-4 mb-3">
        <div class="d-flex flex-column align-items-center position-relative nav-action-container">
          <button id="resetGalleryBtn" class="btn-back-circle shadow-sm" title="Back to Top">
            <i class="fas fa-arrow-up"></i>
          </button>
          <span class="navbar-static-label custom-tooltip" style="bottom: -32px">Back to Top</span>
        </div>
      </div>
    `;

    const resetBtn = document.getElementById("resetGalleryBtn");
    if (resetBtn) {
      resetBtn.onclick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => refreshGallery(currentGalleryData, 1), 400);
      };
    }
    return;
  }

  // Show the loading spinner at the bottom
  sentinelContainer.innerHTML = `
    <div class="w-100 text-center py-4 mt-5">
      <div class="spinner-border" style="color: #0399b0; border-width: 0.25em" role="status"></div>
    </div>
  `;

  // Create the tripwire
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        // We hit the bottom! Stop observing, increment page, and load more.
        observer?.disconnect();
        currentPage++;

        // A tiny 300ms delay so the user actually sees the spinner before images pop in
        setTimeout(() => {
          refreshGallery(currentGalleryData, currentPage);
        }, 300);
      }
    },
    { rootMargin: "200px" }, // Trigger the load slightly BEFORE they hit absolute bottom
  );

  observer.observe(sentinelContainer);
}

export function goToGallery(isReturning = false) {
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

  const footer = document.querySelector("footer.footer") as HTMLElement;
  const copyright = document.querySelector(".copyright") as HTMLElement;
  if (footer) footer.style.display = "block";
  if (copyright) copyright.style.display = "block";

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

  // 4. Restore scroll if returning, otherwise wipe the slate clean!
  if (isReturning) {
    // We use a tiny 10ms timeout to let the browser render the gallery block first before jumping
    setTimeout(() => {
      window.scrollTo({ top: savedScrollPosition, behavior: "instant" });
    }, 10);
  } else {
    window.scrollTo(0, 0);
    // Refresh the grid and apply filters ONLY on a fresh gallery load
    if (typeof (window as any).applyAllFilters === "function") {
      (window as any).applyAllFilters();
    }
  }
}
