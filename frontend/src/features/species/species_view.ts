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

const backBtn =
  document.querySelector('[onclick*="speciesView"]') ||
  document.getElementById("backToGalleryBtn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    if ((window as any).galleryNeedsRefresh) {
      (window as any).galleryNeedsRefresh = false;

      if (typeof (window as any).applyAllFilters === "function") {
        (window as any).applyAllFilters();
      }
    }
  });
}

export async function showSpeciesView(b: any) {
  //Tracker to remember exactly which image you are looking at!
  let currentActiveImageId: number | null = null;

  const portfolio = document.getElementById("portfolio");
  const speciesView = document.getElementById("speciesView");
  const teamView = document.getElementById("teamView");
  const topSearchBarContainer = document.getElementById(
    "topSearchBarContainer",
  );
  const filterPanel = document.getElementById("filterPanel");
  const galleryControls = document.getElementById("galleryControlsWrapper");

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

  const footer = document.querySelector("footer.footer") as HTMLElement;
  const copyright = document.querySelector(".copyright") as HTMLElement;
  if (footer) footer.style.display = "block";
  if (copyright) copyright.style.display = "block";

  window.scrollTo({ top: 0, behavior: "instant" });

  if (topSearchBarContainer) topSearchBarContainer.style.display = "none";
  if (filterPanel) {
    filterPanel.style.display = "none";
    filterPanel.classList.remove("show");
  }

  // Update State!
  AppState.currentSpeciesId = b.id;
  const isAdmin = AppState.userRole === "ADMIN";
  UI.populateSpeciesView(b, isAdmin);

  // Render the attributes for the "View" mode

  const customAttrContainer = document.getElementById(
    "customAttributesDisplay",
  );
  if (customAttrContainer) {
    customAttrContainer.innerHTML = ""; // Clear old ones

    if (b.attributeDef && Object.keys(b.attributeDef).length > 0) {
      let html = "";
      Object.entries(b.attributeDef).forEach(([key, value]) => {
        if (value && String(value).trim() !== "") {
          html += `
                <div class="row mb-2">
                    <div class="col-4 fw-bold" style="color: #0399b0">${key}:</div>
                    <div class="col-8 text-muted">${value}</div>
                </div>`;
        }
      });
      customAttrContainer.innerHTML = html;
    }
  }

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

      // 1. Set Standard Fields
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

      (
        document.getElementById("editSpeciesDescription") as HTMLTextAreaElement
      ).value = b.description || "";

      AppState.allAttributeKeys.forEach((key) => {
        const value =
          b.attributeDef && b.attributeDef[key] ? b.attributeDef[key] : "";

        addDynamicField(key, String(value));
      });
    };
  }

  const setMainImage = (img: any) => {
    // Update the tracker so the gallery grid knows we are looking at this specific image!
    currentActiveImageId = img.id;

    const url = img.url || noImagePlaceholder;
    const speciesImg = document.getElementById(
      "speciesImage",
    ) as HTMLImageElement | null;
    if (speciesImg) speciesImg.src = url;

    // --- ADMIN PILL & ICON CONTROLS ---
    const adminPill = document.getElementById("adminControlsPill");
    const thumbBtn = document.getElementById("setAsThumbnailBtn");
    const featureBtn = document.getElementById("featureMainImageBtn");
    const deleteMainImgBtn = document.getElementById("deleteMainImageBtn");
    const isAdmin = AppState.userRole === "ADMIN";

    if (adminPill) {
      // Target the parent wrappers so we can completely remove them from the flex layout!
      const thumbWrapper = thumbBtn?.parentElement;
      const featureWrapper = featureBtn?.parentElement;
      const deleteWrapper = deleteMainImgBtn?.parentElement;

      if (isAdmin) {
        // Show everything for Admins
        adminPill.classList.remove("d-none");
        adminPill.style.padding = ""; // Reset to default pill padding

        if (thumbWrapper) thumbWrapper.classList.remove("d-none");
        if (deleteWrapper) deleteWrapper.classList.remove("d-none");

        if (featureWrapper) {
          featureWrapper.classList.remove("d-none");
        }
        if (featureBtn) {
          featureBtn.style.pointerEvents = "auto";
          const featureTooltip = featureBtn.nextElementSibling as HTMLElement;
          if (featureTooltip) featureTooltip.classList.remove("d-none");
        }
      } else {
        // STUDENT VIEW LOGIC
        if (img.isFeatured) {
          // Show the pill, but ONLY with the static white star
          adminPill.classList.remove("d-none");

          // Make the pill padding perfectly even for a single icon
          adminPill.style.padding = "8px 10px";

          // Completely hide the other wrappers so they don't take up empty space
          if (thumbWrapper) thumbWrapper.classList.add("d-none");
          if (deleteWrapper) deleteWrapper.classList.add("d-none");

          if (featureWrapper) featureWrapper.classList.remove("d-none");

          if (featureBtn) {
            featureBtn.innerHTML = `<i class="fas fa-star fs-5 text-white"></i>`;
            featureBtn.style.pointerEvents = "none"; // Makes it unclickable

            // Hide the hover tooltip for students
            const featureTooltip = featureBtn.nextElementSibling as HTMLElement;
            if (featureTooltip) featureTooltip.classList.add("d-none");
          }
        } else {
          // Hide completely if not favorited
          adminPill.classList.add("d-none");
        }
      }
    }

    // Keep your existing 'if (isAdmin && thumbBtn && featureBtn) { ...' block exactly as it is right below this!

    // Keep your existing 'if (isAdmin && thumbBtn && featureBtn) { ...' block right here!

    if (isAdmin && thumbBtn && featureBtn) {
      const filledCheck = `<i class="fas fa-check-circle fs-5"></i>`;
      const outlineCheck = `<i class="far fa-check-circle fs-5"></i>`;

      // 1. SYNC THUMBNAIL STATE
      const isCurrentThumb = b.thumbnailUrl === img.mediumUrl;

      if (isCurrentThumb) {
        thumbBtn.innerHTML = filledCheck;
        thumbBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
        };
      } else {
        thumbBtn.innerHTML = outlineCheck;
        thumbBtn.onclick = async (e) => {
          e.stopPropagation();
          e.preventDefault();
          try {
            await ButterflyAPI.setThumbnail(b.id, img.id);
            b.thumbnailUrl = img.mediumUrl; // Sync local state
            (window as any).galleryNeedsRefresh = true;

            setMainImage(img); // Redraw main image checkmark

            // Force the gallery grid below to re-render so the checkmark updates instantly!
            const activePills = document.querySelectorAll(
              "#filterTagCloud .filter-pill.active",
            );
            const selectedIds = Array.from(activePills).map(
              (p) => p.getAttribute("data-tag") as string,
            );
            renderInnerGrid(selectedIds.length === 0 ? "all" : selectedIds);
          } catch (err: any) {
            console.error("Thumbnail update failed", err);
            alert("Thumbnail update failed: " + err.message);
          }
        };
      }

      // 2. SYNC FEATURE/STAR STATE
      const isFeatured = img.isFeatured;

      // Filled star if featured, outline star if not
      featureBtn.innerHTML = isFeatured
        ? `<i class="fas fa-star fs-5"></i>`
        : `<i class="far fa-star fs-5"></i>`;

      featureBtn.onclick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        try {
          if (isFeatured) await ButterflyAPI.unsetFeaturedImage(img.id);
          else await ButterflyAPI.setFeaturedImage(img.id);

          // Sync local state instantly without a full page refresh
          img.isFeatured = !isFeatured;
          setMainImage(img); // Redraw the main image icons!

          // Force the gallery grid below to re-render so the yellow star updates there instantly too!
          const activePills = document.querySelectorAll(
            "#filterTagCloud .filter-pill.active",
          );
          const selectedIds = Array.from(activePills).map(
            (p) => p.getAttribute("data-tag") as string,
          );
          renderInnerGrid(selectedIds.length === 0 ? "all" : selectedIds);
        } catch (err: any) {
          console.error("Feature toggle failed", err);
          alert("Feature toggle failed: " + err.message);
        }
      };

      // 3. DELETE IMAGE LOGIC
      if (deleteMainImgBtn) {
        deleteMainImgBtn.onclick = async (e) => {
          e.stopPropagation();
          e.preventDefault();
          (window as any).handleDeleteSingleImage(img.id);
        };
      }
    }

    // --- HERO TAGS ---
    const heroTagContainer = document.getElementById("heroImageTags");

    if (heroTagContainer) {
      heroTagContainer.innerHTML = "";

      if (img.tags && img.tags.length > 0) {
        img.tags.forEach((tag: any) => {
          const tagName = tag.tagName || tag.name;

          const span = document.createElement("span");

          span.className = "badge rounded-pill px-3 py-2 shadow-sm";
          span.style.backgroundColor = "#e0f2f4";
          span.style.color = "#0399b0";
          span.style.border = "1px solid #0399b0";
          span.style.fontSize = "0.75rem";

          span.innerText = tagName;

          heroTagContainer.appendChild(span);
        });
      }
    }

    // --- IMAGE DETAILS & TEXT FIELDS ---
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
    fetchedImages = await ButterflyAPI.getImagesBySpecies(b.scientificName);
    console.log("1. RAW BACKEND DATA:", fetchedImages);
  } catch (err) {
    console.error("Could not load images for species:", err);
  }

  const allImgs = fetchedImages.map((img: any) => {
    const noteFromBackend =
      img.nathansNotes || img.nathan_notes || img.notes || "";
    return {
      id: img.id,
      url: img.mediumUrl || img.fpath || img.displayUrl,

      originalUrl: img.originalUrl,
      largeUrl: img.largeUrl,
      mediumUrl: img.mediumUrl || img.fpath || img.displayUrl,
      smallUrl: img.smallUrl,

      // catch capitalization, AND reconstruct the old URL for un-migrated images!
      xSmallUrl:
        img.xsmallUrl ||
        img.XSmallUrl ||
        img.xSmallUrl ||
        (img.originalUrl
          ? img.originalUrl.replace("_original", "_thumbnail")
          : null),
      // -----------------------------------

      isFeatured: img.isFeatured === true,
      size: img.fileSize ? img.fileSize + " bytes" : "Unknown",
      lifecycle: img.lifecycle || "Unknown",
      nathansNotes: noteFromBackend,
      tags: img.tags || [],
    };
  });

  const gridContainer = document.getElementById("speciesImages");

  const sortImagesByFeatured = (images: any[]) => {
    return [...images].sort((imgA, imgB) => {
      // 1. Absolute Priority: Is it the designated species thumbnail?
      // (We use imgA and imgB to avoid confusing the code with the 'b' species object)
      const aIsThumb = imgA.mediumUrl === b.thumbnailUrl;
      const bIsThumb = imgB.mediumUrl === b.thumbnailUrl;

      if (aIsThumb && !bIsThumb) return -1; // Move imgA to the front
      if (!aIsThumb && bIsThumb) return 1; // Move imgB to the front

      // 2. Secondary Priority: Is it a favorited (featured) image?
      if (imgA.isFeatured && !imgB.isFeatured) return -1;
      if (!imgA.isFeatured && imgB.isFeatured) return 1;

      // 3. Fallback: Sort by ID so the order stays consistent
      return imgA.id - imgB.id;
    });
  };

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

    // INTERCEPT AND SORT HERE
    const sortedFilteredImages = sortImagesByFeatured(filtered);

    // Update the length check to use our new sorted array
    if (sortedFilteredImages.length === 0) {
      gridContainer.innerHTML =
        '<p class="text-muted p-3">No images match this filter.</p>';
      return;
    }

    // 'filtered.forEach' TO 'sortedFilteredImages.forEach'
    sortedFilteredImages.forEach((imgObj: any) => {
      const col = document.createElement("div");
      col.className = "col-4 mb-2 gallery-thumb-wrapper position-relative";
      col.innerHTML = `
        <div class="ratio ratio-1x1 shadow-sm rounded overflow-hidden">
              <img src="${imgObj.url || noImagePlaceholder}"
                  draggable="false"
                  style="width:100%; height:100%; object-fit:cover; cursor:pointer;">
          </div>
          
       ${
         isAdmin
           ? `
              <div class="position-absolute premium-admin-pill-nav" style="z-index: 10; top: 8px; right: 8px; padding: 4px 8px; gap: 8px; display: flex; flex-direction: row; align-items: center;">
                ${
                  imgObj.mediumUrl === b.thumbnailUrl
                    ? `<div class="d-flex align-items-center justify-content-center text-white" style="width: 20px; height: 20px;"><i class="fas fa-check-circle" style="font-size: 0.95rem;"></i></div>`
                    : ""
                }
                ${
                  imgObj.isFeatured
                    ? `<div class="d-flex align-items-center justify-content-center text-white" style="width: 20px; height: 20px;"><i class="fas fa-star" style="font-size: 0.95rem;"></i></div>`
                    : ""
                }
              <button class="btn p-0 border-0 d-flex align-items-center justify-content-center delete-single-img-btn" style="width: 20px; height: 20px;" title="Delete this image">
                  <i class="fas fa-trash-alt text-danger" style="font-size: 0.95rem;"></i>
                </button>
              </div>
          `
           : imgObj.isFeatured
             ? `
            <div class="position-absolute premium-admin-pill-nav" style="z-index: 10; top: 8px; right: 8px; padding: 4px 8px; display: flex; flex-direction: row; align-items: center; pointer-events: none;">
                <div class="d-flex align-items-center justify-content-center text-white" style="width: 20px; height: 20px;">
                    <i class="fas fa-star" style="font-size: 0.95rem;"></i>
                </div>
            </div>
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
      }

      if (gridContainer) gridContainer.appendChild(col);
    });

    // When the grid finishes building, figure out what image should be the main image!
    if (sortedFilteredImages.length > 0) {
      // Check if we are currently looking at a specific image, and if it still exists in this filter...
      const activeImg = sortedFilteredImages.find(
        (i: any) => i.id === currentActiveImageId,
      );

      // Keep displaying the current image! If it doesn't exist in the filter, fall back to the first one.
      setMainImage(activeImg ? activeImg : sortedFilteredImages[0]);
    }
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
