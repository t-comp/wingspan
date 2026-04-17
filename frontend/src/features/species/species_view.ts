// src/features/species/species_view.ts

/**
 * This file handles the detailed view of a single butterfly species,
 * replacing the main gallery grid. It loads the hero image, populates
 * the taxonomic details, and renders the inner grid of all
 * associated photos with their specific tag filters.
 */

import { ButterflyAPI } from "../../core/api.js";
import { AppState } from "../../core/state.js";
import { UI } from "../../shared/ui.js";
import { openImageDetailsModal } from "./image_details.js";
import { addDynamicField } from "./species_editor.js";

import noImagePlaceholder from "../../../assets/img/noimage.jpg";

export function initSpeciesView() {
  // Attach the permanent listener for the Delete Species button
  const deleteSpeciesBtn = document.getElementById("deleteSpeciesFullBtn");
  if (deleteSpeciesBtn) {
    deleteSpeciesBtn.addEventListener("click", async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute(
        "data-species-id",
      );
      if (
        id &&
        confirm(
          "Are you sure you want to completely delete this species and all of its images?",
        )
      ) {
        try {
          await ButterflyAPI.delete(id);
          alert("Species deleted successfully.");
          location.reload(); // Reloads the app to clear out the deleted data
        } catch (err: any) {
          alert("Delete failed: " + err.message);
        }
      }
    });
  }
}

export async function showSpeciesView(b: any) {
  const portfolio = document.getElementById("portfolio");
  const speciesView = document.getElementById("speciesView");
  const teamView = document.getElementById("teamView");
  const topSearchBarContainer = document.getElementById(
    "topSearchBarContainer",
  );
  const filterPanel = document.getElementById("filterPanel");
  const galleryControls = document.getElementById("galleryControlsWrapper"); // Updated ID

  if (galleryControls) {
    galleryControls.classList.add("d-none");
    galleryControls.classList.remove("d-flex");
  }

  if (filterPanel) {
    filterPanel.style.display = "none";
    filterPanel.classList.remove("show");
  }

  // Toggle DOM visibility
  if (portfolio) portfolio.style.display = "none";
  if (teamView) teamView.style.display = "none";
  if (speciesView) speciesView.style.display = "block";
  window.scrollTo(0, 0);

  if (topSearchBarContainer) topSearchBarContainer.style.display = "none";
  if (filterPanel) {
    filterPanel.style.display = "none";
    filterPanel.classList.remove("show");
  }

  // Update State!
  AppState.currentSpeciesId = b.id;
  const isAdmin = AppState.userRole === "ADMIN";
  UI.populateSpeciesView(b, isAdmin);

  // Setup Admin Action Buttons
  const actionSection = document.getElementById("speciesActionButtons");
  const openUploadBtn = document.getElementById("openSpeciesUploadBtn");
  const deleteBtn = document.getElementById(
    "deleteSpeciesFullBtn",
  ) as HTMLButtonElement;

  if (actionSection && isAdmin) {
    actionSection.classList.remove("d-none");

    if (deleteBtn) deleteBtn.setAttribute("data-species-id", b.id.toString());

    if (openUploadBtn) {
      openUploadBtn.onclick = () => {
        const hiddenInput = document.getElementById(
          "speciesSelectorValue",
        ) as HTMLInputElement;
        const btnText = document.getElementById("speciesDropdownText");

        if (hiddenInput && btnText) {
          hiddenInput.value = b.id.toString();
          btnText.innerHTML = `<span class="text-dark fw-bold">${b.name}</span>`;
        }

        document.getElementById("uploadPhase1")?.classList.add("d-none");
        document.getElementById("uploadPhase2")?.classList.remove("d-none");

        const backBtn = document.getElementById("btnBackToPhase1");
        if (backBtn) backBtn.style.display = "none";

        const uploadModalEl = document.getElementById("addButterflyModal");
        if (uploadModalEl) {
          const modal = new bootstrap.Modal(uploadModalEl);
          modal.show();
        }
      };
    }
  }

  // Setup Edit Button for Custom Attributes
  const editSpeciesBtn = document.getElementById("editSpeciesBtn");
  if (editSpeciesBtn && isAdmin) {
    editSpeciesBtn.classList.remove("d-none");

    editSpeciesBtn.onclick = () => {
      const dynamicContainer = document.getElementById("dynamicSpeciesFields");
      if (dynamicContainer) dynamicContainer.innerHTML = "";

      (document.getElementById("editSpeciesId") as HTMLInputElement).value =
        b.id;
      (document.getElementById("editSpeciesName") as HTMLInputElement).value =
        b.name || "";
      (
        document.getElementById("editSpeciesScientific") as HTMLInputElement
      ).value = b.scientificName || "";
      (document.getElementById("editSpeciesOrder") as HTMLInputElement).value =
        b.orderName || "";
      (document.getElementById("editSpeciesFamily") as HTMLInputElement).value =
        b.family || "";
      (document.getElementById("editSpeciesGenus") as HTMLInputElement).value =
        b.genus || "";

      const fullDesc = b.description || "";
      const attributeRegex = /\[\[(.*?):\s*(.*?)\]\]/g;
      let match;

      while ((match = attributeRegex.exec(fullDesc)) !== null) {
        addDynamicField(match[1].trim(), match[2].trim());
      }

      (
        document.getElementById("editSpeciesDescription") as HTMLInputElement
      ).value = fullDesc.replace(/\[\[.*?\]\]/g, "").trim();
    };
  }

  const setMainImage = (img: any) => {
    const url = img.url || noImagePlaceholder;

    const speciesImg = document.getElementById(
      "speciesImage",
    ) as HTMLImageElement | null;
    if (speciesImg) speciesImg.src = url;

    const modalImg = document.getElementById(
      "butterflyModalImage",
    ) as HTMLImageElement | null;
    if (modalImg) modalImg.src = url;

    const sizeElem = document.getElementById("currentImgSize");
    if (sizeElem) sizeElem.innerText = img.size || "Unknown";

    const lifecycleElem = document.getElementById("speciesLifecycle");
    if (lifecycleElem) lifecycleElem.innerText = img.lifecycle || "Adult";

    const notesElem = document.getElementById("speciesNotes");
    if (notesElem) {
      const noteText = img.nathansNotes;
      notesElem.innerText =
        noteText && noteText.trim() !== "" ? noteText : "No notes available.";
    }

    const viewMoreBtn = document.getElementById("viewMoreDetails");
    if (viewMoreBtn) {
      viewMoreBtn.onclick = (e) => {
        e.preventDefault();
        openImageDetailsModal(img, async () => {
          const freshSpecies = await ButterflyAPI.getSpeciesById(
            AppState.currentSpeciesId,
          );
          await showSpeciesView(freshSpecies);
        });
      };
    }
  };

  let fetchedImages: any[] = [];
  try {
    fetchedImages = await ButterflyAPI.getImagesBySpecies(b.id);
  } catch (err) {
    console.error("Could not load images for species:", err);
  }

  const allImgs = fetchedImages.map((img: any) => {
    const noteFromBackend =
      img.nathansNotes || img.nathan_notes || img.notes || "";
    return {
      id: img.id,
      url: img.fpath, // We keep this for the main UI backward compatibility

      // --- NEW URL FIELDS FROM BACKEND ---
      originalUrl: img.originalUrl,
      largeUrl: img.largeUrl,
      mediumUrl: img.fpath,
      smallUrl: img.smallUrl,
      // -----------------------------------

      size: img.fileSize ? img.fileSize + " bytes" : "Unknown",
      lifecycle: img.lifecycle || "Unknown",
      nathansNotes: noteFromBackend,
      tags: img.tags || [],
    };
  });
  const gridContainer = document.getElementById("speciesImages");

  const renderInnerGrid = (selectedTags: string[] | string = "all") => {
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    const isShowingAll =
      selectedTags === "all" ||
      (Array.isArray(selectedTags) && selectedTags.includes("all")) ||
      (Array.isArray(selectedTags) && selectedTags.length === 0);

    const filtered = allImgs.filter((img) => {
      if (isShowingAll) return true;
      const imageTagIds = img.tags.map((t: any) => String(t.tagId || t.id));
      const tagsArray = Array.isArray(selectedTags)
        ? selectedTags
        : [selectedTags];
      return tagsArray.every((id) => imageTagIds.includes(String(id)));
    });

    if (filtered.length === 0) {
      gridContainer.innerHTML =
        '<p class="text-muted p-3">No images match this filter.</p>';
      return;
    }

    filtered.forEach((imgObj: any) => {
      const col = document.createElement("div");
      col.className = "col-4 mb-2 gallery-thumb-wrapper position-relative";
      col.innerHTML = `
        <div class="ratio ratio-1x1 shadow-sm rounded overflow-hidden">
              <img src="${imgObj.url || noImagePlaceholder}"
                   style="width:100%; height:100%; object-fit:cover; cursor:pointer;">
          </div>
          ${
            isAdmin
              ? `
              <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle delete-single-img-btn"
                      style="width:24px; height:24px; padding:0; font-size:10px; z-index:5; opacity:0; transition: opacity 0.2s;"
                      title="Delete this image">
                  <i class="fas fa-times"></i>
              </button>
          `
              : ""
          }
      `;

      const thumbnail = col.querySelector("img") as HTMLImageElement | null;
      if (thumbnail) {
        thumbnail.onclick = (e: MouseEvent) => {
          document
            .querySelectorAll(".gallery-thumb-wrapper img")
            .forEach((el) =>
              (el as HTMLElement).classList.remove(
                "border-primary",
                "border-3",
              ),
            );
          (e.currentTarget as HTMLElement).classList.add(
            "border-primary",
            "border-3",
          );
          setMainImage(imgObj);
        };
      }

      const deleteBtn = col.querySelector(
        ".delete-single-img-btn",
      ) as HTMLElement | null;
      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          (window as any).handleDeleteSingleImage(imgObj.id);
        };
        col.addEventListener("mouseenter", () => {
          deleteBtn.style.opacity = "0.85";
        });
        col.addEventListener("mouseleave", () => {
          deleteBtn.style.opacity = "0";
        });
      }

      if (gridContainer) gridContainer.appendChild(col);
    });
    if (filtered.length > 0) setMainImage(filtered[0]);
  };

  const renderFilterPills = () => {
    const filterBar = document.getElementById("filterTagCloud");
    if (!filterBar) return;

    const allUniqueTags = Array.from(
      new Map(
        allImgs
          .flatMap((img) => img.tags || [])
          .map((t) => [t.tagId || t.id, t]),
      ).values(),
    );
    let html = `<button class="btn btn-sm btn-primary filter-pill active" data-tag="all">All</button>`;

    allUniqueTags.forEach((tag: any) => {
      const tagName = tag.tagName || tag.name;
      const tagId = tag.tagId || tag.id;
      if (tagName) {
        html += `<button class="btn btn-sm btn-outline-secondary filter-pill" data-tag="${tagId}">${tagName}</button>`;
      }
    });
    filterBar.innerHTML = html;

    filterBar.querySelectorAll(".filter-pill").forEach((el) => {
      const btn = el as HTMLElement;
      btn.onclick = () => {
        const tagId = btn.getAttribute("data-tag");

        if (tagId === "all") {
          filterBar.querySelectorAll(".filter-pill").forEach((b) => {
            (b as HTMLElement).classList.replace(
              "btn-primary",
              "btn-outline-secondary",
            );
            (b as HTMLElement).classList.remove("active");
          });
          btn.classList.replace("btn-outline-secondary", "btn-primary");
          btn.classList.add("active");
        } else {
          btn.classList.toggle("active");
          btn.classList.toggle("btn-primary");
          btn.classList.toggle("btn-outline-secondary");

          const allBtn = filterBar.querySelector(
            '[data-tag="all"]',
          ) as HTMLElement;
          if (allBtn) {
            allBtn.classList.replace("btn-primary", "btn-outline-secondary");
            allBtn.classList.remove("active");
          }
        }

        const activePills = filterBar.querySelectorAll(".filter-pill.active");
        const selectedIds = Array.from(activePills).map(
          (p) => p.getAttribute("data-tag") as string,
        );

        if (selectedIds.length === 0) {
          const allBtn = filterBar.querySelector(
            '[data-tag="all"]',
          ) as HTMLElement;
          if (allBtn) {
            allBtn.classList.replace("btn-outline-secondary", "btn-primary");
            allBtn.classList.add("active");
          }
          renderInnerGrid("all");
        } else {
          renderInnerGrid(selectedIds);
        }
      };
    });
  };

  renderFilterPills();
  renderInnerGrid("all");
}
