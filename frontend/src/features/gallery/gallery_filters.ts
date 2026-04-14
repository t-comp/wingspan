// src/features/gallery/gallery_filters.ts

import { ButterflyAPI } from "../../core/api.js";
import { AppState } from "../../core/state.js";

export async function initGalleryFilters(
  refreshGalleryCallback: (data: any[], page: number) => void,
) {
  const searchInput = document.getElementById(
    "searchInput",
  ) as HTMLInputElement | null;
  const nameToggleBtn = document.getElementById("nameToggleBtn");

  async function applyAllFilters() {
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

    const query = searchInput ? searchInput.value.toLowerCase() : "";
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

    if (query) {
      filtered = filtered.filter((b: any) => {
        if (AppState.currentDisplayMode === "scientific") {
          return (b.scientificName || "").toLowerCase().includes(query);
        }
        return (b.name || "").toLowerCase().includes(query);
      });
    }

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

    // Save the new filtered list to state so pagination can use it!
    AppState.currentFilteredData = filtered;

    // Tell the UI to render page 1 of the new data
    refreshGalleryCallback(AppState.currentFilteredData, 1);
  }

  // We expose this so other files (like the upload wizard) can force a gallery refresh
  (window as any).applyAllFilters = applyAllFilters;

  // Initialize the Dropdowns
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

    // Listeners for checkboxes
    document.querySelectorAll(".filter-checkbox").forEach((cb) => {
      cb.addEventListener("change", applyAllFilters);
    });

    // Listeners for the tiny search bars INSIDE the dropdowns
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

  // Listener for the main top search bar
  if (searchInput) {
    searchInput.addEventListener("input", applyAllFilters);
  }

  // Listener for the Scientific/Common name toggle in the settings menu
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

  // Run immediately on boot to load the default grid
  applyAllFilters();
}
