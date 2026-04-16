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
  const editWrapper = document.getElementById("editBtnWrapper");
  const saveWrapper = document.getElementById("saveBtnWrapper");

  if (!editBtn || !saveBtn || !notesDisplay || !tagsDisplay || !notesInput)
    return;

  if (AppState.userRole === "ADMIN") {
    editBtn.classList.remove("d-none");
    editWrapper?.classList.remove("d-none");
  } else {
    editBtn.classList.add("d-none");
    editWrapper?.classList.add("d-none");
  }

  saveBtn.classList.add("d-none");
  notesDisplay.classList.remove("d-none");
  notesInput.classList.add("d-none");
  tagsDisplay.classList.remove("d-none");
  saveWrapper?.classList.add("d-none");

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

  const downloadContainer = document.getElementById("imageDownloadOptions");
  if (downloadContainer) downloadContainer.innerHTML = "";

  const setupDownloadRow = async (label: string, urlKey: string) => {
    // 1. Check if the backend actually generated this size
    const targetUrl = img[urlKey];
    if (!targetUrl && urlKey !== "originalUrl") return;

    const finalUrl = targetUrl || img.url || img.originalUrl;

    // 2. Build the UI Row with the exact Wingspan Teal color
    const row = document.createElement("div");
    row.className =
      "d-flex justify-content-between align-items-center p-3 border rounded shadow-sm bg-light";

    row.innerHTML = `
      <div>
        <h6 class="mb-1 fw-bold text-dark">${label} Size</h6>
        <div class="small text-muted" id="meta-${urlKey}">
          <i class="fas fa-spinner fa-spin"></i> Loading details...
        </div>
      </div>
      <div class="action-tooltip-container">
        <button class="btn-icon-only copy-btn d-flex justify-content-center align-items-center" 
                id="btn-${urlKey}" 
                style="width: 36px; height: 36px; border-radius: 50%; color: #0399b0 !important;">
          <i class="fas fa-link"></i>
        </button>
        <span class="action-tooltip" id="tooltip-${urlKey}" 
              style="top: 100%; bottom: auto; margin-top: 8px; right: 0; left: auto; transform: none; white-space: nowrap;">
          Copy Link
        </span>
      </div>
    `;

    if (downloadContainer) downloadContainer.appendChild(row);

    // 3. Figure out the File Size Text
    let sizeText = ""; // Default to blank for the smaller images

    // If it is the original image, calculate the MB from the database size!
    if (urlKey === "originalUrl" && img.size && img.size !== "Unknown") {
      const byteNum = parseInt(String(img.size).replace(/\D/g, ""));
      if (!isNaN(byteNum)) {
        sizeText = `<span class="fw-bold text-dark">${(byteNum / (1024 * 1024)).toFixed(2)} MB</span> &nbsp;•&nbsp; `;
      }
    }

    // 4. Measure pixel dimensions in the background
    const measureImg = new Image();

    measureImg.onload = () => {
      const dimText = `${measureImg.naturalWidth}x${measureImg.naturalHeight}px`;
      const meta = document.getElementById(`meta-${urlKey}`);
      // Combine the sizeText (which is only set for Original) and the pixel dimensions!
      if (meta) meta.innerHTML = `${sizeText}${dimText}`;
    };

    measureImg.onerror = () => {
      const meta = document.getElementById(`meta-${urlKey}`);
      if (meta) meta.innerHTML = `${sizeText}Dimensions unavailable`;
    };

    measureImg.src = finalUrl;

    // 5. Wire up the Copy Action
    const btn = document.getElementById(`btn-${urlKey}`);
    if (btn) {
      btn.onclick = () => {
        let clipboardUrl = finalUrl;
        if (AppState.studentApiKey) {
          const separator = clipboardUrl.includes("?") ? "&" : "?";
          clipboardUrl += `${separator}apiKey=${AppState.studentApiKey}`;
        }
        navigator.clipboard.writeText(clipboardUrl);

        // Change icon to checkmark and turn it green!
        btn.innerHTML = `<i class="fas fa-check"></i>`;
        btn.style.color = "#198754"; // Bootstrap success green
        const tooltip = document.getElementById(`tooltip-${urlKey}`);
        if (tooltip) tooltip.innerText = "Copied!";

        // Revert everything back after 2 seconds
        setTimeout(() => {
          if (btn) {
            btn.innerHTML = `<i class="fas fa-link"></i>`;
            btn.style.setProperty("color", "#0399b0", "important");
          }
          if (tooltip) tooltip.innerText = "Copy Link";
        }, 2000);
      };
    }
  };

  // Build the rows in order from largest to smallest!
  setupDownloadRow("Original", "originalUrl");
  setupDownloadRow("Large", "largeUrl");
  setupDownloadRow("Medium", "mediumUrl");
  setupDownloadRow("Small", "smallUrl");

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
    document.getElementById("editBtnWrapper")?.classList.add("d-none");
    document.getElementById("saveBtnWrapper")?.classList.remove("d-none");

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

      // Call the refresh function to update the main gallery in the background
      await reloadSpeciesCallback();

      // --- INSTEAD OF CLOSING THE MODAL, WE JUST REVERT THE UI TO VIEW MODE ---

      // 1. Swap the footer buttons back
      document.getElementById("saveBtnWrapper")?.classList.add("d-none");
      document.getElementById("editBtnWrapper")?.classList.remove("d-none");

      // 2. Swap Notes back to plain text
      const notesDisplay = document.getElementById("modalNotes");
      if (notesDisplay) {
        notesDisplay.innerText = updatedNotes || "No notes available.";
        notesDisplay.classList.remove("d-none");
      }
      if (editInput) editInput.classList.add("d-none");

      // 3. Swap Tags back to blue pills
      const tagsDisplay = document.getElementById("modalTags");
      const editTagsContainer = document.getElementById("editTagsContainer");

      if (tagsDisplay) {
        tagsDisplay.innerHTML = "";
        if (selectedCheckboxes.length > 0) {
          selectedCheckboxes.forEach((cb) => {
            const labelText = cb.nextElementSibling?.textContent || "Tag";
            const span = document.createElement("span");
            span.className =
              "badge rounded-pill border border-info text-dark me-1 px-2 py-1";
            span.innerText = labelText;
            tagsDisplay.appendChild(span);
          });
        } else {
          tagsDisplay.innerHTML =
            '<span class="text-muted small">No tags assigned.</span>';
        }
        tagsDisplay.classList.remove("d-none");
      }
      if (editTagsContainer) editTagsContainer.classList.add("d-none");

      // 4. Update the local image object so if they click edit again right now, it remembers!
      img.nathansNotes = updatedNotes;
      img.tags = Array.from(selectedCheckboxes).map((cb) => ({
        id: (cb as HTMLInputElement).value,
        tagName: cb.nextElementSibling?.textContent || "Tag",
      }));
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("Error saving: " + err.message);
    }
  };
}
