// src/features/species/image_details.ts

/**
 * This file handles the specific modal that appears when inspecting a single butterfly photo.
 * It manages the logic for copying image URLs at various sizes, editing the administrator notes
 * for that specific file, and attaching or removing individual tag labels.
 */

import { ButterflyAPI } from "../../core/api.js";
import { AppState } from "../../core/state.js";
import { TagManager } from "../admin/admin_tags.js";

const WINGSPAN_TEAL = "#0399b0";

export function openImageDetailsModal(
  img: any,
  reloadSpeciesCallback: () => Promise<void>,
) {
  console.log("2. MODAL RECEIVED THIS IMAGE:", img);
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
    editWrapper?.classList.remove("d-none");
  } else {
    editWrapper?.classList.add("d-none");
  }

  saveWrapper?.classList.add("d-none");
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

  const downloadContainer = document.getElementById("imageDownloadOptions");
  if (downloadContainer) downloadContainer.innerHTML = "";

  // NEW: Keep track of pixel dimensions we've already shown
  const renderedDimensions = new Set<string>();

  const setupDownloadRow = async (label: string, urlKey: string) => {
    const targetUrl = img[urlKey];

    console.log(
      `3. Building Row [${label}]: Looking for key [${urlKey}]. Found:`,
      targetUrl,
    );

    if (!targetUrl && urlKey !== "originalUrl") {
      console.log(`   -> STOPPED: No URL found for ${label}`);
      return;
    }

    const finalUrl = targetUrl || img.url || img.originalUrl;

    // Change the condition to only check against the originalUrl:
    if (urlKey !== "originalUrl" && finalUrl === img.originalUrl) {
      return;
    }

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
                style="width: 36px; height: 36px; border-radius: 50%;">
          <i class="fas fa-link" style="color: ${WINGSPAN_TEAL} !important;"></i>
        </button>
        <span class="action-tooltip" id="tooltip-${urlKey}" 
              style="top: 100%; bottom: auto; margin-top: 8px; right: 0; left: auto; transform: none; white-space: nowrap;">
          Copy Link
        </span>
      </div>
    `;

    if (downloadContainer) downloadContainer.appendChild(row);

    let sizeText = "";

    if (urlKey === "originalUrl" && img.size && img.size !== "Unknown") {
      const byteNum = parseInt(String(img.size).replace(/\D/g, ""));
      if (!isNaN(byteNum)) {
        sizeText = `<span class="fw-bold text-dark">${(byteNum / (1024 * 1024)).toFixed(2)} MB</span> &nbsp;•&nbsp; `;
      }
    }

    const measureImg = new Image();

    measureImg.onload = () => {
      // Create a string like "80x80"
      const dimKey = `${measureImg.naturalWidth}x${measureImg.naturalHeight}`;

      // NEW: If this isn't the original image, and we already rendered an image
      // with these exact dimensions, remove this row from the UI entirely!
      if (urlKey !== "originalUrl" && renderedDimensions.has(dimKey)) {
        row.remove();
        return;
      }

      // Add this dimension to our Set so future duplicates are caught
      renderedDimensions.add(dimKey);

      const dimText = `${dimKey}px`;
      const meta = document.getElementById(`meta-${urlKey}`);
      if (meta) meta.innerHTML = `${sizeText}${dimText}`;
    };

    measureImg.onerror = () => {
      const meta = document.getElementById(`meta-${urlKey}`);
      if (meta) meta.innerHTML = `${sizeText}Dimensions unavailable`;
    };

    measureImg.src = finalUrl;

    const btn = document.getElementById(`btn-${urlKey}`);
    if (btn) {
      btn.onclick = () => {
        let clipboardUrl = finalUrl;
        if (AppState.studentApiKey) {
          const separator = clipboardUrl.includes("?") ? "&" : "?";
          clipboardUrl += `${separator}apiKey=${AppState.studentApiKey}`;
        }

        console.log("=== COPY LINK CLICKED ===");

        // 1. Secure Context (HTTPS or Localhost)
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard
            .writeText(clipboardUrl)
            .then(() => console.log("Success: Copied via Clipboard API!"))
            .catch((err) => console.error("Error: Clipboard API failed:", err));
        }

        // 2. Unsecure Context (HTTP IP Address)
        else {
          console.log(
            "Status: Unsecure HTTP context detected. Using fallback method.",
          );

          // Get the modal so we can append the text box inside it!
          const modalEl =
            document.getElementById("imageDetailsModal") || document.body;

          const textArea = document.createElement("textarea");
          textArea.value = clipboardUrl;

          // Keep it hidden but physically present
          textArea.style.position = "absolute";
          textArea.style.left = "-9999px";
          textArea.style.top = "0";

          // THE FIX: Append to the modal, NOT document.body.
          // This prevents Bootstrap's focus trap from stealing focus!
          modalEl.appendChild(textArea);

          textArea.focus();
          textArea.select();
          textArea.setSelectionRange(0, 99999); // Ensure selection works universally

          try {
            const successful = document.execCommand("copy");
            if (successful) {
              console.log("Success: Fallback copy command actually worked!");
            } else {
              window.prompt(
                "Auto-copy blocked on this unsecure IP address. Press Cmd/Ctrl+C to copy:",
                clipboardUrl,
              );
            }
          } catch (err) {
            console.error("Error: ExecCommand threw an exception.", err);
            window.prompt(
              "Auto-copy blocked on this unsecure IP address. Press Cmd/Ctrl+C to copy:",
              clipboardUrl,
            );
          } finally {
            // Clean it up from the modal
            modalEl.removeChild(textArea);
          }
        }

        // Visual UI Feedback
        btn.innerHTML = `<i class="fas fa-check" style="color: #198754 !important;"></i>`;
        const tooltip = document.getElementById(`tooltip-${urlKey}`);
        if (tooltip) tooltip.innerText = "Copied!";

        setTimeout(() => {
          if (btn) {
            btn.innerHTML = `<i class="fas fa-link" style="color: ${WINGSPAN_TEAL} !important;"></i>`;
          }
          if (tooltip) tooltip.innerText = "Copy Link";
        }, 2000);
      };
    }
  };

  setupDownloadRow("Original", "originalUrl");
  setupDownloadRow("Large", "largeUrl");
  setupDownloadRow("Medium", "mediumUrl");
  setupDownloadRow("Small", "smallUrl");
  setupDownloadRow("xSmall", "xSmallUrl");

  const modalElement = document.getElementById("imageDetailsModal");
  if (modalElement) {
    // --- ARIA WARNING FIX: Remove focus when the modal closes! ---
    modalElement.addEventListener("hide.bs.modal", () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    // @ts-ignore
    let detailModal = bootstrap.Modal.getInstance(modalElement);
    // @ts-ignore
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
        });
      }
    } catch (err) {
      console.error("Edit Tag UI Error:", err);
    }
  };

  saveBtn.onclick = async () => {
    // --- ARIA FIX: Remove focus from whatever button was clicked! ---
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const id = img.id || img.imageId;
    if (!id) return alert("Error: Could not find the ID for this image.");

    const numId = Number(id);

    const editInput = document.getElementById(
      "editNotesInput",
    ) as HTMLTextAreaElement | null;

    const selectedCheckboxes = document.querySelectorAll(
      '#tagCheckboxList input[type="checkbox"]:checked',
    );

    const newTagIds = Array.from(selectedCheckboxes).map((cb) =>
      Number((cb as HTMLInputElement).value),
    );

    const oldTagIds = (img.tags || []).map((t: any) => Number(t.id || t.tagId));
    const toAdd = newTagIds.filter((tagId) => !oldTagIds.includes(tagId));
    const toRemove = oldTagIds.filter((tagId) => !newTagIds.includes(tagId));

    const modalNotesElem = document.getElementById(
      "modalNotes",
    ) as HTMLElement | null;
    const updatedNotes = editInput?.value ?? (modalNotesElem?.innerText || "");

    // ==============================================================
    // INSTANT OPTIMISTIC UI UPDATE
    // ==============================================================
    document.getElementById("saveBtnWrapper")?.classList.add("d-none");
    document.getElementById("editBtnWrapper")?.classList.remove("d-none");

    if (modalNotesElem) {
      modalNotesElem.innerText = updatedNotes || "No notes available.";
      modalNotesElem.classList.remove("d-none");
    }
    if (editInput) editInput.classList.add("d-none");

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

    img.nathansNotes = updatedNotes;
    img.tags = Array.from(selectedCheckboxes).map((cb) => ({
      id: (cb as HTMLInputElement).value,
      tagName: cb.nextElementSibling?.textContent || "Tag",
    }));

    // ==============================================================
    // BACKGROUND API CALLS
    // ==============================================================
    console.log("=== STARTING IMAGE SAVE PROCESS ===");

    // We use URLSearchParams to perfectly match Spring Boot's @RequestParam
    const params = new URLSearchParams();

    // Add our notes and lifecycle stage. These names match the backend exactly!
    params.append("nathansNotes", updatedNotes);
    params.append("life_cycle", "Adult");

    // Loop through the selected tags and append them using the plural "tagIds"
    if (newTagIds.length > 0) {
      newTagIds.forEach((tagId) => {
        params.append("tagIds", tagId.toString());
      });
    }

    console.log("Sending URL-Encoded Params to updateImageDetails...");

    try {
      // Send the params object to our newly updated API function
      await ButterflyAPI.updateImageDetails(id, params);
      console.log("Main image details (Notes & Tags) updated successfully!");

      // Fire individual tag endpoints as a safety fallback
      const tagPromises = [
        ...toAdd.map((tagId) => ButterflyAPI.addTagToImage(tagId, numId)),
        ...toRemove.map((tagId) =>
          ButterflyAPI.removeTagFromImage(tagId, numId),
        ),
      ];

      if (tagPromises.length > 0) {
        await Promise.all(tagPromises);
        console.log("Individual Tag Promises updated successfully!");
      }

      await reloadSpeciesCallback();
      console.log("=== SAVE PROCESS COMPLETE ===");
    } catch (err: any) {
      console.error("!!! BACKGROUND SAVE ERROR !!!", err);
    }
  };
}
