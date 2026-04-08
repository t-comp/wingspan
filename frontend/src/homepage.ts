import { ButterflyAPI } from "./api.js";
import { UI } from "./ui.js";
import { TagManager } from "./tags.js";

let currentSpeciesId = null;

export async function initHome(userRole, userEmail) {
  console.log(
    "Home Initializing with role:",
    userRole,
    "and email:",
    userEmail,
  );

  let currentDisplayMode = "common";
  let currentFilteredData = [];
  let currentPage = 1;
  const itemsPerPage = 40;
  interface UploadFileData {
    file: File;
    url: string;
    notes: string;
    tags: string[];
  }
  let selectedUploadFiles: UploadFileData[] = [];
  let currentSelectedFileIndex = -1;
  let butterflies = await ButterflyAPI.getAll();
  console.log("DATABASES SPECIES LIST:", butterflies);

  let studentApiKey = "";
  if (userRole !== "ADMIN") {
    try {
      const dashboardData = await ButterflyAPI.getStudentDashboard(userEmail);
      if (dashboardData && dashboardData.apiKey) {
        studentApiKey = dashboardData.apiKey;
      } else {
        // Fallback: Check teams if not on dashboard
        const allTeams = await ButterflyAPI.getAllTeams();
        for (const t of allTeams) {
          const members = await ButterflyAPI.getTeamMembers(t.id);
          if (members.some((m) => m.email === userEmail)) {
            const keys = await ButterflyAPI.getAllApiKeys();
            const teamKey = keys.find(
              (k) => k.teamName === t.name && k.active !== false,
            );
            if (teamKey) studentApiKey = teamKey.keyVal;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Could not fetch API key for modal", e);
    }
  }

  const portfolio = document.getElementById("portfolio");
  const teamView = document.getElementById("teamView");
  const speciesView = document.getElementById("speciesView");
  const searchNavBar = document.getElementById("searchNavBar");
  const filterPanel = document.getElementById("filterPanel");

  const viewGalleryBtn = document.getElementById("viewGalleryBtn");
  const viewTeamBtn = document.getElementById("viewTeamBtn");
  const backBtn = document.getElementById("backToGalleryBtn");

  const searchInput = document.getElementById(
    "searchInput",
  ) as HTMLInputElement | null;
  const themeToggle = document.getElementById("toggleTheme");

  const adminTeamContent = document.getElementById("adminTeamContent");
  const studentTeamContent = document.getElementById("studentTeamContent");

  const adminGenerateKeyForm = document.getElementById("adminGenerateKeyForm");
  const adminExtendKeyForm = document.getElementById("adminExtendKeyForm");

  const openChangePasswordBtn = document.getElementById(
    "openChangePasswordBtn",
  );
  const changePasswordForm = document.getElementById("changePasswordForm");

  let activeTagFilters = new Set();
  const filterTagCloud = document.getElementById("filterTagCloud");

  if (openChangePasswordBtn) {
    openChangePasswordBtn.addEventListener("click", (e) => {
      e.preventDefault();
      new bootstrap.Modal(
        document.getElementById("changePasswordModal"),
      ).show();
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const pass1 = (
        document.getElementById("newPersonalPassword") as HTMLInputElement
      ).value;
      const pass2 = (
        document.getElementById("confirmPersonalPassword") as HTMLInputElement
      ).value;

      if (pass1 !== pass2) {
        return alert("Passwords do not match! Please try again.");
      }
      if (pass1.length < 7) {
        return alert("Password must be at least 7 characters long.");
      }

      try {
        await ButterflyAPI.resetPassword(userEmail, pass1);
        alert("Password successfully updated!");
        (e.target as HTMLFormElement).reset();
        bootstrap.Modal.getInstance(
          document.getElementById("changePasswordModal"),
        ).hide();
      } catch (err: any) {
        alert("Failed to update password: " + err.message);
      }
    });
  }

  const showView = (view) => {
    [portfolio, speciesView, teamView].forEach((v) => {
      if (v) v.style.display = "none";
    });
    if (view) view.style.display = "block";
    window.scrollTo(0, 0);
  };

  const goToGallery = () => {
    showView(portfolio);
    if (searchNavBar) searchNavBar.style.display = "flex";
    if (filterPanel) filterPanel.style.display = "";

    if (viewGalleryBtn) viewGalleryBtn.classList.add("active");
    if (viewTeamBtn) viewTeamBtn.classList.remove("active");
  };

  const openImageDetailsModal = (img) => {
    const editBtn = document.getElementById("editImageBtn");
    const saveBtn = document.getElementById("saveImageBtn");
    const notesDisplay = document.getElementById("modalNotes");
    const notesInput = document.getElementById("editNotesInput");
    const tagsDisplay = document.getElementById("modalTags");
    const editTagsContainer = document.getElementById("editTagsContainer");

    if (!editBtn || !saveBtn || !notesDisplay || !tagsDisplay || !notesInput)
      return;

    if (userRole === "ADMIN") {
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
      img.nathansNotes ||
      img.nathansnotes ||
      img.nathan_notes ||
      img.notes ||
      "";

    notesDisplay.innerText =
      noteText && noteText !== "undefined" ? noteText : "No notes available.";

    tagsDisplay.innerHTML = "";
    if (img.tags && img.tags.length > 0) {
      img.tags.forEach((t) => {
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

    setupImageEditing(img);
    const setupCopyButton = (btnId, sizeParam) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;

      const sizeLabel = btnId.replace("copy", "").replace("UrlBtn", "");
      btn.innerHTML = `<i class="fas fa-link me-1"></i>${sizeLabel}`;

      btn.onclick = () => {
        let baseImgUrl = img.url || img.fpath;
        let urlToCopy = baseImgUrl;

        // Append a size parameter to the URL if the button requests a specific size.
        if (sizeParam) {
          const separator = urlToCopy.includes("?") ? "&" : "?";
          urlToCopy += `${separator}size=${sizeParam.toLowerCase()}`;
        }

        // Always append the API key so students can load the image!
        if (studentApiKey) {
          const separator = urlToCopy.includes("?") ? "&" : "?";
          urlToCopy += `${separator}apiKey=${studentApiKey}`;
        }

        navigator.clipboard.writeText(urlToCopy);
        btn.innerHTML = `<i class="fas fa-check me-1"></i>Copied!`;
        setTimeout(
          () =>
            (btn.innerHTML = `<i class="fas fa-link me-1"></i>${sizeLabel}`),
          2000,
        );
      };
    };

    setupCopyButton("copyOriginalUrlBtn", null);
    setupCopyButton("copyLargeUrlBtn", "Large");
    setupCopyButton("copyMediumUrlBtn", "Medium");
    setupCopyButton("copySmallUrlBtn", "Small");

    const modalElement = document.getElementById("imageDetailsModal");
    if (modalElement) {
      let detailModal = bootstrap.Modal.getInstance(modalElement);
      if (!detailModal) detailModal = new bootstrap.Modal(modalElement);
      detailModal.show();
    }
  };

  const setupImageEditing = (img) => {
    const editBtn = document.getElementById("editImageBtn");
    const saveBtn = document.getElementById("saveImageBtn");
    const notesDisplay = document.getElementById("modalNotes");
    const tagsDisplay = document.getElementById("modalTags");
    const editTagsContainer = document.getElementById("editTagsContainer");
    const checkboxList = document.getElementById("tagCheckboxList");

    if (!editBtn || !saveBtn) return;

    editBtn.onclick = async () => {
      editBtn.classList.add("d-none");
      saveBtn.classList.remove("d-none");

      editBtn.classList.add("d-none");
      saveBtn.classList.remove("d-none");

      const notesDisplay = document.getElementById("modalNotes");
      const notesInput = document.getElementById("editNotesInput");

      const currentNotes =
        notesDisplay && notesDisplay.innerText === "No notes available."
          ? ""
          : notesDisplay?.innerText || "";

      if (notesDisplay) notesDisplay.classList.add("d-none");
      if (notesInput) notesInput.classList.remove("d-none");

      (notesInput as HTMLTextAreaElement).value = currentNotes;

      if (tagsDisplay) tagsDisplay.classList.add("d-none");
      if (editTagsContainer) editTagsContainer.classList.remove("d-none");
      try {
        const dbTags = await ButterflyAPI.getAllTags();
        const currentTagIds = (img.tags || []).map((t) =>
          String(t.tagId || t.id || t),
        );

        let finalHtml = "";

        for (const [categoryName, tagNames] of Object.entries(
          TagManager.tagData,
        )) {
          let categoryGroupHtml = "";
          let hasFoundAny = false;

          tagNames.forEach((name) => {
            const match = dbTags.find(
              (t) =>
                t &&
                t.tagName &&
                t.tagName.toString().trim().toLowerCase() ===
                  name.trim().toLowerCase(),
            );

            if (match) {
              hasFoundAny = true;
              const isChecked = currentTagIds.includes(String(match.tagId));
              categoryGroupHtml += `
                                <div class="form-check" style="width: 180px; margin-bottom: 5px;">
                                    <input class="form-check-input edit-tag-checkbox" type="checkbox"
                                           value="${
                                             match.tagId
                                           }" id="edit-tag-${match.tagId}" ${
                                             isChecked ? "checked" : ""
                                           }>
                                    <label class="form-check-label small text-dark" for="edit-tag-${
                                      match.tagId
                                    }">
                                        ${match.tagName}
                                    </label>
                                </div>`;
            }
          });

          if (hasFoundAny) {
            finalHtml += `
                            <div class="tag-category-block mb-3 w-100">
                                <h6 class="fw-bold text-primary mb-1" style="font-size: 0.85rem;">${categoryName}</h6>
                                <div class="d-flex flex-wrap border-bottom pb-2 mb-2">
                                    ${categoryGroupHtml}
                                </div>
                            </div>`;
          }
        }
        if (checkboxList) {
          checkboxList.innerHTML =
            finalHtml ||
            '<p class="text-muted small">No matching tags found.</p>';
        }
      } catch (err) {
        console.error("Edit Tag UI Error:", err);
      }
    };

    saveBtn.onclick = async () => {
      const id = img.id || img.imageId;
      if (!id) {
        alert("Error: Could not find the ID for this image.");
        return;
      }

      const editInput = document.getElementById(
        "editNotesInput",
      ) as HTMLTextAreaElement | null;
      const newNotes = editInput ? editInput.value : "";

      const selectedCheckboxes = document.querySelectorAll(
        ".edit-tag-checkbox:checked",
      );
      const newTagIds = Array.from(selectedCheckboxes).map((cb) =>
        String((cb as HTMLInputElement).value),
      );

      const oldTagIds = (img.tags || []).map((t: any) =>
        String(t.id || t.tagId),
      );
      const toAdd = newTagIds.filter((tagId) => !oldTagIds.includes(tagId));
      const toRemove = oldTagIds.filter((tagId) => !newTagIds.includes(tagId));

      const modalNotesElem = document.getElementById(
        "modalNotes",
      ) as HTMLElement | null;
      const updatedNotes = editInput?.value || modalNotesElem?.innerText || "";

      console.log("Notes being sent to server:", updatedNotes);

      try {
        await ButterflyAPI.updateImageDetails(id, {
          //description: img.description || "",
          nathansNotes: updatedNotes,
          life_cycle:
            (
              document.getElementById(
                "editLifecycleInput",
              ) as HTMLTextAreaElement
            )?.value || "Adult",
        });

        const tagPromises = [
          ...toAdd.map((tagId) => ButterflyAPI.addTagToImage(tagId, id)),
          ...toRemove.map((tagId) =>
            ButterflyAPI.removeTagFromImage(tagId, id),
          ),
        ];

        await Promise.all(tagPromises);
        alert("Update Successful!");
        const freshSpecies =
          await ButterflyAPI.getSpeciesById(currentSpeciesId);
        await showSpeciesView(freshSpecies);

        bootstrap.Modal.getInstance(
          document.getElementById("imageDetailsModal"),
        ).hide();
      } catch (err: any) {
        console.error("Save failed:", err);
        alert("Error saving: " + err.message);
      }
    };
  };

  const showSpeciesView = async (b) => {
    showView(speciesView);
    if (searchNavBar) searchNavBar.style.display = "none";
    if (filterPanel) {
      filterPanel.style.display = "none";
      filterPanel.classList.remove("show");
    }

    currentSpeciesId = b.id;

    const isAdmin = userRole === "ADMIN";
    UI.populateSpeciesView(b, isAdmin);

    const editSpeciesBtn = document.getElementById("editSpeciesBtn");
    if (editSpeciesBtn && isAdmin) {
      editSpeciesBtn.classList.remove("d-none");

      //workaround for attributes
      editSpeciesBtn.onclick = () => {
        const dynamicContainer = document.getElementById(
          "dynamicSpeciesFields",
        );
        if (dynamicContainer) dynamicContainer.innerHTML = "";

        (document.getElementById("editSpeciesId") as HTMLInputElement).value =
          b.id;
        (document.getElementById("editSpeciesName") as HTMLInputElement).value =
          b.name || "";
        (
          document.getElementById("editSpeciesScientific") as HTMLInputElement
        ).value = b.scientificName || "";
        (
          document.getElementById("editSpeciesOrder") as HTMLInputElement
        ).value = b.orderName || "";
        (
          document.getElementById("editSpeciesFamily") as HTMLInputElement
        ).value = b.family || "";
        (
          document.getElementById("editSpeciesGenus") as HTMLInputElement
        ).value = b.genus || "";
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
      const url = img.url || "assets/img/noimage.jpg";

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
          openImageDetailsModal(img);
        };
      }
    };

    let fetchedImages = [];
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
        url: img.fpath,
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
        // Use : any to avoid the 'never' error from before
        const col = document.createElement("div");
        col.className = "col-4 mb-2 gallery-thumb-wrapper position-relative";
        col.innerHTML = `
            <div class="ratio ratio-1x1 shadow-sm rounded overflow-hidden">
                <img src="${imgObj.url || "assets/img/noimage.jpg"}"
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

        // 1. Safe Image Selection
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

        // 2. Safe Delete Button (Your logic was good, just kept it clean!)
        const deleteBtn = col.querySelector(
          ".delete-single-img-btn",
        ) as HTMLElement | null;
        if (deleteBtn) {
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            // Casting window to any is a quick fix for global functions
            (window as any).handleDeleteSingleImage(imgObj.id);
          };

          col.addEventListener("mouseenter", () => {
            deleteBtn.style.opacity = "0.85";
          });
          col.addEventListener("mouseleave", () => {
            deleteBtn.style.opacity = "0";
          });
        }

        // 3. Safe Append
        if (gridContainer) {
          gridContainer.appendChild(col);
        }
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

      allUniqueTags.forEach((tag) => {
        const tagName = tag.tagName || tag.name;
        const tagId = tag.tagId || tag.id;
        if (tagName) {
          html += `<button class="btn btn-sm btn-outline-secondary filter-pill" data-tag="${tagId}">${tagName}</button>`;
        }
      });
      filterBar.innerHTML = html;
      filterBar.querySelectorAll(".filter-pill").forEach((el) => {
        const btn = el as HTMLElement; // Cast the element to an HTMLElement
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
            ) as HTMLElement; // Cast here too
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
  };
  const refreshGallery = (data = butterflies, page = 1) => {
    currentPage = page;
    const totalPages = Math.ceil(data.length / itemsPerPage);

    // Safety check to keep pages in bounds
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    // Slice the data to only show the 40 items for the current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const slicedData = data.slice(startIndex, endIndex);

    UI.renderGrid(slicedData, (b) => showSpeciesView(b), currentDisplayMode);
    renderPagination(data.length, totalPages);
  };

  const renderPagination = (totalItems, totalPages) => {
    const container = document.getElementById("paginationContainer");
    if (!container) return;

    // Hide pagination if everything fits on one page
    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = `<ul class="pagination mb-0 align-items-center" style="gap: 5px; font-size: 1.1rem;">`;

    // "Previous" Button
    const prevDisabled = currentPage === 1 ? "disabled opacity-50" : "";
    html += `
      <li class="page-item ${prevDisabled}">
        <a class="page-link border-0 fw-bold bg-transparent" href="#" data-page="${currentPage - 1}" style="color: #0399b0;">&lt; Previous</a>
      </li>
    `;

    // Google-style sliding window for page numbers
    let startPage = Math.max(1, currentPage - 4);
    let endPage = Math.min(totalPages, startPage + 9);
    if (endPage - startPage < 9) {
      startPage = Math.max(1, endPage - 9);
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        // Active page styling (Light blue circle, dark blue text)
        html += `
          <li class="page-item active">
            <a class="page-link rounded-circle d-flex justify-content-center align-items-center" href="#" data-page="${i}" style="width: 35px; height: 35px; background-color: #e8f0fe; color: #1a73e8; border: none; font-weight: bold;">${i}</a>
          </li>
        `;
      } else {
        // Inactive page styling
        html += `
          <li class="page-item">
            <a class="page-link rounded-circle d-flex justify-content-center align-items-center border-0 text-muted bg-transparent" href="#" data-page="${i}" style="width: 35px; height: 35px;">${i}</a>
          </li>
        `;
      }
    }

    // "Next" Button
    const nextDisabled =
      currentPage === totalPages ? "disabled opacity-50" : "";
    html += `
      <li class="page-item ${nextDisabled}">
        <a class="page-link border-0 fw-bold bg-transparent" href="#" data-page="${currentPage + 1}" style="color: #0399b0;">Next &gt;</a>
      </li>
    `;

    html += `</ul>`;
    container.innerHTML = html;

    // Add Click Listeners to the buttons
    container.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetBtn = e.currentTarget as HTMLElement;

        // Ignore clicks if the button is disabled or already active
        if (
          targetBtn.parentElement?.classList.contains("disabled") ||
          targetBtn.parentElement?.classList.contains("active")
        )
          return;

        const targetPage = parseInt(targetBtn.getAttribute("data-page") || "1");

        // Refresh with the new page!
        refreshGallery(currentFilteredData, targetPage);

        // Smoothly scroll back up to the top of the gallery so the user sees the new top row
        const portfolioSection = document.getElementById("portfolio");
        if (portfolioSection) {
          window.scrollTo({
            top: portfolioSection.offsetTop - 80,
            behavior: "smooth",
          });
        }
      });
    });
  };

  async function loadStudentData(email) {
    if (!email) return;
    try {
      const dashboardData = await ButterflyAPI.getStudentDashboard(email);
      let myTeam = dashboardData ? dashboardData.team : null;
      let myApiKey =
        dashboardData && dashboardData.apiKey
          ? dashboardData.apiKey
          : "No active API Key found";

      if (!myTeam) {
        const allTeams = await ButterflyAPI.getAllTeams();
        for (const t of allTeams) {
          const members = await ButterflyAPI.getTeamMembers(t.id);
          if (members.some((m) => m.email === email)) {
            myTeam = t;
            const keys = await ButterflyAPI.getAllApiKeys();
            const teamKey = keys.find(
              (k) => k.teamName === t.name && k.active !== false,
            );
            if (teamKey) myApiKey = teamKey.keyVal;
            break;
          }
        }
      }

      const container = document.getElementById("studentTeamContent");
      if (!container) return;

      if (!myTeam) {
        container.innerHTML = `
                    <h2 class="text-muted mb-4">My Team Overview</h2>
                    <div class="card shadow-sm border-0 bg-light p-4">
                        <div class="card-body text-center py-5">
                            <i class="fas fa-users-slash fa-3x text-muted mb-3"></i>
                            <h4 class="fw-bold text-secondary">Not Assigned to a Team</h4>
                            <p class="text-muted mb-0">You haven't been assigned to a team yet. Check back later!</p>
                        </div>
                    </div>`;
        return;
      }

      const members = await ButterflyAPI.getTeamMembers(myTeam.id);
      const membersHtml = members
        .map(
          (m) =>
            `<span class="badge bg-primary fs-6 me-2 mb-2">${m.username}</span>`,
        )
        .join("");

      container.innerHTML = `
                <h2 class="text-muted mb-4">My Team Overview</h2>
                <div class="card shadow-sm border-0 bg-light p-4">
                    <div class="card-body">
                        <h4 class="fw-bold text-primary mb-1">${myTeam.name}</h4>
                        <p class="text-muted mb-4">${myTeam.projectName} | ${myTeam.semester}</p>
                        <div class="mb-4">
                            <h6 class="fw-bold text-dark mb-2"><i class="fas fa-users me-2"></i>Team Members</h6>
                            <div>${membersHtml}</div>
                        </div>
                        <div class="mb-2">
                            <h6 class="fw-bold text-dark mb-2"><i class="fas fa-key me-2"></i>Project API Key</h6>
                            <div class="bg-white border rounded p-3 text-break font-monospace text-primary fw-bold shadow-sm">${myApiKey}</div>
                        </div>
                    </div>
                </div>`;
    } catch (error) {
      console.error("Error loading student dashboard:", error);
    }
  }

  let allCachedUsers = [];
  let globalUserTeamMap = {};

  async function loadAdminData() {
    const [users, teams] = await Promise.all([
      ButterflyAPI.getAllUsers(),
      ButterflyAPI.getAllTeams(),
    ]);
    users.sort((a, b) =>
      a.username.toLowerCase().localeCompare(b.username.toLowerCase()),
    );
    allCachedUsers = users;

    globalUserTeamMap = {};
    const memberResults = await Promise.all(
      teams.map((t) => ButterflyAPI.getTeamMembers(t.id)),
    );
    teams.forEach((t, i) => {
      for (const m of memberResults[i]) {
        globalUserTeamMap[m.userId] = t.name;
      }
    });

    renderAllUsersTable(allCachedUsers);
    await loadTeams();
  }

  function renderAllUsersTable(usersList) {
    const tbody = document.getElementById("allUsersTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    usersList.forEach((u) => {
      const tr = document.createElement("tr");
      const currentRole = u.uType || u.userType || u.utype;
      const badgeClass = currentRole === "ADMIN" ? "bg-danger" : "bg-primary";
      const teamName =
        globalUserTeamMap[u.userId] ||
        '<span class="text-muted fst-italic">Unassigned</span>';

      tr.innerHTML = `
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td><span class="badge ${badgeClass}">${currentRole}</span></td>
                <td><span class="fw-bold text-secondary">${teamName}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="window.openEditUserModal('${u.userId}', '${u.username}', '${u.email}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="window.toggleUserRole('${u.userId}', '${currentRole}')">Toggle Role</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.deleteSystemUser('${u.userId}')"><i class="fas fa-trash"></i></button>
                </td>`;
      tbody.appendChild(tr);
    });
  }

  const adminUserSearch = document.getElementById("adminUserSearch");
  if (adminUserSearch) {
    adminUserSearch.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();

      const filtered = allCachedUsers.filter((u: any) =>
        u.username.toLowerCase().includes(query),
      );
      renderAllUsersTable(filtered);
    });
  }

  async function loadTeams() {
    const [teams, unassigned, allKeys] = await Promise.all([
      ButterflyAPI.getAllTeams(),
      ButterflyAPI.getUnassignedStudents(),
      ButterflyAPI.getAllApiKeys(),
    ]);
    const container = document.getElementById("teamsContainer");
    if (!container) return;

    container.innerHTML = "";

    if (teams.length === 0) {
      container.innerHTML = `<p class="text-muted fst-italic">No teams yet. Click "Create Team" to get started.</p>`;
      return;
    }

    let studentOptions = `<option value="">Select a student...</option>`;
    unassigned.forEach((u) => {
      studentOptions += `<option value="${u.userId}">${u.username} — ${u.email}</option>`;
    });

    const membersByTeam = await Promise.all(
      teams.map((t) => ButterflyAPI.getTeamMembers(t.id)),
    );

    for (let idx = 0; idx < teams.length; idx++) {
      const team = teams[idx];
      const members = membersByTeam[idx];
      const teamKey = allKeys.find((k) => k.teamName === team.name);
      const isActive =
        teamKey && teamKey.active !== false && teamKey.status !== "INACTIVE";

      let membersHtml = "";
      if (members.length === 0) {
        membersHtml = `<span class="text-muted fst-italic small">No members yet</span>`;
      } else {
        membersHtml = members
          .map((m) => {
            const initials = m.username.substring(0, 2).toUpperCase();
            return `
                        <span class="d-inline-flex align-items-center gap-1 me-1 mb-1 px-2 py-1 rounded-pill border small"
                              style="background: #f8f9fa; font-size: 0.8rem;">
                            <span class="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold"
                                  style="width:20px; height:20px; background:#EEEDFE; color:#3C3489; font-size:9px;">
                                ${initials}
                            </span>
                            ${m.username}
                            <span style="cursor:pointer; font-size:10px; color:#888; margin-left:2px;"
                                  onclick="window.removeStudentFromTeam('${team.id}', '${m.userId}')">✕</span>
                        </span>`;
          })
          .join("");
      }

      let apiKeyHtml = "";
      if (!teamKey) {
        apiKeyHtml = `
                    <div class="d-flex align-items-center justify-content-between p-2 rounded"
                         style="background:#f8f9fa; border: 0.5px solid #dee2e6;">
                        <span class="text-muted small fst-italic">No API key found</span>
                        <button class="btn btn-sm btn-outline-secondary" style="font-size:0.75rem;"
                                onclick="window.regenerateTeamKey('${team.name}', '${team.projectName}', '${team.semester}')">
                            <i class="fas fa-key me-1"></i>Generate Key
                        </button>
                    </div>`;
      } else {
        const expiresText = teamKey.expiration
          ? "Expires " + new Date(teamKey.expiration).toLocaleDateString()
          : "No expiry set";
        apiKeyHtml = `
                    <div class="p-2 rounded" style="background:#f8f9fa; border: 0.5px solid #dee2e6;">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="badge rounded-pill px-2 py-1" style="font-size:0.7rem;
                                background: ${isActive ? "#d1fae5" : "#fef3c7"};
                                color: ${isActive ? "#065f46" : "#92400e"};">
                                ${isActive ? "Active" : "Inactive"}
                            </span>
                            <span class="text-muted" style="font-size:0.7rem;">${expiresText}</span>
                        </div>
                        <div class="font-monospace text-break mb-2" style="font-size:0.72rem; color:#555; word-break:break-all;">
                            ${teamKey.keyVal}
                        </div>
                        <div class="d-flex flex-wrap gap-1">
                            <button class="btn btn-sm btn-outline-secondary" style="font-size:0.72rem;"
                                    onclick="window.toggleApiKeyStatus('${
                                      teamKey.id
                                    }', ${isActive})">
                                ${isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button class="btn btn-sm btn-outline-warning" style="font-size:0.72rem;"
                                    onclick="window.openExtendModal('${
                                      teamKey.id
                                    }')">
                                Extend
                            </button>
                            <button class="btn btn-sm btn-outline-primary" style="font-size:0.72rem;"
                                    onclick="window.regenerateTeamKey('${
                                      team.name
                                    }', '${team.projectName}', '${
                                      team.semester
                                    }')">
                                Regenerate
                            </button>
                            <button class="btn btn-sm btn-outline-danger" style="font-size:0.72rem;"
                                    onclick="window.deleteApiKey('${
                                      teamKey.id
                                    }')">
                                Delete Key
                            </button>
                        </div>
                    </div>`;
      }

      const card = document.createElement("div");
      card.className = "card shadow-sm border-0 mb-3";
      card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div>
                            <h5 class="fw-bold mb-0" style="color: #0399b0;">${team.name}</h5>
                            <div class="text-muted small">${team.projectName} &nbsp;·&nbsp; ${team.semester}</div>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" style="font-size:0.72rem;"
                                onclick="window.deleteTeam('${team.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <hr class="my-2">
                    <div class="mb-1 small fw-bold text-dark">Members</div>
                    <div class="mb-2 d-flex flex-wrap">${membersHtml}</div>
                    <div class="input-group input-group-sm mb-3">
                        <select class="form-select" id="assignStudentSelect-${team.id}" style="font-size:0.8rem;">
                            ${studentOptions}
                        </select>
                        <button class="btn btn-outline-success" style="font-size:0.8rem;"
                                onclick="window.addStudentToTeam('${team.id}')">
                            + Add
                        </button>
                    </div>
                    <div class="mb-1 small fw-bold text-dark">API Key</div>
                    ${apiKeyHtml}
                </div>`;
      container.appendChild(card);
    }
  }

  window.deleteSystemUser = async (userId) => {
    if (confirm("Delete this user permanently?")) {
      await ButterflyAPI.deleteUser(userId);
      await loadAdminData();
    }
  };

  window.toggleUserRole = async (userId, currentRole) => {
    const targetUser = allCachedUsers.find(
      (u: any) => u.userId.toString() === userId.toString(),
    ) as any; // Cast the result to any here too!

    if (currentRole === "ADMIN") {
      const adminCount = allCachedUsers.filter(
        (u: any) => (u.uType || u.userType || u.utype) === "ADMIN",
      ).length;

      if (adminCount <= 1) {
        return alert(
          "Action Denied: The system must always have at least one administrator.",
        );
      }

      if (targetUser && targetUser.email === userEmail) {
        const proceed = confirm(
          "WARNING: You are about to remove your own admin privileges! You will be logged out immediately if you proceed. Do you want to continue?",
        );
        if (!proceed) return;
        try {
          await ButterflyAPI.makeStudent(userId);
          alert("Your admin privileges have been revoked. Logging out...");
          location.reload();
          return;
        } catch (error) {
          return alert("Failed to change role.");
        }
      }
      await ButterflyAPI.makeStudent(userId);
    } else {
      await ButterflyAPI.makeAdmin(userId);
    }
    await loadAdminData();
  };

  window.deleteTeam = async (teamId) => {
    if (confirm("Delete this team entirely?")) {
      await ButterflyAPI.deleteTeam(teamId);
      await loadAdminData();
    }
  };

  window.addStudentToTeam = async (teamId) => {
    const select = document.getElementById(`assignStudentSelect-${teamId}`);
    const userId = (select as HTMLInputElement).value;
    if (!userId) return alert("Please select a student first.");
    try {
      await ButterflyAPI.addTeamMember(teamId, userId);
      await loadAdminData();
    } catch (error: any) {
      alert("Could not add student: " + error.message);
    }
  };

  window.removeStudentFromTeam = async (teamId, userId) => {
    if (confirm("Remove this student from the team?")) {
      try {
        await ButterflyAPI.removeTeamMember(teamId, userId);
        await loadAdminData();
      } catch (error: any) {
        alert("Could not remove student: " + error.message);
      }
    }
  };

  window.toggleApiKeyStatus = async (keyId, currentlyActive) => {
    if (currentlyActive) {
      await ButterflyAPI.deactivateApiKey(keyId);
    } else {
      await ButterflyAPI.activateApiKey(keyId);
    }
    await loadAdminData();
  };

  window.regenerateTeamKey = async (teamName, projectName, semester) => {
    if (
      confirm(
        "Regenerate the API key for " +
          teamName +
          "? The old key will stop working immediately.",
      )
    ) {
      try {
        await ButterflyAPI.generateApiKey({ teamName, projectName, semester });
        await loadAdminData();
      } catch (err: any) {
        alert("Failed to regenerate key: " + err.message);
      }
    }
  };

  window.deleteApiKey = async (keyId) => {
    if (
      confirm(
        "Delete this API key permanently? Students using it will lose access.",
      )
    ) {
      try {
        await ButterflyAPI.deleteApiKey(keyId);
        await loadAdminData();
      } catch (err: any) {
        alert("Failed to delete key: " + err.message);
      }
    }
  };

  window.handleDeleteSingleImage = async (imageId) => {
    if (confirm("Delete this specific photo?")) {
      try {
        await ButterflyAPI.deleteImage(imageId);
        alert("Image Deleted");
        if (currentSpeciesId) {
          const freshButterfly =
            await ButterflyAPI.getSpeciesById(currentSpeciesId);
          await showSpeciesView(freshButterfly);
        } else {
          location.reload();
        }
      } catch (err: any) {
        alert("Error: " + err.message);
      }
    }
  };

  window.openExtendModal = (keyId: string | number) => {
    const extendInput = document.getElementById("extendKeyId");
    if (extendInput) (extendInput as HTMLInputElement).value = String(keyId);
    const modalElem = document.getElementById("adminExtendKeyModal");
    if (modalElem) new bootstrap.Modal(modalElem).show();
  };

  window.openEditUserModal = (userId, currentUsername, currentEmail) => {
    (document.getElementById("editUserId") as HTMLInputElement).value = userId;
    (document.getElementById("editUsername") as HTMLInputElement).value =
      currentUsername;
    (document.getElementById("editEmail") as HTMLInputElement).value =
      currentEmail;
    (document.getElementById("editPassword") as HTMLInputElement).value = "";
    new bootstrap.Modal(document.getElementById("adminEditUserModal")).show();
  };

  const adminCreateTeamForm = document.getElementById("adminCreateTeamForm");
  if (adminCreateTeamForm) {
    adminCreateTeamForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const teamData = {
        name: (document.getElementById("newCreateTeamName") as HTMLInputElement)
          .value,
        projectName: (
          document.getElementById("newCreateProjectName") as HTMLInputElement
        ).value,
        semester: (
          document.getElementById("newCreateSemester") as HTMLInputElement
        ).value,
      };
      await ButterflyAPI.createTeam(teamData);
      await loadAdminData();
      (e.target as HTMLFormElement).reset();
      bootstrap.Modal.getInstance(
        document.getElementById("adminCreateTeamModal"),
      ).hide();
    });
  }

  const adminAddUserForm = document.getElementById("adminAddUserForm");
  if (adminAddUserForm) {
    adminAddUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameVal = (
        document.getElementById("adminNewUsername") as HTMLInputElement
      ).value;
      const emailVal = (
        document.getElementById("adminNewEmail") as HTMLInputElement
      ).value;
      const passVal = (
        document.getElementById("adminNewPassword") as HTMLInputElement
      ).value;
      const roleVal = (
        document.getElementById("adminNewRole") as HTMLInputElement
      ).value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal))
        return alert("Please enter a valid email address.");
      if (usernameVal.length < 5)
        return alert("Username must be at least 5 characters long.");
      if (passVal.length < 7)
        return alert("Password must be at least 7 characters long.");

      try {
        const allUsers = await ButterflyAPI.getAllUsers();
        if (
          allUsers.some(
            (u) => u.username.toLowerCase() === usernameVal.toLowerCase(),
          )
        ) {
          return alert("This username already exists.");
        }
        await ButterflyAPI.adminCreateAccount({
          username: usernameVal,
          email: emailVal,
          password: passVal,
          utype: roleVal,
        });
        await loadAdminData();
        (e.target as HTMLFormElement).reset();
        bootstrap.Modal.getInstance(
          document.getElementById("adminAddUserModal"),
        ).hide();
        alert("User successfully created!");
      } catch (error: any) {
        alert("Could not create user: " + error.message);
      }
    });
  }

  const adminEditUserForm = document.getElementById("adminEditUserForm");
  if (adminEditUserForm) {
    adminEditUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = (document.getElementById("editUserId") as HTMLInputElement)
        .value;
      const newUsername = (
        document.getElementById("editUsername") as HTMLInputElement
      ).value;
      const newEmail = (
        document.getElementById("editEmail") as HTMLInputElement
      ).value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail))
        return alert("Please enter a valid email address.");
      if (newUsername.length < 5)
        return alert("Username must be at least 5 characters long.");

      try {
        const allUsers = await ButterflyAPI.getAllUsers();
        if (
          allUsers.some(
            (u) =>
              u.username.toLowerCase() === newUsername.toLowerCase() &&
              u.userId.toString() !== userId.toString(),
          )
        ) {
          return alert("This username already exists.");
        }
        await ButterflyAPI.updateUsername(userId, newUsername);
        await ButterflyAPI.updateEmail(userId, newEmail);

        const newPassword = (
          document.getElementById("editPassword") as HTMLInputElement
        ).value.trim();
        if (newPassword !== "") {
          if (newPassword.length < 7)
            return alert("Password must be at least 7 characters long.");
          await ButterflyAPI.resetPassword(newEmail, newPassword);
        }
        await loadAdminData();
        bootstrap.Modal.getInstance(
          document.getElementById("adminEditUserModal"),
        ).hide();
        alert("User successfully updated!");
      } catch (error) {
        alert("Failed to update user.");
      }
    });
  }

  if (adminGenerateKeyForm) {
    adminGenerateKeyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await ButterflyAPI.generateApiKey({
        teamName: (document.getElementById("newTeamName") as HTMLInputElement)
          .value,
        projectName: (
          document.getElementById("newProjectName") as HTMLInputElement
        ).value,
        semester: (document.getElementById("newSemester") as HTMLInputElement)
          .value,
      });
      await loadAdminData();
      (e.target as HTMLFormElement).reset();
      const modalElem = document.getElementById("adminGenerateKeyModal");
      if (modalElem) bootstrap.Modal.getInstance(modalElem).hide();
    });
  }

  if (adminExtendKeyForm) {
    adminExtendKeyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const keyId = (document.getElementById("extendKeyId") as HTMLInputElement)
        .value;
      const months = (
        document.getElementById("extendMonths") as HTMLInputElement
      ).value;
      await ButterflyAPI.extendApiKey(keyId, months);
      await loadAdminData();
      (e.target as HTMLFormElement).reset();
      const modalElem = document.getElementById("adminExtendKeyModal");
      if (modalElem) bootstrap.Modal.getInstance(modalElem).hide();
    });
  }

  const universalUploadForm = document.getElementById("universalUploadForm");

  // Removed "newScientific" from the general capitalize-everything list
  const autoCapFields = ["newName", "newOrderName", "newFamily", "newGenus"];
  autoCapFields.forEach((id) => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      input.addEventListener("input", function (e) {
        const target = e.target as HTMLInputElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        target.value = target.value.replace(/\b\w/g, (char) =>
          char.toUpperCase(),
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

      // Split by spaces to handle individual words as they type
      let words = target.value.split(" ");

      if (words.length > 0 && words[0].length > 0) {
        // Capitalize first letter of first word, lowercase the rest of it
        words[0] =
          words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
      }

      // Force lowercase on the second word (and any accidental subsequent words)
      for (let i = 1; i < words.length; i++) {
        words[i] = words[i].toLowerCase();
      }

      // Rejoin and set value
      target.value = words.join(" ");

      // Restore cursor position so it doesn't jump to the end of the input
      target.setSelectionRange(start, end);

      // Handle the Genus auto-fill
      if (genusInput) {
        const trimmedWords = target.value.trim().split(/\s+/);
        genusInput.value = trimmedWords[0] ? trimmedWords[0] : "";
      }
    });
  }

  if (universalUploadForm) {
    const uploadModal = document.getElementById("addButterflyModal");

    if (uploadModal) {
      uploadModal.addEventListener("show.bs.modal", async () => {
        await TagManager.initTagContainer();

        const listContainer = document.getElementById("speciesDropdownList");
        const btnText = document.getElementById("speciesDropdownText");
        const hiddenInput = document.getElementById(
          "speciesSelectorValue",
        ) as HTMLInputElement;
        const newSpeciesFields = document.getElementById("newSpeciesFields");
        const searchInput = document.getElementById(
          "searchSpeciesInput",
        ) as HTMLInputElement;

        // --- Phase Elements ---
        const phase1 = document.getElementById("uploadPhase1");
        const phase2 = document.getElementById("uploadPhase2");
        const btnNext = document.getElementById("btnNextToPhase2");
        const btnBack = document.getElementById("btnBackToPhase1");

        // --- Reset Wizard to Phase 1 ---
        if (phase1 && phase2) {
          phase1.classList.remove("d-none");
          phase2.classList.add("d-none");
        }

        if (!listContainer || !hiddenInput || !btnText) return;

        // Reset species defaults
        hiddenInput.value = "NEW";
        btnText.innerHTML = `<span class="text-primary fw-bold">Create New Species</span>`;
        if (newSpeciesFields) newSpeciesFields.style.display = "block";
        if (searchInput) searchInput.value = "";

        // Build dropdown list
        let html = `<button type="button" class="dropdown-item species-option border-bottom py-2" data-value="NEW"><span class="text-primary fw-bold">Create New Species</span></button>`;
        const sortedForDropdown = [...butterflies].sort((a, b) => {
          const nameA =
            currentDisplayMode === "scientific" && a.scientificName
              ? a.scientificName
              : a.name;
          const nameB =
            currentDisplayMode === "scientific" && b.scientificName
              ? b.scientificName
              : b.name;
          return (nameA || "")
            .toLowerCase()
            .localeCompare((nameB || "").toLowerCase());
        });

        sortedForDropdown.forEach((s) => {
          const displayName =
            currentDisplayMode === "scientific" && s.scientificName
              ? s.scientificName
              : s.name;
          html += `<button type="button" class="dropdown-item species-option py-2" data-value="${s.id}">${displayName}</button>`;
        });
        listContainer.innerHTML = html;

        // Dropdown selection
        listContainer.querySelectorAll(".species-option").forEach((item) => {
          item.addEventListener("click", (e) => {
            const btn = e.currentTarget as HTMLElement;
            const val = btn.getAttribute("data-value") || "NEW";
            hiddenInput.value = val;
            btnText.innerHTML = btn.innerHTML;
            if (newSpeciesFields) {
              newSpeciesFields.style.display = val === "NEW" ? "block" : "none";
            }
            const bsDropdown = bootstrap.Dropdown.getInstance(
              document.getElementById("speciesDropdownBtn"),
            );
            if (bsDropdown) bsDropdown.hide();
          });
        });

        // Dropdown Search
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

        // --- Wizard Navigation Logic ---
        if (btnNext && phase1 && phase2) {
          btnNext.onclick = () => {
            // Validate Phase 1 before allowing next
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

        // --- NEW IMAGE METADATA & PREVIEW LOGIC ---

        // Clean up old URLs
        selectedUploadFiles.forEach((d) => URL.revokeObjectURL(d.url));
        selectedUploadFiles = [];
        currentSelectedFileIndex = -1;

        const dropZone = document.getElementById("imageDropZone");
        const fileInput = document.getElementById(
          "newImageFile",
        ) as HTMLInputElement;
        const fileListContainer = document.getElementById("selectedFilesList");
        const fileCounter = document.getElementById("uploadFileCounter");

        const previewSection = document.getElementById("imagePreviewSection");
        const noImagePrompt = document.getElementById("noImageSelectedPrompt");
        const previewImg = document.getElementById(
          "uploadImagePreview",
        ) as HTMLImageElement;
        const notesInput = document.getElementById(
          "nathanNotes",
        ) as HTMLTextAreaElement;
        const tagCheckboxes = () =>
          document.querySelectorAll(
            '#tagCheckboxContainer input[type="checkbox"]',
          ) as NodeListOf<HTMLInputElement>;

        const saveCurrentMetadata = () => {
          if (
            currentSelectedFileIndex >= 0 &&
            currentSelectedFileIndex < selectedUploadFiles.length
          ) {
            if (notesInput)
              selectedUploadFiles[currentSelectedFileIndex].notes =
                notesInput.value;
            const selectedTags = Array.from(tagCheckboxes())
              .filter((cb) => cb.checked)
              .map((cb) => cb.value);
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

            // Set the checkboxes for this specific image
            tagCheckboxes().forEach((cb) => {
              cb.checked = data.tags.includes(cb.value);
            });
          } else {
            if (previewSection && noImagePrompt) {
              previewSection.classList.add("d-none");
              noImagePrompt.classList.remove("d-none");
            }
          }
        };

        const renderFileList = () => {
          if (!fileListContainer) return;

          if (fileCounter) {
            fileCounter.innerText = `${selectedUploadFiles.length} file${selectedUploadFiles.length === 1 ? "" : "s"} selected`;
          }

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
                        <i class="fas fa-image me-2 ${index === currentSelectedFileIndex ? "text-white" : "text-primary"}"></i>${data.file.name}
                    </span>
                    <button type="button" class="btn btn-sm btn-link p-0 remove-file-btn ${index === currentSelectedFileIndex ? "text-white" : "text-danger"}" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;

            // Click a row to preview/edit that specific image
            li.addEventListener("click", () => {
              saveCurrentMetadata();
              currentSelectedFileIndex = index;
              renderFileList();
              updatePreviewPanel();
            });

            fileListContainer.appendChild(li);
          });

          // X Button logic
          fileListContainer
            .querySelectorAll(".remove-file-btn")
            .forEach((btn) => {
              btn.addEventListener("click", (e) => {
                e.stopPropagation();
                saveCurrentMetadata();
                const idx = parseInt(
                  (e.currentTarget as HTMLElement).getAttribute("data-index") ||
                    "0",
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
          // Auto select the first newly added image if nothing was selected
          if (
            currentSelectedFileIndex === -1 &&
            selectedUploadFiles.length > 0
          ) {
            currentSelectedFileIndex = 0;
          }
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

        // Listen to changes in inputs to auto-save to memory array
        if (notesInput) {
          notesInput.addEventListener("input", saveCurrentMetadata);
        }
        tagCheckboxes().forEach((cb) => {
          cb.addEventListener("change", saveCurrentMetadata);
        });

        // initial clear
        renderFileList();
        updatePreviewPanel();
      });
    }

    universalUploadForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();

      // Force save metadata of the currently previewed image before submitting
      const notesInput = document.getElementById(
        "nathanNotes",
      ) as HTMLTextAreaElement;
      const tagCheckboxes = () =>
        document.querySelectorAll(
          '#tagCheckboxContainer input[type="checkbox"]',
        ) as NodeListOf<HTMLInputElement>;
      if (
        currentSelectedFileIndex >= 0 &&
        currentSelectedFileIndex < selectedUploadFiles.length
      ) {
        if (notesInput)
          selectedUploadFiles[currentSelectedFileIndex].notes =
            notesInput.value;
        selectedUploadFiles[currentSelectedFileIndex].tags = Array.from(
          tagCheckboxes(),
        )
          .filter((cb) => cb.checked)
          .map((cb) => cb.value);
      }

      if (selectedUploadFiles.length === 0) {
        return alert("Please select at least one image file.");
      }

      const hiddenInput = document.getElementById(
        "speciesSelectorValue",
      ) as HTMLInputElement;
      let speciesId = hiddenInput.value;

      // 1. Create Species if NEW
      if (speciesId === "NEW") {
        const name = (
          document.getElementById("newName") as HTMLInputElement
        ).value.trim();
        const scientificName = (
          document.getElementById("newScientific") as HTMLInputElement
        ).value.trim();

        try {
          const newSpecies = await ButterflyAPI.create({
            name: name,
            scientificName: scientificName,
            description: (
              document.getElementById("newDescription") as HTMLTextAreaElement
            ).value,
            orderName: document.getElementById("newOrderName")
              ? (document.getElementById("newOrderName") as HTMLInputElement)
                  .value
              : "",
            family: document.getElementById("newFamily")
              ? (document.getElementById("newFamily") as HTMLInputElement).value
              : "",
            genus: document.getElementById("newGenus")
              ? (document.getElementById("newGenus") as HTMLInputElement).value
              : "",
          });
          speciesId = newSpecies.id;
        } catch (err: any) {
          return alert("Failed to create species: " + err.message);
        }
      }

      // 2. Upload Images individually with their specific metadata
      let successCount = 0;
      let failCount = 0;

      for (const data of selectedUploadFiles) {
        const formData = new FormData();
        formData.append("file", data.file);
        formData.append("species_id", speciesId);
        formData.append("nathansNotes", data.notes); // Specific notes!
        if (data.tags.length > 0) {
          data.tags.forEach((id) => formData.append("tagId", id)); // Specific tags!
        }

        try {
          await ButterflyAPI.uploadImage(formData);
          successCount++;
        } catch (err) {
          console.error("Failed to upload " + data.file.name + ":", err);
          failCount++;
        }
      }

      if (failCount === 0) {
        alert(
          successCount +
            " image" +
            (successCount > 1 ? "s" : "") +
            " uploaded successfully!",
        );
      } else {
        alert(
          successCount +
            " uploaded, " +
            failCount +
            " failed. Check console for details.",
        );
      }

      // Cleanup & Reset
      selectedUploadFiles.forEach((d) => URL.revokeObjectURL(d.url));
      selectedUploadFiles = [];
      const fileListContainer = document.getElementById("selectedFilesList");
      if (fileListContainer) fileListContainer.innerHTML = "";

      (e.target as HTMLFormElement).reset();
      const selectorAfterReset = document.getElementById("speciesSelector");
      if (selectorAfterReset)
        (selectorAfterReset as HTMLInputElement).value = "NEW";
      const newSpeciesFields = document.getElementById("newSpeciesFields");
      if (newSpeciesFields) newSpeciesFields.style.display = "block";

      bootstrap.Modal.getInstance(
        document.getElementById("addButterflyModal"),
      ).hide();
      butterflies = await ButterflyAPI.getAll();
      applyAllFilters();
    });
  }

  const addImageToSpeciesForm = document.getElementById(
    "addImageToSpeciesForm",
  );
  if (addImageToSpeciesForm) {
    addImageToSpeciesForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const speciesId = (
        document.getElementById("targetSpeciesId") as HTMLInputElement
      ).value;
      const fileInput = document.getElementById(
        "speciesImageFiles",
      ) as HTMLInputElement;
      const notes = (
        document.getElementById("speciesImageNotes") as HTMLInputElement
      ).value;

      if (!fileInput.files || fileInput.files.length === 0) {
        return alert("Please select at least one image.");
      }

      const files: File[] = Array.from(fileInput.files as FileList);

      let successCount = 0;
      let failCount = 0;

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
        }!`,
      );
      (e.target as HTMLFormElement).reset();
      bootstrap.Modal.getInstance(
        document.getElementById("addImageToSpeciesModal"),
      ).hide();

      const freshSpecies = await ButterflyAPI.getSpeciesById(speciesId);
      await showSpeciesView(freshSpecies);
      butterflies = await ButterflyAPI.getAll();
    });
  }

  const editSpeciesForm = document.getElementById("editSpeciesForm");
  if (editSpeciesForm) {
    editSpeciesForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const speciesId = (
        document.getElementById("editSpeciesId") as HTMLInputElement
      ).value;
      let currentDescValue =
        (document.getElementById("editSpeciesDescription") as HTMLInputElement)
          .value || "";
      let cleanBaseDescription = currentDescValue
        .replace(/\[\[.*?\]\]/g, "")
        .trim();
      const customInputs = document.querySelectorAll(".custom-species-input");
      let extraString = "";

      customInputs.forEach((input) => {
        const label = input.getAttribute("data-label");
        const value = (input as HTMLInputElement).value;
        if (label && value && value.trim() !== "") {
          extraString += ` [[${label}: ${value.trim()}]]`;
        }
      });
      const finalDescription = (cleanBaseDescription + extraString).trim();
      console.log("Total Description Length:", finalDescription.length);

      const data = {
        name: (document.getElementById("editSpeciesName") as HTMLInputElement)
          .value,
        scientificName:
          (document.getElementById("editSpeciesScientific") as HTMLInputElement)
            .value || "",
        description: finalDescription,
        orderName:
          (document.getElementById("editSpeciesOrder") as HTMLInputElement)
            .value || "",
        family:
          (document.getElementById("editSpeciesFamily") as HTMLInputElement)
            .value || "",
        genus:
          (document.getElementById("editSpeciesGenus") as HTMLInputElement)
            .value || "",
      };

      try {
        await ButterflyAPI.updateSpecies(speciesId, data);
        const editModal = document.getElementById("editSpeciesModal");
        const modalInstance = bootstrap.Modal.getInstance(editModal);
        if (modalInstance) modalInstance.hide();
        butterflies = await ButterflyAPI.getAll();

        const freshSpecies = await ButterflyAPI.getSpeciesById(speciesId);
        await showSpeciesView(freshSpecies);

        if (typeof refreshGallery === "function") refreshGallery();

        alert("Species updated successfully!");
      } catch (err: any) {
        console.error("Update failed:", err);
        alert("Update failed: " + err.message);
      }
    });
  }

  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      const currentSpecies = butterflies.find(
        (b) =>
          b.name ===
          (document.getElementById("speciesName") as HTMLElement).innerText,
      );
      if (currentSpecies) showSpeciesView(currentSpecies);
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      goToGallery();
    });
  }

  const navBrand = document.getElementById("navBrandLink");
  if (navBrand) {
    navBrand.addEventListener("click", () => {
      goToGallery();
    });
  }

  if (viewGalleryBtn) {
    viewGalleryBtn.addEventListener("click", () => {
      goToGallery();
    });
  }

  if (viewTeamBtn) {
    viewTeamBtn.addEventListener("click", async () => {
      showView(teamView);
      if (searchNavBar) searchNavBar.style.display = "none";
      viewTeamBtn.classList.add("active");
      if (viewGalleryBtn) viewGalleryBtn.classList.remove("active");

      if (filterPanel) {
        filterPanel.style.display = "none";
        filterPanel.classList.remove("show");
      }

      if (userRole === "ADMIN") {
        if (adminTeamContent) adminTeamContent.style.display = "block";
        if (studentTeamContent) studentTeamContent.style.display = "none";
        await loadAdminData();
      } else {
        if (adminTeamContent) adminTeamContent.style.display = "none";
        if (studentTeamContent) studentTeamContent.style.display = "block";
        await loadStudentData(userEmail);
      }
    });
  }

  let searchTimeout;

  const applyAllFilters = async () => {
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

    const query = searchInput
      ? (searchInput as HTMLInputElement).value.toLowerCase()
      : "";

    let filtered = butterflies;

    if (checkedOrders.length > 0) {
      filtered = filtered.filter((b) => checkedOrders.includes(b.orderName));
    }
    if (checkedFamilies.length > 0) {
      filtered = filtered.filter((b) => checkedFamilies.includes(b.family));
    }
    if (query) {
      filtered = filtered.filter((b) => {
        if (currentDisplayMode === "scientific") {
          return (b.scientificName || "").toLowerCase().includes(query);
        } else {
          return (b.name || "").toLowerCase().includes(query);
        }
      });
    }

    filtered.sort((a, b) => {
      // Determine which name to sort by based on the current toggle state
      const nameA =
        currentDisplayMode === "scientific" && a.scientificName
          ? a.scientificName
          : a.name;
      const nameB =
        currentDisplayMode === "scientific" && b.scientificName
          ? b.scientificName
          : b.name;

      // Compare alphabetically, handling any undefined values gracefully
      return (nameA || "")
        .toLowerCase()
        .localeCompare((nameB || "").toLowerCase());
    });

    // Save the fully filtered/sorted list to our global variable
    currentFilteredData = filtered;

    // Render the gallery, forcing it back to page 1!
    refreshGallery(currentFilteredData, 1);
  };

  async function initFilters() {
    try {
      const options = await ButterflyAPI.getFilterOptions();
      const orderContainer = document.getElementById("filterOrderContainer");
      const familyContainer = document.getElementById("filterFamilyContainer");

      const populateCheckboxes = (container, items, type) => {
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

      const uniqueOrders = [...new Set(options.orders)].filter(Boolean);
      const uniqueFamilies = [...new Set(options.families)].filter(Boolean);

      populateCheckboxes(orderContainer, uniqueOrders, "order");
      populateCheckboxes(familyContainer, uniqueFamilies, "family");

      console.log("HEY POOKIE! The new code is running!");

      document.querySelectorAll(".filter-checkbox").forEach((cb) => {
        cb.addEventListener("change", applyAllFilters);
      });

      const setupSearch = (inputId, containerId) => {
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
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyAllFilters, 250);
    });
  }

  const nameToggleBtn = document.getElementById("nameToggleBtn");

  if (nameToggleBtn) {
    nameToggleBtn.addEventListener("click", () => {
      if (currentDisplayMode === "common") {
        currentDisplayMode = "scientific";

        if (searchInput)
          searchInput.placeholder = "Search by scientific name...";

        nameToggleBtn.style.backgroundColor = "white";
        nameToggleBtn.style.color = "#1abc9c";
        nameToggleBtn.style.borderColor = "#1abc9c";

        nameToggleBtn.innerHTML = `<i class="fas fa-exchange-alt me-1"></i><span class="fw-bold small">Scientific</span>`;
      } else {
        currentDisplayMode = "common";

        if (searchInput) searchInput.placeholder = "Search by common name...";

        nameToggleBtn.style.backgroundColor = "#1abc9c";
        nameToggleBtn.style.color = "white";
        nameToggleBtn.style.borderColor = "#1abc9c";

        nameToggleBtn.innerHTML = `<i class="fas fa-exchange-alt me-1"></i><span class="fw-bold small">Common</span>`;
      }
      applyAllFilters();
    });

    // Logic for adding a custom attribute field in the Edit Species modal
    const addFieldBtn = document.getElementById(
      "addNewSpeciesFieldBtn",
    ) as HTMLElement | null;
    if (addFieldBtn) {
      addFieldBtn.onclick = () => {
        const fieldName = prompt(
          "What is the name of the new category? (e.g. Host Plant, Habitat)",
        );

        if (fieldName && fieldName.trim() !== "") {
          const container = document.getElementById("dynamicSpeciesFields");
          if (container) {
            const html = `
              <div class="mb-3 dynamic-field-wrapper">
                  <label class="form-label fw-bold d-flex justify-content-between">
                      ${fieldName.trim()}
                      <button type="button" class="btn-close small" style="font-size: 0.6rem;" 
                              onclick="this.parentElement.parentElement.remove()"></button>
                  </label>
                  <input type="text" class="form-control custom-species-input" 
                         data-label="${fieldName.trim()}" 
                         placeholder="Enter ${fieldName.trim()}...">
              </div>`;
            container.insertAdjacentHTML("beforeend", html);
          }
        }
      };
    }
    await initFilters();
    const deleteSpeciesFullBtn = document.getElementById(
      "deleteSpeciesFullBtn",
    );
    if (deleteSpeciesFullBtn) {
      deleteSpeciesFullBtn.addEventListener("click", async () => {
        const id = deleteSpeciesFullBtn.dataset.speciesId;
        if (!id) return;
        if (
          confirm("Are you sure? This deletes the species and ALL its images!")
        ) {
          try {
            await ButterflyAPI.delete(id);
            alert("Species deleted successfully.");
            location.reload();
          } catch (err: any) {
            alert("Delete failed: " + err.message);
          }
        }
      });
    }

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const body = document.body;
        const isDark = body.getAttribute("data-bs-theme") === "dark";
        body.setAttribute("data-bs-theme", isDark ? "light" : "dark");
        body.classList.toggle("bg-dark");
        body.classList.toggle("text-white");
        document
          .querySelectorAll(".modal-content")
          .forEach((m) => m.classList.toggle("bg-dark"));
      });
    }
    showView(portfolio);
    applyAllFilters();
  }

  function addDynamicField(label = "", value = "") {
    const container = document.getElementById("dynamicSpeciesFields");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "mb-3 dynamic-field-wrapper";
    div.innerHTML = `
    <label class="form-label fw-bold d-flex justify-content-between small text-muted">
        ${label}
        <button type="button" class="btn-close" style="font-size: 0.5rem;" 
                onclick="this.closest('.dynamic-field-wrapper').remove()"></button>
    </label>
    <input type="text" class="form-control custom-species-input" 
           data-label="${label}" value="${value}">
`;
    container.appendChild(div);
  }
}
