// src/features/upload/upload.ts

/**
 * This file manages the complex, multi-step process for adding new species
 * and images to the database. It handles the drag-and-drop file interface,
 * auto-capitalization of scientific names, and the sequential uploading of image
 * files with their associated notes and tags.
 */

import { ButterflyAPI } from "../../core/api.js";
import { AppState } from "../../core/state.js";
import { TagManager } from "../admin/admin_tags.js";

interface UploadFileData {
  file: File;
  url: string;
  notes: string;
  tags: string[];
}

export interface UploadCallbacks {
  reloadGallery: () => Promise<void>;
  reloadSpecies: (species: any) => Promise<void>;
}

export function initUpload(callbacks: UploadCallbacks) {
  let selectedUploadFiles: UploadFileData[] = [];
  let currentSelectedFileIndex = -1;
  let currentSpeciesId = "NEW";

  const universalUploadForm = document.getElementById("universalUploadForm");

  // --- Auto-Capitalization Logic ---
  const autoCapFields = ["newName", "newOrderName", "newFamily", "newGenus"];
  autoCapFields.forEach((id) => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      input.addEventListener("input", function (e) {
        const target = e.target as HTMLInputElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;

        // Add the negative lookbehind (?<!['’]) before the \b\w
        target.value = target.value.replace(/(?<!['’])\b\w/g, (char) =>
          char.toUpperCase()
        );

        target.setSelectionRange(start, end);
      });
    }
  });

  // Custom Scientific Name Formatting & Genus Auto-fill
  const sciInput = document.getElementById("newScientific") as HTMLInputElement;
  const genusInput = document.getElementById("newGenus") as HTMLInputElement;

  if (sciInput) {
    sciInput.addEventListener("input", function (e) {
      const target = e.target as HTMLInputElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      let words = target.value.split(" ");
      if (words.length > 0 && words[0].length > 0) {
        words[0] =
          words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
      }
      for (let i = 1; i < words.length; i++) {
        words[i] = words[i].toLowerCase();
      }
      target.value = words.join(" ");
      target.setSelectionRange(start, end);

      if (genusInput) {
        const trimmedWords = target.value.trim().split(/\s+/);
        genusInput.value = trimmedWords[0] ? trimmedWords[0] : "";
      }
    });
  }

  const updateSummary = () => {
    const summaryArea = document.getElementById("selectedTagsSummary");

    const checkedBoxes = document.querySelectorAll(
      '#fullTagGrid input[type="checkbox"]:checked'
    ) as NodeListOf<HTMLInputElement>;

    if (summaryArea) {
      if (checkedBoxes.length === 0) {
        summaryArea.innerHTML =
          '<span class="text-muted small italic">No tags selected</span>';
      } else {
        const badges = Array.from(checkedBoxes).map((cb) => {
          const label =
            document
              .querySelector(`label[for="${cb.id}"]`)
              ?.textContent?.trim() || "Tag";

          return `
            <span class="badge bg-primary rounded-pill px-2 py-1"
              style="font-size: 10px;">
              ${label}
            </span>
          `;
        });

        summaryArea.innerHTML = badges.join(" ");
      }
    }
  };

  
  // --- Main Upload Modal Logic ---
  if (universalUploadForm) {
    const uploadModal = document.getElementById("addButterflyModal");
    

    if (uploadModal) {
      uploadModal.addEventListener("show.bs.modal", async (e) => {
        if (e.target !== uploadModal) return;

        await TagManager.initTagContainer();

        const listContainer = document.getElementById("speciesDropdownList");
        const btnText = document.getElementById("speciesDropdownText");
        const hiddenInput = document.getElementById(
          "speciesSelectorValue"
        ) as HTMLInputElement;

        currentSpeciesId = hiddenInput.value || "NEW";

        console.log(
          "Modal opened. Restored currentSpeciesId:",
          currentSpeciesId
        );

        const newSpeciesFields = document.getElementById("newSpeciesFields");
        const searchInput = document.getElementById(
          "searchSpeciesInput"
        ) as HTMLInputElement;

        const phase1 = document.getElementById("uploadPhase1");
        const phase2 = document.getElementById("uploadPhase2");
        const btnNext = document.getElementById("btnNextToPhase2");
        const btnBack = document.getElementById("btnBackToPhase1");

        const loadingScreen = document.getElementById("uploadLoadingScreen");
        if (loadingScreen) loadingScreen.classList.add("d-none");

        if (hiddenInput.value === "NEW") {
          if (phase1) phase1.classList.remove("d-none");
          if (phase2) phase2.classList.add("d-none");
          if (btnBack) btnBack.style.display = "block";
          if (btnText)
            btnText.innerHTML = `<span class="text-primary fw-bold">Create New Species</span>`;
          if (newSpeciesFields) newSpeciesFields.style.display = "block";
        } else {
          if (btnBack) btnBack.style.display = "none";
        }

        if (!listContainer || !hiddenInput || !btnText) return;

        if (hiddenInput.value === "NEW") {
          if (btnText)
            btnText.innerHTML = `<span class="text-primary fw-bold">Create New Species</span>`;
          if (newSpeciesFields) newSpeciesFields.style.display = "block";
        } else {
          console.log(
            "Modal opened, but keeping existing species:",
            hiddenInput.value
          );
        }

        let html = `<button type="button" class="dropdown-item species-option border-bottom py-2" data-value="NEW"><span class="text-primary fw-bold">Create New Species</span></button>`;
        const sortedForDropdown = [...AppState.butterflies].sort((a, b) => {
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

        sortedForDropdown.forEach((s) => {
          const displayName =
            AppState.currentDisplayMode === "scientific" && s.scientificName
              ? s.scientificName
              : s.name;
          html += `<button type="button" class="dropdown-item species-option py-2" data-value="${s.id}">${displayName}</button>`;
        });
        listContainer.innerHTML = html;
        listContainer.querySelectorAll(".species-option").forEach((item) => {
          item.addEventListener("click", (e) => {
            const btn = e.currentTarget as HTMLElement;

            // const val = btn.getAttribute("data-value") || "NEW";

            const val = btn.getAttribute("data-value");

            if (!val) {
              console.error("Missing data-value on species option");
              return;
            }

            const hiddenInput = document.getElementById(
              "speciesSelectorValue"
            ) as HTMLInputElement;
            currentSpeciesId = val;
            hiddenInput.value = val;

            console.log("Species selection changed to:", val);

            if (btnText) btnText.innerHTML = btn.innerHTML;

            if (newSpeciesFields) {
              newSpeciesFields.style.display = val === "NEW" ? "block" : "none";
            }

            const bsDropdown = bootstrap.Dropdown.getInstance(
              document.getElementById("speciesDropdownBtn")
            );
            if (bsDropdown) bsDropdown.hide();
          });
        });

        if (searchInput) {
          searchInput.addEventListener("input", (e) => {
            const term = (e.target as HTMLInputElement).value.toLowerCase();
            const options = listContainer.querySelectorAll(".species-option");
            options.forEach((opt) => {
              const val = opt.getAttribute("data-value");
              const text = opt.textContent?.toLowerCase() || "";
              if (val === "NEW" || text.includes(term)) {
                (opt as HTMLElement).style.display = "block";
              } else {
                (opt as HTMLElement).style.display = "none";
              }
            });
          });
        }

        if (btnNext && phase1 && phase2) {
          btnNext.onclick = () => {
            const speciesId = hiddenInput.value;
            if (speciesId === "NEW") {
              const name = (
                document.getElementById("newName") as HTMLInputElement
              ).value.trim();
              const sci = (
                document.getElementById("newScientific") as HTMLInputElement
              ).value.trim();
              if (!name) return alert("Please enter a common name.");
              if (!sci) return alert("Please enter a scientific name.");
              if (sci.split(/\s+/).length !== 2)
                return alert("The Scientific Name must be exactly two words.");
            }
            phase1.classList.add("d-none");
            phase2.classList.remove("d-none");
          };
        }

        if (btnBack && phase1 && phase2) {
          btnBack.onclick = () => {
            phase2.classList.add("d-none");
            phase1.classList.remove("d-none");
          };
        }

        if (selectedUploadFiles.length > 0) {
          console.log(
            "Preserving existing session with files:",
            selectedUploadFiles.length
          );
        } else {
          console.log("Starting a fresh upload session.");
          currentSelectedFileIndex = -1;
        }

        const dropZone = document.getElementById("imageDropZone");
        const fileInput = document.getElementById(
          "newImageFile"
        ) as HTMLInputElement;
        const fileListContainer = document.getElementById("selectedFilesList");
        const fileCounter = document.getElementById("uploadFileCounter");

        const previewSection = document.getElementById("imagePreviewSection");
        const noImagePrompt = document.getElementById("noImageSelectedPrompt");
        const previewImg = document.getElementById(
          "uploadImagePreview"
        ) as HTMLImageElement;
        const notesInput = document.getElementById(
          "nathanNotes"
        ) as HTMLTextAreaElement;
        const tagCheckboxes = () =>
          document.querySelectorAll(
            '#tagCheckboxContainer input[type="checkbox"]'
          ) as NodeListOf<HTMLInputElement>;

        const saveCurrentMetadata = () => {
          if (
            currentSelectedFileIndex >= 0 &&
            currentSelectedFileIndex < selectedUploadFiles.length
          ) {
            if (notesInput)
              selectedUploadFiles[currentSelectedFileIndex].notes =
                notesInput.value;

            const selectedTags = Array.from(
              document.querySelectorAll(
                '#fullTagGrid input[type="checkbox"]:checked'
              )
            ).map((cb) => (cb as HTMLInputElement).value);

            selectedUploadFiles[currentSelectedFileIndex].tags = selectedTags;
          }
        };

        const updatePreviewPanel = () => {
          if (
            currentSelectedFileIndex >= 0 &&
            currentSelectedFileIndex < selectedUploadFiles.length
          ) {
            const data = selectedUploadFiles[currentSelectedFileIndex];
            if (previewSection && noImagePrompt && previewImg) {
              previewSection.classList.remove("d-none");
              noImagePrompt.classList.add("d-none");
              previewImg.src = data.url;
            }
            if (notesInput) notesInput.value = data.notes;

            const pickerCheckboxes = document.querySelectorAll(
              '#fullTagGrid input[type="checkbox"]'
            ) as NodeListOf<HTMLInputElement>;
            pickerCheckboxes.forEach((cb) => {
              cb.checked = data.tags.includes(cb.value);
            });

            updateSummary();
          } else {
            if (previewSection && noImagePrompt) {
              previewSection.classList.add("d-none");
              noImagePrompt.classList.remove("d-none");
            }
          }
        };

        const renderFileList = () => {
          if (!fileListContainer) return;
          if (fileCounter)
            fileCounter.innerText = `${selectedUploadFiles.length} file${
              selectedUploadFiles.length === 1 ? "" : "s"
            } selected`;
          fileListContainer.innerHTML = "";

          selectedUploadFiles.forEach((data, index) => {
            const li = document.createElement("li");
            const isActive =
              index === currentSelectedFileIndex
                ? "bg-primary text-white border-primary"
                : "bg-white text-dark border-secondary border-opacity-25";

            li.className = `list-group-item d-flex justify-content-between align-items-center py-2 px-3 small mb-1 rounded cursor-pointer border ${isActive}`;
            li.innerHTML = `
                  <span class="text-truncate" style="max-width: 85%;">
                      <i class="fas fa-image me-2 ${
                        index === currentSelectedFileIndex
                          ? "text-white"
                          : "text-primary"
                      }"></i>${data.file.name}
                  </span>
                  <button type="button" class="btn btn-sm btn-link p-0 remove-file-btn ${
                    index === currentSelectedFileIndex
                      ? "text-white"
                      : "text-danger"
                  }" data-index="${index}">
                      <i class="fas fa-times"></i>
                  </button>`;

            li.addEventListener("click", () => {
              saveCurrentMetadata();
              currentSelectedFileIndex = index;
              renderFileList();
              updatePreviewPanel();
            });
            fileListContainer.appendChild(li);
          });

          fileListContainer
            .querySelectorAll(".remove-file-btn")
            .forEach((btn) => {
              btn.addEventListener("click", (e) => {
                e.stopPropagation();
                saveCurrentMetadata();
                const idx = parseInt(
                  (e.currentTarget as HTMLElement).getAttribute("data-index") ||
                    "0"
                );
                URL.revokeObjectURL(selectedUploadFiles[idx].url);
                selectedUploadFiles.splice(idx, 1);

                if (currentSelectedFileIndex === idx) {
                  currentSelectedFileIndex =
                    selectedUploadFiles.length > 0 ? 0 : -1;
                } else if (currentSelectedFileIndex > idx) {
                  currentSelectedFileIndex--;
                }
                renderFileList();
                updatePreviewPanel();
              });
            });
        };

        const addFiles = (files: FileList | File[]) => {
          saveCurrentMetadata();
          Array.from(files).forEach((file) => {
            selectedUploadFiles.push({
              file: file,
              url: URL.createObjectURL(file),
              notes: "",
              tags: [],
            });
          });
          if (currentSelectedFileIndex === -1 && selectedUploadFiles.length > 0)
            currentSelectedFileIndex = 0;
          renderFileList();
          updatePreviewPanel();
        };

        if (dropZone && fileInput && fileListContainer) {
          dropZone.onclick = () => fileInput.click();
          dropZone.ondragover = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("drag-active");
          };
          dropZone.ondragleave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("drag-active");
          };
          dropZone.ondrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("drag-active");
            if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
          };
          fileInput.onchange = () => {
            if (fileInput.files) {
              addFiles(fileInput.files);
              fileInput.value = "";
            }
          };
        }

        if (notesInput)
          notesInput.addEventListener("input", saveCurrentMetadata);
        tagCheckboxes().forEach((cb) =>
          cb.addEventListener("change", saveCurrentMetadata)
        );
        await TagManager.renderFullTagPicker();

        document
          .getElementById("tagPickerSearch")
          ?.addEventListener("input", (e) => {
            const term = (e.target as HTMLInputElement).value;
            TagManager.renderFullTagPicker(term);
          });

        document
          .getElementById("universalUploadForm")
          ?.addEventListener("submit", (e) => {
            console.log("Form is submitting! Source of trigger:", e.submitter);
          });

        document
          .getElementById("fullTagGrid")
          ?.addEventListener("change", updateSummary);

        renderFileList();
        updatePreviewPanel();
      });
      
      uploadModal.addEventListener("hidden.bs.modal", (e) => {
        if ((e.target as HTMLElement).id === "tagPickerModal") return;

        if (e.target === uploadModal) {
            console.log("Modal closed via cancel/click-away. Resetting for next time.");
            
            currentSpeciesId = "NEW";
            const hInput = document.getElementById("speciesSelectorValue") as HTMLInputElement;
            if (hInput) hInput.value = "NEW";

            document.getElementById("uploadPhase1")?.classList.remove("d-none");
            document.getElementById("uploadPhase2")?.classList.add("d-none");
            document.getElementById("uploadLoadingScreen")?.classList.add("d-none");

            selectedUploadFiles.forEach((d) => URL.revokeObjectURL(d.url));
            selectedUploadFiles = [];
            
            const fileListContainer = document.getElementById("selectedFilesList");
            if (fileListContainer) fileListContainer.innerHTML = "";
            
            const btnText = document.getElementById("speciesDropdownText");
            if (btnText) {
                btnText.innerHTML = `<span class="text-primary fw-bold">Create New Species</span>`;
            }
        }
      });

      
    }

    

    console.log("REGISTERING CLOSE PICKER LISTENER");
    const openTagPickerBtn = document.getElementById("openTagPickerBtn");

    openTagPickerBtn?.addEventListener("click", () => {
      const pickerEl = document.getElementById("tagPickerModal");

      if (pickerEl) {
        const modal = new bootstrap.Modal(pickerEl);

        pickerEl.style.zIndex = "1070";

        modal.show();
      }
    });

    const closePickerBtn = document.getElementById("closeTagPickerBtn");
    closePickerBtn?.addEventListener("click", (e) => {
      e.preventDefault();

      const pickerEl = document.getElementById("tagPickerModal");

      if (pickerEl) {
        const modalInstance = bootstrap.Modal.getInstance(pickerEl);

        modalInstance?.hide();
      }

      updateSummary();
    });

    universalUploadForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();

      let speciesId = currentSpeciesId;

      console.log("SUBMIT START - Fixed ID is:", speciesId);

      if (!speciesId) {
        return alert(
          "Error: Species ID was lost. Please re-select the species."
        );
      }

      const notesInput = document.getElementById(
        "nathanNotes"
      ) as HTMLTextAreaElement;
      const tagCheckboxes = () =>
        document.querySelectorAll(
          '#tagPickerModal input[type="checkbox"]'
        ) as NodeListOf<HTMLInputElement>;

      if (
        currentSelectedFileIndex >= 0 &&
        currentSelectedFileIndex < selectedUploadFiles.length
      ) {
        if (notesInput)
          selectedUploadFiles[currentSelectedFileIndex].notes =
            notesInput.value;
        selectedUploadFiles[currentSelectedFileIndex].tags = Array.from(
          tagCheckboxes()
        )
          .filter((cb) => cb.checked)
          .map((cb) => cb.value);
      }

      if (selectedUploadFiles.length === 0)
        return alert("Please select at least one image file.");

      // ==========================================
      // NEW: TRANSITION TO LOADING SCREEN
      // ==========================================
      const phase1 = document.getElementById("uploadPhase1");
      const phase2 = document.getElementById("uploadPhase2");
      const loadingScreen = document.getElementById("uploadLoadingScreen");
      const progressText = document.getElementById("uploadProgressText");

      if (phase1) phase1.classList.add("d-none");
      if (phase2) phase2.classList.add("d-none");
      if (loadingScreen) loadingScreen.classList.remove("d-none");
      if (progressText)
        progressText.innerText = `File Status: Uploading Image 1 of ${selectedUploadFiles.length}...`;

      console.log("SUBMIT START - ID is:", speciesId);

      console.log("Submitting... Species ID is:", speciesId);

      if (
        currentSelectedFileIndex >= 0 &&
        currentSelectedFileIndex < selectedUploadFiles.length
      ) {
        const notesInput = document.getElementById(
          "nathanNotes"
        ) as HTMLTextAreaElement;
        if (notesInput)
          selectedUploadFiles[currentSelectedFileIndex].notes =
            notesInput.value;

        const checkedTags = document.querySelectorAll(
          '#fullTagGrid input[type="checkbox"]:checked'
        );
        selectedUploadFiles[currentSelectedFileIndex].tags = Array.from(
          checkedTags
        ).map((cb) => (cb as HTMLInputElement).value);
      }

      if (selectedUploadFiles.length === 0)
        return alert("Please select at least one image file.");

      if (speciesId === "NEW") {
        const nameInput = (
          document.getElementById("newName") as HTMLInputElement
        ).value.trim();
        const sciInput = (
          document.getElementById("newScientific") as HTMLInputElement
        ).value.trim();

        if (!nameInput || !sciInput) {
          return alert(
            "Common and Scientific names are required for new species."
          );
        }

        if (loadingScreen) loadingScreen.classList.remove("d-none");
        if (phase2) phase2.classList.add("d-none");

        try {
          const newSpecies = await ButterflyAPI.create({
            name: nameInput,
            scientificName: sciInput,
            description: (
              document.getElementById("newDescription") as HTMLTextAreaElement
            ).value,

            orderName: (
              document.getElementById("newOrderName") as HTMLInputElement
            ).value.trim(),
            family: (
              document.getElementById("newFamily") as HTMLInputElement
            ).value.trim(),
            genus: (
              document.getElementById("newGenus") as HTMLInputElement
            ).value.trim(),
          });

          speciesId = newSpecies.id.toString();
        } catch (err: any) {
          if (loadingScreen) loadingScreen.classList.add("d-none");
          if (phase2) phase2.classList.remove("d-none");
          return alert("Failed to create species: " + err.message);
        }
      } else {
        if (loadingScreen) loadingScreen.classList.remove("d-none");
        if (phase2) phase2.classList.add("d-none");
        console.log("Proceeding with existing species ID:", speciesId);
      }

      let successCount = 0;
      let failCount = 0;
      const totalFiles = selectedUploadFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const data = selectedUploadFiles[i];

        if (progressText) {
          progressText.innerText = `File Status: Uploading Image ${
            i + 1
          } of ${totalFiles}...`;
        }

        const formData = new FormData();
        formData.append("file", data.file);
        formData.append("species_id", speciesId);
        formData.append("nathansNotes", data.notes);
        if (data.tags.length > 0)
          data.tags.forEach((id) => formData.append("tagId", id));

        try {
          await ButterflyAPI.uploadImage(formData);
          successCount++;
        } catch (err) {
          console.error("Failed to upload " + data.file.name + ":", err);
          failCount++;
        }
      }
      console.log("Submitting with currentSpeciesId =", currentSpeciesId);
      console.log(
        "Hidden input value =",
        (document.getElementById("speciesSelectorValue") as HTMLInputElement)
          ?.value
      );

      // ==========================================
      // CLEANUP AFTER UPLOAD (SUCCESS STATE)
      // ==========================================
      const spinnerContainer = document.getElementById(
        "loadingSpinnerContainer"
      );
      const successIcon = document.getElementById("uploadSuccessIcon");
      const loadingTitle = document.getElementById("loadingScreenTitle");
      const loadingSubtitle = document.getElementById("loadingScreenSubtitle");
      const finishBtn = document.getElementById("btnFinishUpload");

      if (failCount === 0) {
        if (loadingTitle) loadingTitle.innerText = "Upload Complete!";
        if (loadingSubtitle)
          loadingSubtitle.innerText = `${successCount} image${
            successCount > 1 ? "s" : ""
          } uploaded successfully.`;
      } else {
        if (loadingTitle)
          loadingTitle.innerText = "Upload Finished with Errors";
        if (loadingSubtitle)
          loadingSubtitle.innerText = `${successCount} uploaded, ${failCount} failed. Check console.`;
      }

      if (progressText) progressText.classList.add("d-none");
      if (spinnerContainer) spinnerContainer.classList.add("d-none");
      if (successIcon) successIcon.classList.remove("d-none");
      if (finishBtn) finishBtn.classList.remove("d-none");

      if (finishBtn) {
        finishBtn.onclick = async () => {
          if (loadingTitle) loadingTitle.innerText = "Image Uploading...";

          if (loadingSubtitle) {
            loadingSubtitle.innerText =
              "Please wait. This may take a few moments.";
          }

          if (progressText) progressText.classList.remove("d-none");
          if (spinnerContainer) spinnerContainer.classList.remove("d-none");
          if (successIcon) successIcon.classList.add("d-none");

          finishBtn.classList.add("d-none");

          document.getElementById("uploadPhase1")?.classList.remove("d-none");
          document.getElementById("uploadPhase2")?.classList.add("d-none");
          document
            .getElementById("uploadLoadingScreen")
            ?.classList.add("d-none");

          // Reset the Dropdown text to the default
          const btnText = document.getElementById("speciesDropdownText");
          if (btnText) {
            btnText.innerHTML = `<span class="text-primary fw-bold">Create New Species</span>`;
          }

          const modalEl = document.getElementById("addButterflyModal");

          if (modalEl) {
            const instance = bootstrap.Modal.getInstance(modalEl);
            instance?.hide();
          }

          selectedUploadFiles.forEach((d) => URL.revokeObjectURL(d.url));
          selectedUploadFiles = [];

          currentSelectedFileIndex = -1;

          const form = document.getElementById(
            "universalUploadForm"
          ) as HTMLFormElement;

          form?.reset();

          const hInput = document.getElementById(
            "speciesSelectorValue"
          ) as HTMLInputElement;

          if (hInput) hInput.value = "NEW";

          // reset phases
          document.getElementById("uploadPhase1")?.classList.remove("d-none");

          document.getElementById("uploadPhase2")?.classList.add("d-none");

          document
            .getElementById("uploadLoadingScreen")
            ?.classList.add("d-none");

          const fileListContainer =
            document.getElementById("selectedFilesList");

          if (fileListContainer) {
            fileListContainer.innerHTML = "";
          }

          document
            .getElementById("imagePreviewSection")
            ?.classList.add("d-none");

          document
            .getElementById("noImageSelectedPrompt")
            ?.classList.remove("d-none");

          console.log("Upload modal fully reset");

          AppState.butterflies = await ButterflyAPI.getAll();

          const freshSpecies = await ButterflyAPI.getSpeciesById(speciesId);

          if (freshSpecies) {
            await callbacks.reloadSpecies(freshSpecies);
          } else {
            await callbacks.reloadGallery();
          }
        };
      }
    });

    
  }
  

  // --- Add Images to Existing Species Form ---
  const addImageToSpeciesForm = document.getElementById(
    "addImageToSpeciesForm"
  );
  if (addImageToSpeciesForm) {
    addImageToSpeciesForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const speciesId = (
        document.getElementById("targetSpeciesId") as HTMLInputElement
      ).value;
      const fileInput = document.getElementById(
        "speciesImageFiles"
      ) as HTMLInputElement;
      const notes = (
        document.getElementById("speciesImageNotes") as HTMLInputElement
      ).value;

      if (!fileInput.files || fileInput.files.length === 0)
        return alert("Please select at least one image.");

      let successCount = 0;
      let failCount = 0;
      const files: File[] = Array.from(fileInput.files as FileList);

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("species_id", speciesId);
        formData.append("nathansNotes", notes);
        try {
          await ButterflyAPI.uploadImage(formData);
          successCount++;
        } catch (err) {
          console.error("Upload failed for " + file.name, err);
          failCount++;
        }
      }

      alert(
        `${successCount} image(s) uploaded${
          failCount > 0 ? `, ${failCount} failed` : ""
        }!`
      );
      (e.target as HTMLFormElement).reset();
      bootstrap.Modal.getInstance(
        document.getElementById("addImageToSpeciesModal")
      )?.hide();

      AppState.butterflies = await ButterflyAPI.getAll();
      const freshSpecies = await ButterflyAPI.getSpeciesById(speciesId);
      await callbacks.reloadSpecies(freshSpecies);
    });
  }
}
