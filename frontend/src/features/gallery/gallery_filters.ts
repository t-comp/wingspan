// src/features/gallery/gallery_filters.ts

import { ButterflyAPI } from "../../core/api.js";
import { AppState } from "../../core/state.js";
import Fuse from "fuse.js";
import noImagePlaceholder from "../../../assets/img/noimage.jpg";

export async function initGalleryFilters(
  refreshGalleryCallback: (data: any[], page: number) => void,
) {
  const searchInput = document.getElementById(
    "searchInput",
  ) as HTMLInputElement | null;
  const searchDropdown = document.getElementById("searchAutocompleteDropdown");
  const nameToggleBtn = document.getElementById("nameToggleBtn");

  // 1. Initialize Fuse.js with TIGHTER thresholds and Score Tracking
  let fuse = new Fuse(AppState.butterflies, {
    keys: ["name", "scientificName"],
    threshold: 0.2, // Tighter threshold to prevent bad matches
    ignoreLocation: true,
    includeScore: true, // CRITICAL: We need the score to sort by relevance!
  });

  function applyAllFilters() {
    // 2. ALWAYS sync Fuse with the latest database state so newly uploaded species appear!
    fuse.setCollection(AppState.butterflies);

    const checkedOrders = Array.from(
      document.querySelectorAll("#filterOrderContainer input:checked"),
    ).map((cb) => (cb as HTMLInputElement).value);

    const checkedFamilies = Array.from(
      document.querySelectorAll("#filterFamilyContainer input:checked"),
    ).map((cb) => (cb as HTMLInputElement).value);

    const orderTextElem = document.getElementById("orderBtnText");
    if (orderTextElem) {
      orderTextElem.innerText =
        checkedOrders.length > 0
          ? `${checkedOrders.length} Selected`
          : "All Orders";
    }

    const familyTextElem = document.getElementById("familyBtnText");
    if (familyTextElem) {
      familyTextElem.innerText =
        checkedFamilies.length > 0
          ? `${checkedFamilies.length} Selected`
          : "All Families";
    }

    const query = searchInput ? searchInput.value.trim() : "";
    let filtered = AppState.butterflies;

    if (checkedOrders.length > 0) {
      filtered = filtered.filter((b: any) =>
        checkedOrders.includes(b.orderName),
      );
    }

    if (checkedFamilies.length > 0) {
      filtered = filtered.filter((b: any) =>
        checkedFamilies.includes(b.family),
      );
    }

    // 3. Filter AND Sort by Relevance Score
    if (query) {
      const results = fuse.search(query);
      const matchedIds = new Set(results.map((r) => r.item.id));
      filtered = filtered.filter((b: any) => matchedIds.has(b.id));

      const scoreMap = new Map();
      results.forEach((r, index) => scoreMap.set(r.item.id, index));
      filtered.sort(
        (a: any, b: any) => scoreMap.get(a.id) - scoreMap.get(b.id),
      );
    } else {
      // If search is empty, fallback to alphabetical
      filtered.sort((a: any, b: any) => {
        const nameA =
          AppState.currentDisplayMode === "scientific" && a.scientificName
            ? a.scientificName
            : a.name;
        const nameB =
          AppState.currentDisplayMode === "scientific" && b.scientificName
            ? b.scientificName
            : b.name;
        return (nameA || "")
          .toLowerCase()
          .localeCompare((nameB || "").toLowerCase());
      });
    }

    AppState.currentFilteredData = filtered;
    refreshGalleryCallback(AppState.currentFilteredData, 1);
  }

  (window as any).applyAllFilters = applyAllFilters;

  try {
    const options = await ButterflyAPI.getFilterOptions();
    const orderContainer = document.getElementById("filterOrderContainer");
    const familyContainer = document.getElementById("filterFamilyContainer");

    const populateCheckboxes = (
      container: HTMLElement | null,
      items: string[],
      type: string,
    ) => {
      if (!container || !items) return;
      container.innerHTML = "";
      items.forEach((item, index) => {
        if (item) {
          const id = `cb-${type}-${index}`;
          container.innerHTML += `
              <div class="form-check filter-item mb-2 ms-2 mt-1">
                  <input class="form-check-input filter-checkbox" type="checkbox" value="${item}" id="${id}">
                  <label class="form-check-label w-100 user-select-none" for="${id}" style="cursor: pointer; font-size: 0.9rem;">
                      ${item}
                  </label>
              </div>
          `;
        }
      });
    };

    const uniqueOrders = [...new Set(options.orders)].filter(
      Boolean,
    ) as string[];
    const uniqueFamilies = [...new Set(options.families)].filter(
      Boolean,
    ) as string[];

    populateCheckboxes(orderContainer, uniqueOrders, "order");
    populateCheckboxes(familyContainer, uniqueFamilies, "family");

    document.querySelectorAll(".filter-checkbox").forEach((cb) => {
      cb.addEventListener("change", applyAllFilters);
    });

    const setupSearch = (inputId: string, containerId: string) => {
      const searchBox = document.getElementById(inputId);
      if (searchBox) {
        searchBox.addEventListener("input", (e) => {
          const term = (e.target as HTMLInputElement).value.toLowerCase();
          const items = document.querySelectorAll(
            `#${containerId} .filter-item`,
          );
          items.forEach((item) => {
            const label = (
              item.querySelector("label") as HTMLLabelElement
            ).innerText.toLowerCase();
            (item as HTMLElement).style.display = label.includes(term)
              ? "block"
              : "none";
          });
        });
      }
    };

    setupSearch("searchOrder", "filterOrderContainer");
    setupSearch("searchFamily", "filterFamilyContainer");
  } catch (err) {
    console.error("Could not load filter options:", err);
  }

  // Search Input Listener for Dropdown Suggestions ONLY
  if (searchInput && searchDropdown) {
    const searchContainer = searchInput.closest(
      ".search-pill-container",
    ) as HTMLElement;

    // CSS Helper Functions
    const closeDropdown = () => {
      searchDropdown.classList.remove("show-dropdown");
      if (searchContainer) searchContainer.classList.remove("search-active");
    };

    const openDropdown = () => {
      searchDropdown.classList.add("show-dropdown");
      if (searchContainer) searchContainer.classList.add("search-active");
    };

    searchInput.addEventListener("input", (e) => {
      // 4. Update Fuse collection in real-time as they type
      fuse.setCollection(AppState.butterflies);
      const query = (e.target as HTMLInputElement).value.trim();

      if (!query) {
        closeDropdown();
        return;
      }

      const results = fuse.search(query);

      if (results.length > 0) {
        searchDropdown.innerHTML = "";

        results.slice(0, 5).forEach((res: any) => {
          const b = res.item;

          let primaryName, secondaryName;
          if (AppState.currentDisplayMode === "scientific") {
            primaryName = b.scientificName || b.name;
            secondaryName = b.scientificName && b.name ? b.name : "";
          } else {
            primaryName = b.name || b.scientificName;
            secondaryName = b.name && b.scientificName ? b.scientificName : "";
          }

          // Automatically grab the thumbnail, or default to the placeholder
          const thumbUrl =
            b.thumbnailUrl ||
            b.imageUrl ||
            b.url ||
            b.mediumUrl ||
            noImagePlaceholder;

          const li = document.createElement("li");

          li.innerHTML = `
            <a class="dropdown-item d-flex align-items-center py-2 px-3" href="#" style="cursor: pointer;">
              <img src="${thumbUrl}" class="rounded shadow-sm me-3" style="width: 36px; height: 36px; object-fit: cover; border: 1px solid #eaeaea;" alt="Thumb">
              
              <span class="fw-bold search-main-text">${primaryName}</span>
              
              ${secondaryName ? `<span class="search-sub-text ms-2">| ${secondaryName}</span>` : ""}
            </a>`;

          li.addEventListener("click", (evt) => {
            evt.preventDefault();
            searchInput.value = primaryName;
            closeDropdown();
            applyAllFilters();
          });

          searchDropdown.appendChild(li);
        });

        openDropdown();
      } else {
        searchDropdown.innerHTML = `<li class="px-3 py-2 text-muted small">No species found for "${query}"</li>`;
        openDropdown();
      }
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        closeDropdown();
        applyAllFilters();
      }
    });

    document.addEventListener("click", (e) => {
      if (
        !searchInput.contains(e.target as Node) &&
        !searchDropdown.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    });
  }

  if (nameToggleBtn) {
    nameToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (AppState.currentDisplayMode === "common") {
        AppState.currentDisplayMode = "scientific";
        if (searchInput)
          searchInput.placeholder = "Search by scientific name...";
        nameToggleBtn.innerHTML = `<i class="fas fa-exchange-alt me-2 text-muted"></i><span>Switch to Common</span>`;
      } else {
        AppState.currentDisplayMode = "common";
        if (searchInput) searchInput.placeholder = "Search by common name...";
        nameToggleBtn.innerHTML = `<i class="fas fa-exchange-alt me-2 text-muted"></i><span>Switch to Scientific</span>`;
      }
      applyAllFilters();
    });
  }

  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".filter-checkbox").forEach((cb) => {
        (cb as HTMLInputElement).checked = false;
      });

      const searchOrder = document.getElementById(
        "searchOrder",
      ) as HTMLInputElement;
      const searchFamily = document.getElementById(
        "searchFamily",
      ) as HTMLInputElement;
      if (searchOrder) searchOrder.value = "";
      if (searchFamily) searchFamily.value = "";

      document.querySelectorAll(".filter-item").forEach((item) => {
        (item as HTMLElement).style.display = "block";
      });

      if (searchInput) {
        searchInput.value = "";
        if (searchDropdown) {
          searchDropdown.classList.remove("show-dropdown");
          const searchContainer = searchInput.closest(
            ".search-pill-container",
          ) as HTMLElement;
          if (searchContainer)
            searchContainer.classList.remove("search-active");
        }
      }
      applyAllFilters();
    });
  }
}
