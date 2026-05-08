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
  reloadSpeciesCallback: () => Promise<void>
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

  // Keep track of pixel dimensions we've already shown
  const renderedDimensions = new Set<string>();

  const setupDownloadRow = async (label: string, urlKey: string) => {
    // Safely convert to a string to catch weird backend data types
    const targetUrl = img[urlKey] ? String(img[urlKey]) : null;

    console.log(
      `3. Building Row [${label}]: Looking for key [${urlKey}]. Found:`,
      targetUrl
    );

    // Stops the row from building if the URL is missing, empty, or literally "null"
    if (
      (!targetUrl || targetUrl.trim() === "" || targetUrl === "null") &&
      urlKey !== "originalUrl"
    ) {
      console.log(`   -> STOPPED: No valid URL found for ${label}`);
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
        sizeText = `<span class="fw-bold text-dark">${(
          byteNum /
          (1024 * 1024)
        ).toFixed(2)} MB</span> &nbsp;•&nbsp; `;
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

        // Secure Context (HTTPS or Localhost)
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard
            .writeText(clipboardUrl)
            .then(() => console.log("Success: Copied via Clipboard API!"))
            .catch((err) => console.error("Error: Clipboard API failed:", err));
        }

        // 2. Unsecure Context (HTTP IP Address)
        else {
          console.log(
            "Status: Unsecure HTTP context detected. Using fallback method."
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

          // Append to the modal, NOT document.body.
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
                clipboardUrl
              );
            }
          } catch (err) {
            console.error("Error: ExecCommand threw an exception.", err);
            window.prompt(
              "Auto-copy blocked on this unsecure IP address. Press Cmd/Ctrl+C to copy:",
              clipboardUrl
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

    let detailModal = bootstrap.Modal.getInstance(modalElement);
    if (!detailModal) detailModal = new bootstrap.Modal(modalElement);
    detailModal.show();
  }
}

// function setupImageEditing(
//   img: any,
//   reloadSpeciesCallback: () => Promise<void>
// ) {
//   const editBtn = document.getElementById("editImageBtn");
//   const saveBtn = document.getElementById("saveImageBtn");
//   const notesDisplay = document.getElementById("modalNotes");
//   const tagsDisplay = document.getElementById("modalTags");
//   const editTagsContainer = document.getElementById("editTagsContainer");
//   const notesInput = document.getElementById("editNotesInput") as HTMLTextAreaElement;

//   if (!editBtn || !saveBtn) return;

//   // 1. CLEAN UP: Use one clear listener for the Manage Tags button
//   // We use delegation because the button is inside the editTagsContainer
//   editTagsContainer?.addEventListener("click", async (e) => {
//     const target = e.target as HTMLElement;
//     if (target.closest("#openTagPickerBtn")) {
//       e.preventDefault();
//       e.stopPropagation();

//       console.log("MANAGE TAGS CLICKED - LOADING FOR IMAGE:", img.id);

//       const modalEl = document.getElementById("tagPickerModal");
//       if (!modalEl) return console.error("tagPickerModal not found");

//       try {
//         // IMPORTANT: Force the TagManager to render everything
//         // If your TagManager requires a species ID, pass it here: 
//         // await TagManager.renderFullTagPicker(img.speciesId);
//         await TagManager.initTagContainer(); 

//         // Double check: if it's still empty, try the direct render method
//         if (typeof (TagManager as any).renderFullTagPicker === 'function') {
//            await (TagManager as any).renderFullTagPicker();
//         }

//         const currentTagIds = (img.tags || []).map((t: any) => String(t.tagId || t.id));
//         const allCheckboxes = modalEl.querySelectorAll('input[name="tagIds"]') as NodeListOf<HTMLInputElement>;

//         allCheckboxes.forEach((cb) => {
//           cb.checked = currentTagIds.includes(cb.value);
//         });

//         // Update preview badges when they finish picking
//         modalEl.addEventListener('hidden.bs.modal', () => {
//             const selected = modalEl.querySelectorAll('input[name="tagIds"]:checked');
//             const tempTags = Array.from(selected).map(cb => ({
//                 id: (cb as HTMLInputElement).value,
//                 tagName: cb.nextElementSibling?.textContent || "Tag"
//             }));
//             renderEditPreview(tempTags);
//         }, { once: true });

//         const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
//         modalInstance.show();
//       } catch (err) {
//         console.error("Failed to load tags into modal:", err);
//       }
//     }
//   });

//   editBtn.onclick = async () => {
//     document.getElementById("editBtnWrapper")?.classList.add("d-none");
//     document.getElementById("saveBtnWrapper")?.classList.remove("d-none");

//     if (notesDisplay) notesDisplay.classList.add("d-none");
//     if (notesInput) {
//       notesInput.classList.remove("d-none");
//       notesInput.value = notesDisplay?.innerText === "No notes available." ? "" : notesDisplay?.innerText || "";
//     }

//     if (tagsDisplay) tagsDisplay.classList.add("d-none");
//     if (editTagsContainer) {
//       editTagsContainer.classList.remove("d-none");
//       renderEditPreview(img.tags || []);
//     }
//   };

//   function renderEditPreview(tags: any[]) {
//     const preview = document.getElementById("editTagsPreview");
//     if (!preview) return;
//     preview.innerHTML = tags.map(t => `
//         <span class="badge rounded-pill bg-light text-dark border border-info px-2 py-1" style="font-size:0.7rem;">
//             ${t.tagName || t.name || t}
//         </span>
//     `).join("");
//   }

//   saveBtn.onclick = async () => {
//     // --- ARIA FIX: Remove focus from whatever button was clicked! ---
//     if (document.activeElement instanceof HTMLElement) {
//       document.activeElement.blur();
//     }

//     const id = img.id || img.imageId;
//     if (!id) return alert("Error: Could not find the ID for this image.");

//     const numId = Number(id);

//     const editInput = document.getElementById(
//       "editNotesInput"
//     ) as HTMLTextAreaElement | null;

//     const selectedCheckboxes = document.querySelectorAll(
//       '#tagPickerModal input[name="tagIds"]:checked'
//     );

//     const newTagIds = Array.from(selectedCheckboxes).map(
//       (cb) => (cb as HTMLInputElement).value
//     );


//     if (!validateTagsForFile(newTagIds, "This Image")) {

//       const modalEl = document.getElementById("tagPickerModal");

//       if (modalEl) {
//         await TagManager.renderFullTagPicker();

//         const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);

//         modalInstance.show();
//       }
//       return; // Stop the save
//     }

//     const modalNotesElem = document.getElementById(
//       "modalNotes"
//     ) as HTMLElement | null;
//     const updatedNotes = editInput?.value ?? (modalNotesElem?.innerText || "");

//     // ==============================================================
//     // INSTANT OPTIMISTIC UI UPDATE
//     // ==============================================================
//     document.getElementById("saveBtnWrapper")?.classList.add("d-none");
//     document.getElementById("editBtnWrapper")?.classList.remove("d-none");

//     if (modalNotesElem) {
//       modalNotesElem.innerText = updatedNotes || "No notes available.";
//       modalNotesElem.classList.remove("d-none");
//     }
//     if (editInput) editInput.classList.add("d-none");

//     if (tagsDisplay) {
//       tagsDisplay.innerHTML = "";
//       if (selectedCheckboxes.length > 0) {
//         selectedCheckboxes.forEach((cb) => {
//           const labelText = cb.nextElementSibling?.textContent || "Tag";
//           const span = document.createElement("span");
//           span.className =
//             "badge rounded-pill border border-info text-dark me-1 px-2 py-1";
//           span.innerText = labelText;
//           tagsDisplay.appendChild(span);
//         });
//       } else {
//         tagsDisplay.innerHTML =
//           '<span class="text-muted small">No tags assigned.</span>';
//       }
//       tagsDisplay.classList.remove("d-none");
//     }
//     if (editTagsContainer) editTagsContainer.classList.add("d-none");

//     img.nathansNotes = updatedNotes;
//     img.tags = Array.from(selectedCheckboxes).map((cb) => ({
//       id: (cb as HTMLInputElement).value,
//       tagName: cb.nextElementSibling?.textContent || "Tag",
//     }));

//     // ==============================================================
//     // BACKGROUND API CALLS
//     // ==============================================================
//     console.log("=== STARTING IMAGE SAVE PROCESS ===");

//     // We use URLSearchParams to perfectly match Spring Boot's @RequestParam
//     const params = new URLSearchParams();

//     // Add our notes and lifecycle stage. These names match the backend exactly!
//     params.append("nathansNotes", updatedNotes);
//     params.append("life_cycle", "Adult");

//     // Loop through the selected tags and append them using the plural "tagIds"
//     if (newTagIds.length > 0) {
//       newTagIds.forEach((tagId) => {
//         params.append("tagIds", tagId.toString());
//       });
//     }

//     console.log("Sending URL-Encoded Params to updateImageDetails...");

//     try {
//       // Send the params object to our newly updated API function
//       await ButterflyAPI.updateImageDetails(id, params);
//       console.log("Main image details (Notes & Tags) updated successfully!");

//       await reloadSpeciesCallback();
//       console.log("=== SAVE PROCESS COMPLETE ===");
//     } catch (err: any) {
//       console.error("!!! BACKGROUND SAVE ERROR !!!", err);
//     }
//   };
function setupImageEditing(
  img: any,
  reloadSpeciesCallback: () => Promise<void>
) {
  const editBtn = document.getElementById("editImageBtn");
  const saveBtn = document.getElementById("saveImageBtn");
  const notesDisplay = document.getElementById("modalNotes");
  const tagsDisplay = document.getElementById("modalTags");
  const editTagsContainer = document.getElementById("editTagsContainer");
  const notesInput = document.getElementById("editNotesInput") as HTMLTextAreaElement;

  if (!editBtn || !saveBtn) return;

  // KEY 1: Use a local variable to track "pending" changes
  // This ensures the summary updates correctly even before saving to DB
  let pendingTags = [...(img.tags || [])];
  editTagsContainer?.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("#openTagPickerBtn")) {
      e.preventDefault();
      e.stopPropagation();
      await openTagPicker(); 
  
      const modalEl = document.getElementById("tagPickerModal");
      if (!modalEl) return;
  
      try {
        // 1. Point initTagContainer to the modal's list container
        // We'll temporarily give the modal list an ID initTagContainer recognizes
        const modalList = modalEl.querySelector('.modal-body'); 
        if (modalList) modalList.id = "tagCheckboxList"; 
  
        // 2. Load the tags
        await TagManager.initTagContainer();
  
        // 3. HIGHLIGHT: Find all checkboxes we just created and check them
        // We use img.tags to find the IDs that should be active
        const activeIds = pendingTags.map(t => String(t.tagId || t.id));
        
        // Small timeout to ensure the HTML injection is 100% finished
        setTimeout(() => {
          const checkboxes = modalEl.querySelectorAll('input[name="tagIds"]') as NodeListOf<HTMLInputElement>;
          console.log(`Found ${checkboxes.length} checkboxes to check against`, activeIds);
          
          checkboxes.forEach(cb => {
            if (activeIds.includes(cb.value)) {
              cb.checked = true;
            }
          });
        }, 50);
  
        // 4. SUMMARY: When the modal closes, grab the new selection
        const saveSelection = () => {
          const checked = modalEl.querySelectorAll('input[name="tagIds"]:checked') as NodeListOf<HTMLInputElement>;
          
          pendingTags = Array.from(checked).map(cb => ({
            id: cb.value,
            tagName: cb.nextElementSibling?.textContent?.trim() || "Tag"
          }));
  
          console.log("Summary updated:", pendingTags);
          renderEditPreview(pendingTags);
          modalEl.removeEventListener('hidden.bs.modal', saveSelection);
        };
  
        modalEl.addEventListener('hidden.bs.modal', saveSelection);
  
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.show();
      } catch (err) {
        console.error("Error opening tag picker:", err);
      }
    }
  });

  // editTagsContainer?.addEventListener("click", async (e) => {
  //   const target = e.target as HTMLElement;
  //   if (target.closest("#openTagPickerBtn")) {
  //     e.preventDefault();
  //     e.stopPropagation();

  //     const modalEl = document.getElementById("tagPickerModal");
  //     if (!modalEl) return;

  //     try {
  //       // KEY 2: Ensure tags are actually rendered before we try to check them
  //       // If initTagContainer doesn't draw the checkboxes, call the render function directly
  //       await TagManager.initTagContainer();
  //       if (typeof (TagManager as any).renderFullTagPicker === 'function') {
  //          await (TagManager as any).renderFullTagPicker();
  //       }

  //       // KEY 3: Use the IDs from our PENDING tags to highlight the checkboxes
  //       const selectedIds = pendingTags.map(t => String(t.tagId || t.id || t));
        
  //       // We use a small timeout to ensure the DOM has finished painting the checkboxes
  //       setTimeout(() => {
  //           const allCheckboxes = modalEl.querySelectorAll('input[name="tagIds"]') as NodeListOf<HTMLInputElement>;
  //           allCheckboxes.forEach((cb) => {
  //               cb.checked = selectedIds.includes(cb.value);
  //           });
  //       }, 50);

  //       // KEY 4: Update the SUMMARY badges when the user clicks "Apply" or closes the modal
  //       const handleModalClose = () => {
  //           const selectedOnes = modalEl.querySelectorAll('input[name="tagIds"]:checked');
  //           pendingTags = Array.from(selectedOnes).map(cb => ({
  //               id: (cb as HTMLInputElement).value,
  //               tagName: cb.nextElementSibling?.textContent?.trim() || "Tag"
  //           }));
            
  //           // Refresh the "Summary" view
  //           renderEditPreview(pendingTags);
  //           modalEl.removeEventListener('hidden.bs.modal', handleModalClose);
  //       };

  //       modalEl.addEventListener('hidden.bs.modal', handleModalClose);

  //       const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
  //       modalInstance.show();
  //     } catch (err) {
  //       console.error("Tag Picker Error:", err);
  //     }
  //   }
  // });

  editBtn.onclick = async () => {
    document.getElementById("editBtnWrapper")?.classList.add("d-none");
    document.getElementById("saveBtnWrapper")?.classList.remove("d-none");

    if (notesDisplay) notesDisplay.classList.add("d-none");
    if (notesInput) {
      notesInput.classList.remove("d-none");
      notesInput.value = notesDisplay?.innerText === "No notes available." ? "" : notesDisplay?.innerText || "";
    }

    if (tagsDisplay) tagsDisplay.classList.add("d-none");
    if (editTagsContainer) {
      editTagsContainer.classList.remove("d-none");
      // Initial summary render using current image tags
      renderEditPreview(pendingTags);
    }
  };

  function renderEditPreview(tags: any[]) {
    const preview = document.getElementById("editTagsPreview");
    if (!preview) return;
    
    if (tags.length === 0) {
        preview.innerHTML = '<span class="text-muted small">No tags picked yet.</span>';
        return;
    }

    preview.innerHTML = tags.map(t => `
        <span class="badge rounded-pill bg-light text-dark border border-info px-2 py-1" style="font-size:0.7rem;">
            ${t.tagName || t.name || t}
        </span>
    `).join("");
  }

  saveBtn.onclick = async () => {
    const id = img.id || img.imageId;
    if (!id) return alert("Error: ID missing.");

    // KEY 5: Save based on our PENDING selections
    const newTagIds = pendingTags.map(t => String(t.id || t.tagId));

  if (!validateTagsForFile(newTagIds, "This Image")) {
    // If validation fails, reopen our isolated edit picker
    await openTagPicker();
    return;
  }

    // Toggle UI back to view mode
    document.getElementById("saveBtnWrapper")?.classList.add("d-none");
    document.getElementById("editBtnWrapper")?.classList.remove("d-none");

    // Optimistic UI update for the "View" mode
    if (notesDisplay) {
        notesDisplay.innerText = notesInput.value || "No notes available.";
        notesDisplay.classList.remove("d-none");
    }
    notesInput.classList.add("d-none");
    
    if (tagsDisplay) {
        tagsDisplay.innerHTML = "";
        pendingTags.forEach(t => {
            const span = document.createElement("span");
            span.className = "badge rounded-pill border border-info text-dark me-1 px-2 py-1";
            span.innerText = t.tagName || t.name || t;
            tagsDisplay.appendChild(span);
        });
        tagsDisplay.classList.remove("d-none");
    }
    if (editTagsContainer) editTagsContainer.classList.add("d-none");

    // Sync original img object
    img.nathansNotes = notesInput.value;
    img.tags = [...pendingTags];

    // API Call
    const params = new URLSearchParams();
    params.append("nathansNotes", notesInput.value);
    newTagIds.forEach(tid => params.append("tagIds", tid));

    try {
      await ButterflyAPI.updateImageDetails(id, params);
      await reloadSpeciesCallback();
      await openTagPicker();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  
  const openTagPicker = async () => {
    const modalEl = document.getElementById("tagPickerModal");
    if (!modalEl) return;

    // 1. Prepare and Load
    const modalList = modalEl.querySelector('.modal-body'); 
    if (modalList) modalList.id = "tagCheckboxList"; 
    await TagManager.initTagContainer();

    // 2. Highlighting Logic (existing)
    const activeIds = pendingTags.map(t => String(t.tagId || t.id));
    setTimeout(() => {
        const checkboxes = modalEl.querySelectorAll('input[name="tagIds"]') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(cb => {
            cb.checked = activeIds.includes(cb.value);
        });
    }, 50);

    // ==============================================================
    // 3. NEW: MUTUAL EXCLUSION (Only Pick One per Category)
    // ==============================================================
    modalEl.onclick = (e) => {
        const target = e.target as HTMLInputElement;
        
        // If we clicked a checkbox inside a "Required" category
        if (target.type === "checkbox" && target.name === "tagIds") {
            const categoryBlock = target.closest('.tag-category-block');
            const categoryName = categoryBlock?.querySelector('h6')?.innerText || "";
            
            const requiredCategories = ["Sex", "Layout", "Wings View"];
            
            // Check if this checkbox belongs to a required category
            const isRequired = requiredCategories.some(req => categoryName.includes(req));

            if (isRequired && target.checked) {
                // Find all OTHER checkboxes in this specific category block and uncheck them
                const otherCheckboxes = categoryBlock?.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
                otherCheckboxes.forEach(cb => {
                    if (cb !== target) cb.checked = false;
                });
            }
        }
    };

    // 4. Update Selection on Close (existing)
    const onHide = () => {
        const checked = modalEl.querySelectorAll('input[name="tagIds"]:checked') as NodeListOf<HTMLInputElement>;
        pendingTags = Array.from(checked).map(cb => ({
            id: (cb as HTMLInputElement).value,
            tagName: cb.nextElementSibling?.textContent?.trim() || "Tag"
        }));
        renderEditPreview(pendingTags);
        modalEl.removeEventListener('hidden.bs.modal', onHide);
        modalEl.onclick = null; // Clean up the exclusion listener
    };
    
    modalEl.addEventListener('hidden.bs.modal', onHide);

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
};

  function validateTagsForFile(tagIds: string[], fileName: string): boolean {
    const required = ["Sex", "Layout", "Wings View"];
    const foundCategories = new Set<string>();

    tagIds.forEach((id) => {
      // Look globally for the checkbox to find its category header
      const checkbox = document.querySelector(
        `input[name="tagIds"][value="${id}"]`
      );
      const categoryBlock = checkbox?.closest(".tag-category-block");
      const categoryName = categoryBlock?.querySelector("h6")?.innerText || "";

      required.forEach((req) => {
        if (categoryName.includes(req)) {
          foundCategories.add(req);
        }
      });
    });

    const missing = required.filter((req) => !foundCategories.has(req));

    if (missing.length > 0) {
      alert(
        `Incomplete Tags for: "${fileName}"\n\n` +
          `Please select one option for the following required categories:\n` +
          missing.map((m) => `• ${m}`).join("\n")
      );
      return false;
    }
    return true;
  }
}
