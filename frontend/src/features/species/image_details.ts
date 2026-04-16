// src/features/species/image_details.ts

/**
 * This file handles the specific modal that appears when inspecting a single butterfly photo.
 * It manages the logic for copying image URLs at various sizes, editing the administrator notes
 * for that specific file, and attaching or removing individual tag labels.
 */

import { ButterflyAPI } from "../../core/api.js";
import { AppState } from "../../core/state.js";
import { TagManager } from "../admin/admin_tags.js";

export function openImageDetailsModal(
  img: any,
  reloadSpeciesCallback: () => Promise<void>,
) {
  const editBtn = document.getElementById("editImageBtn");
  const saveBtn = document.getElementById("saveImageBtn");
  const notesDisplay = document.getElementById("modalNotes");
  const notesInput = document.getElementById("editNotesInput");
  const tagsDisplay = document.getElementById("modalTags");
  const editTagsContainer = document.getElementById("editTagsContainer");

  if (!editBtn || !saveBtn || !notesDisplay || !tagsDisplay || !notesInput)
    return;

  if (AppState.userRole === "ADMIN") {
    editBtn.classList.remove("d-none");
  } else {
    editBtn.classList.add("d-none");
  }

  saveBtn.classList.add("d-none");
  notesDisplay.classList.remove("d-none");
  notesInput.classList.add("d-none");
  tagsDisplay.classList.remove("d-none");
  if (editTagsContainer) editTagsContainer.classList.add("d-none");

  const sizeElem = document.getElementById("modalSize");
  if (sizeElem) sizeElem.innerText = img.size || "Unknown";

  const noteText =
    img.nathansNotes || img.nathansnotes || img.nathan_notes || img.notes || "";

  notesDisplay.innerText =
    noteText && noteText !== "undefined" ? noteText : "No notes available.";

  tagsDisplay.innerHTML = "";
  if (img.tags && img.tags.length > 0) {
    img.tags.forEach((t: any) => {
      const span = document.createElement("span");
      span.className =
        "badge rounded-pill border border-info text-dark me-1 px-2 py-1";
      span.innerText = t.tagName || t.name || t;
      tagsDisplay.appendChild(span);
    });
  } else {
    tagsDisplay.innerHTML =
      '<span class="text-muted small">No tags assigned.</span>';
  }

  setupImageEditing(img, reloadSpeciesCallback);

  // Notice we removed the hardcoded pixelText parameter!
  const setupCopyButton = (
    btnId: string,
    urlKey: string,
    sizeLabel: string,
  ) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    // Grab the specific URL from the image data
    const targetUrl = img[urlKey];

    // Hide if the backend didn't generate this size (and it's not the original)
    if (!targetUrl && urlKey !== "originalUrl") {
      btn.classList.add("d-none");
      return;
    }

    btn.classList.remove("d-none");

    // Put a cute little loading spinner on the button while we measure the image!
    btn.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i>${sizeLabel}...`;

    // The ultimate fallback path for the actual copy action
    const urlToCopy = targetUrl || img.url || img.originalUrl;

    // --- THE MAGIC FRONTEND MEASURING TAPE ---
    const measureImg = new Image();

    measureImg.onload = function () {
      // Once the image loads in the background, grab the exact dimensions!
      const exactPixels = `(${measureImg.naturalWidth}x${measureImg.naturalHeight}px)`;
      const finalButtonText = `${sizeLabel} ${exactPixels}`;

      // Update the button with the real numbers!
      btn.innerHTML = `<i class="fas fa-link me-1"></i>${finalButtonText}`;

      // Attach the click event now that we know the text
      btn.onclick = () => {
        let finalUrl = urlToCopy;

        // Always append the API key so students can load the image!
        if (AppState.studentApiKey) {
          const separator = finalUrl.includes("?") ? "&" : "?";
          finalUrl += `${separator}apiKey=${AppState.studentApiKey}`;
        }

        navigator.clipboard.writeText(finalUrl);
        btn.innerHTML = `<i class="fas fa-check me-1"></i>Copied!`;

        // Reset the button text back to normal after 2 seconds
        setTimeout(() => {
          btn.innerHTML = `<i class="fas fa-link me-1"></i>${finalButtonText}`;
        }, 2000);
      };
    };

    // If the image fails to load, just show the label without dimensions
    measureImg.onerror = function () {
      const finalButtonText = sizeLabel;
      btn.innerHTML = `<i class="fas fa-link me-1"></i>${finalButtonText}`;

      btn.onclick = () => {
        let finalUrl = urlToCopy;
        if (AppState.studentApiKey) {
          const separator = finalUrl.includes("?") ? "&" : "?";
          finalUrl += `${separator}apiKey=${AppState.studentApiKey}`;
        }
        navigator.clipboard.writeText(finalUrl);
        btn.innerHTML = `<i class="fas fa-check me-1"></i>Copied!`;
        setTimeout(() => {
          btn.innerHTML = `<i class="fas fa-link me-1"></i>${finalButtonText}`;
        }, 2000);
      };
    };

    // Trigger the background download to start measuring!
    measureImg.src = urlToCopy;
  };

  // Now you just pass the label, and the code figures out the rest!
  setupCopyButton("copyOriginalUrlBtn", "originalUrl", "Original");
  setupCopyButton("copyLargeUrlBtn", "largeUrl", "Large");
  setupCopyButton("copyMediumUrlBtn", "mediumUrl", "Medium");
  setupCopyButton("copySmallUrlBtn", "smallUrl", "Small");

  const modalElement = document.getElementById("imageDetailsModal");
  if (modalElement) {
    let detailModal = bootstrap.Modal.getInstance(modalElement);
    if (!detailModal) detailModal = new bootstrap.Modal(modalElement);
    detailModal.show();
  }
}

function setupImageEditing(
  img: any,
  reloadSpeciesCallback: () => Promise<void>,
) {
  const editBtn = document.getElementById("editImageBtn");
  const saveBtn = document.getElementById("saveImageBtn");
  const notesDisplay = document.getElementById("modalNotes");
  const tagsDisplay = document.getElementById("modalTags");
  const editTagsContainer = document.getElementById("editTagsContainer");

  if (!editBtn || !saveBtn) return;

  editBtn.onclick = async () => {
    editBtn.classList.add("d-none");
    saveBtn.classList.remove("d-none");

    const notesInput = document.getElementById(
      "editNotesInput",
    ) as HTMLTextAreaElement;
    const currentNotes =
      notesDisplay && notesDisplay.innerText === "No notes available."
        ? ""
        : notesDisplay?.innerText || "";

    if (notesDisplay) notesDisplay.classList.add("d-none");
    if (notesInput) {
      notesInput.classList.remove("d-none");
      notesInput.value = currentNotes;
    }

    if (tagsDisplay) tagsDisplay.classList.add("d-none");
    if (editTagsContainer) editTagsContainer.classList.remove("d-none");

    try {
      await TagManager.initTagContainer();
      const checkboxList = document.getElementById("tagCheckboxList");
      if (checkboxList) {
        const currentTagIds = (img.tags || []).map((t: any) =>
          String(t.tagId || t.id || t),
        );
        const allCheckboxes = Array.from(
          checkboxList.querySelectorAll('input[type="checkbox"]'),
        );

        allCheckboxes.forEach((node) => {
          const cb = node as HTMLInputElement;
          if (currentTagIds.includes(cb.value)) cb.checked = true;
          cb.classList.add("edit-tag-checkbox");
        });
      }
    } catch (err) {
      console.error("Edit Tag UI Error:", err);
    }
  };

  saveBtn.onclick = async () => {
    const id = img.id || img.imageId;
    if (!id) return alert("Error: Could not find the ID for this image.");

    const editInput = document.getElementById(
      "editNotesInput",
    ) as HTMLTextAreaElement | null;
    const selectedCheckboxes = document.querySelectorAll(
      ".edit-tag-checkbox:checked",
    );
    const newTagIds = Array.from(selectedCheckboxes).map((cb) =>
      String((cb as HTMLInputElement).value),
    );

    const oldTagIds = (img.tags || []).map((t: any) => String(t.id || t.tagId));
    const toAdd = newTagIds.filter((tagId) => !oldTagIds.includes(tagId));
    const toRemove = oldTagIds.filter((tagId) => !newTagIds.includes(tagId));

    const modalNotesElem = document.getElementById(
      "modalNotes",
    ) as HTMLElement | null;
    const updatedNotes = editInput?.value ?? (modalNotesElem?.innerText || "");

    try {
      await ButterflyAPI.updateImageDetails(id, {
        nathansNotes: updatedNotes,
        life_cycle:
          (document.getElementById("editLifecycleInput") as HTMLTextAreaElement)
            ?.value || "Adult",
      });

      const tagPromises = [
        ...toAdd.map((tagId) => ButterflyAPI.addTagToImage(tagId, id)),
        ...toRemove.map((tagId) => ButterflyAPI.removeTagFromImage(tagId, id)),
      ];

      await Promise.all(tagPromises);
      alert("Update Successful!");

      // Call the refresh function
      await reloadSpeciesCallback();

      bootstrap.Modal.getInstance(
        document.getElementById("imageDetailsModal"),
      )?.hide();
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("Error saving: " + err.message);
    }
  };
}
