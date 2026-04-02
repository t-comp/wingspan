import ButterflyAPI from "./api.js";
import { UI } from "./ui.js";
import { TagManager } from "./tags.js";

interface Butterfly {
  id: string;
  name: string;
  scientificName?: string;
  description?: string;
  orderName?: string;
  family?: string;
  genus?: string;
}

interface Image {
  id: string;
  fpath: string;
  fileSize?: number;
  lifecyclestage?: string;
  nathansNotes?: string;
  tags?: Tag[];
}

interface Tag {
  tagId: string;
  tagName: string;
}

interface User {
  userId: string;
  username: string;
  email: string;
  uType: string;
  userType?: string;
}

interface Team {
  id: string;
  name: string;
  projectName: string;
  semester: string;
}

interface ApiKey {
  id: string;
  teamName: string;
  keyVal: string;
  expiration?: string;
  active?: boolean;
  status?: string;
}

interface DashboardData {
  team?: Team;
  apiKey?: string;
}

interface FilterOptions {
  orders: string[];
  families: string[];
}

export async function initHome(userRole: string, userEmail: string) {
  console.log(
    "Home Initializing with role:",
    userRole,
    "and email:",
    userEmail,
  );

  let currentDisplayMode: string = "common";

  let butterflies: Butterfly[] = await ButterflyAPI.getAll();
  console.log("DATABASES SPECIES LIST:", butterflies);

  let studentApiKey: string = "";
  if (userRole !== "ADMIN") {
    try {
      const dashboardData: DashboardData =
        await ButterflyAPI.getStudentDashboard(userEmail);
      if (dashboardData && dashboardData.apiKey) {
        studentApiKey = dashboardData.apiKey;
      } else {
        // Fallback: Check teams if not on dashboard
        const allTeams: Team[] = await ButterflyAPI.getAllTeams();
        for (const t of allTeams) {
          const members: User[] = await ButterflyAPI.getTeamMembers(t.id);
          if (members.some((m: User) => m.email === userEmail)) {
            const keys: ApiKey[] = await ButterflyAPI.getAllApiKeys();
            const teamKey: ApiKey | undefined = keys.find(
              (k: ApiKey) => k.teamName === t.name && k.active !== false,
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

  const portfolio: HTMLElement | null = document.getElementById("portfolio");
  const teamView: HTMLElement | null = document.getElementById("teamView");
  const speciesView: HTMLElement | null =
    document.getElementById("speciesView");
  const searchNavBar: HTMLElement | null =
    document.getElementById("searchNavBar");
  const filterPanel: HTMLElement | null =
    document.getElementById("filterPanel");

  const viewGalleryBtn: HTMLElement | null =
    document.getElementById("viewGalleryBtn");
  const viewTeamBtn: HTMLElement | null =
    document.getElementById("viewTeamBtn");
  const backBtn: HTMLElement | null =
    document.getElementById("backToGalleryBtn");

  const searchInput: HTMLInputElement | null = document.getElementById(
    "searchInput",
  ) as HTMLInputElement | null;
  const themeToggle: HTMLElement | null =
    document.getElementById("toggleTheme");

  const adminTeamContent: HTMLElement | null =
    document.getElementById("adminTeamContent");
  const studentTeamContent: HTMLElement | null =
    document.getElementById("studentTeamContent");

  const adminGenerateKeyForm: HTMLFormElement | null = document.getElementById(
    "adminGenerateKeyForm",
  ) as HTMLFormElement | null;
  const adminExtendKeyForm: HTMLFormElement | null = document.getElementById(
    "adminExtendKeyForm",
  ) as HTMLFormElement | null;

  const openChangePasswordBtn: HTMLElement | null = document.getElementById(
    "openChangePasswordBtn",
  );
  const changePasswordForm: HTMLFormElement | null = document.getElementById(
    "changePasswordForm",
  ) as HTMLFormElement | null;

  let activeTagFilters: Set<string> = new Set();
  const filterTagCloud: HTMLElement | null =
    document.getElementById("filterTagCloud");

  if (openChangePasswordBtn) {
    openChangePasswordBtn.addEventListener("click", (e: Event) => {
      e.preventDefault();
      new bootstrap.Modal(
        document.getElementById("changePasswordModal")!,
      ).show();
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const pass1: string = (
        document.getElementById("newPersonalPassword") as HTMLInputElement
      ).value;
      const pass2: string = (
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
          document.getElementById("changePasswordModal")!,
        )!.hide();
      } catch (err) {
        alert("Failed to update password: " + (err as Error).message);
      }
    });
  }

  const showView = (view: HTMLElement | null) => {
    [portfolio, speciesView, teamView].forEach((v: HTMLElement | null) => {
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

  const openImageDetailsModal = (img: any) => {
    const editBtn: HTMLElement | null = document.getElementById("editImageBtn");
    const saveBtn: HTMLElement | null = document.getElementById("saveImageBtn");
    const notesDisplay: HTMLElement | null =
      document.getElementById("modalNotes");
    const notesInput: HTMLInputElement | null = document.getElementById(
      "editNotesInput",
    ) as HTMLInputElement | null;
    const tagsDisplay: HTMLElement | null =
      document.getElementById("modalTags");
    const editTagsContainer: HTMLElement | null =
      document.getElementById("editTagsContainer");

    if (!editBtn || !saveBtn || !notesDisplay || !tagsDisplay) return;

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

    const sizeElem: HTMLElement | null = document.getElementById("modalSize");
    if (sizeElem) sizeElem.innerText = img.size || "Unknown";

    const noteText: string =
      img.nathansNotes ||
      img.nathansnotes ||
      img.nathan_notes ||
      img.notes ||
      "";

    notesDisplay.innerText =
      noteText && noteText !== "undefined" ? noteText : "No notes available.";

    tagsDisplay.innerHTML = "";
    if (img.tags && img.tags.length > 0) {
      img.tags.forEach((t: Tag) => {
        const span: HTMLSpanElement = document.createElement("span");
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
    const copyIdBtn: HTMLElement | null = document.getElementById("copyIdBtn");
    const copyUrlBtn: HTMLElement | null =
      document.getElementById("copyUrlBtn");
    const copyApiKeyBtn: HTMLElement | null =
      document.getElementById("copyApiKeyBtn");

    if (copyUrlBtn) {
      copyUrlBtn.innerHTML = `<i class="fas fa-link me-1"></i>Copy Image URL`;
      copyUrlBtn.onclick = () => {
        let urlToCopy: string = img.url || img.fpath;

        if (studentApiKey) {
          const separator: string = urlToCopy.includes("?") ? "&" : "?";
          urlToCopy += `${separator}apiKey=${studentApiKey}`;
        }

        navigator.clipboard.writeText(urlToCopy);
        copyUrlBtn.innerHTML = `<i class="fas fa-check me-1"></i>Copied!`;
        setTimeout(
          () =>
            (copyUrlBtn.innerHTML = `<i class="fas fa-link me-1"></i>Copy Image URL`),
          2000,
        );
      };
    }

    if (studentApiKey && copyApiKeyBtn) {
      copyApiKeyBtn.classList.remove("d-none");
      copyApiKeyBtn.innerHTML = `<i class="fas fa-key me-1"></i>Copy API Key`;
      copyApiKeyBtn.onclick = () => {
        navigator.clipboard.writeText(studentApiKey);
        copyApiKeyBtn.innerHTML = `<i class="fas fa-check me-1"></i>Copied!`;
        setTimeout(
          () =>
            (copyApiKeyBtn.innerHTML = `<i class="fas fa-key me-1"></i>Copy API Key`),
          2000,
        );
      };
    } else if (copyApiKeyBtn) {
      copyApiKeyBtn.classList.add("d-none");
    }

    const modalElement: HTMLElement | null =
      document.getElementById("imageDetailsModal");
    if (modalElement) {
      let detailModal: any = bootstrap.Modal.getInstance(modalElement);
      if (!detailModal) detailModal = new bootstrap.Modal(modalElement);
      detailModal.show();
    }
  };

  const setupImageEditing = (img: any) => {
    const editBtn: HTMLElement | null = document.getElementById("editImageBtn");
    const saveBtn: HTMLElement | null = document.getElementById("saveImageBtn");
    const notesDisplay: HTMLElement | null =
      document.getElementById("modalNotes");
    const tagsDisplay: HTMLElement | null =
      document.getElementById("modalTags");
    const editTagsContainer: HTMLElement | null =
      document.getElementById("editTagsContainer");
    const checkboxList: HTMLElement | null =
      document.getElementById("tagCheckboxList");

    if (!editBtn || !saveBtn) return;

    editBtn.onclick = async () => {
      editBtn.classList.add("d-none");
      saveBtn.classList.remove("d-none");

      editBtn.classList.add("d-none");
      saveBtn.classList.remove("d-none");

      const notesDisplay: HTMLElement | null =
        document.getElementById("modalNotes");
      const notesInput: HTMLInputElement | null = document.getElementById(
        "editNotesInput",
      ) as HTMLInputElement | null;

      const currentNotes: string =
        notesDisplay!.innerText === "No notes available."
          ? ""
          : notesDisplay!.innerText;

      notesDisplay!.classList.add("d-none");
      notesInput!.classList.remove("d-none");

      notesInput!.value = currentNotes;

      if (tagsDisplay) tagsDisplay.classList.add("d-none");
      if (editTagsContainer) editTagsContainer.classList.remove("d-none");
      try {
        const dbTags: Tag[] = await ButterflyAPI.getAllTags();
        const currentTagIds: string[] = (img.tags || []).map((t: Tag) =>
          String(t.tagId || t.id || t),
        );

        let finalHtml: string = "";

        for (const [categoryName, tagNames] of Object.entries(
          TagManager.tagData,
        )) {
          let categoryGroupHtml: string = "";
          let hasFoundAny: boolean = false;

          (tagNames as string[]).forEach((name: string) => {
            const match: Tag | undefined = dbTags.find(
              (t: Tag) =>
                t &&
                t.tagName &&
                t.tagName.toString().trim().toLowerCase() ===
                  name.trim().toLowerCase(),
            );

            if (match) {
              hasFoundAny = true;
              const isChecked: boolean = currentTagIds.includes(
                String(match.tagId),
              );
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
      const id: string = img.id || img.imageId;
      if (!id) {
        alert("Error: Could not find the ID for this image.");
        return;
      }

      const editInput: HTMLInputElement | null = document.getElementById(
        "editNotesInput",
      ) as HTMLInputElement | null;
      const newNotes: string = editInput ? editInput.value : "";

      const selectedCheckboxes: NodeListOf<HTMLInputElement> =
        document.querySelectorAll(".edit-tag-checkbox:checked");
      const newTagIds: string[] = Array.from(selectedCheckboxes).map(
        (cb: HTMLInputElement) => String(cb.value),
      );

      const oldTagIds: string[] = (img.tags || []).map((t: Tag) =>
        String(t.id || t.tagId),
      );
      const toAdd: string[] = newTagIds.filter(
        (tagId: string) => !oldTagIds.includes(tagId),
      );
      const toRemove: string[] = oldTagIds.filter(
        (tagId: string) => !newTagIds.includes(tagId),
      );
      const noteInput: HTMLInputElement | null =
        (document.getElementById(
          "editNotesInput",
        ) as HTMLInputElement | null) ||
        (document.getElementById("modalNotes") as HTMLInputElement | null);
      const updatedNotes: string = noteInput ? noteInput.value : "";

      console.log("Notes being sent to server:", updatedNotes);

      try {
        await ButterflyAPI.updateImageDetails(id, {
          //description: img.description || "",
          nathansNotes: updatedNotes,
          life_cycle:
            (document.getElementById("editLifecycleInput") as HTMLInputElement)
              ?.value || "Adult",
        });

        const tagPromises: Promise<void>[] = [
          ...toAdd.map((tagId: string) =>
            ButterflyAPI.addTagToImage(tagId, id),
          ),
          ...toRemove.map((tagId: string) =>
            ButterflyAPI.removeTagFromImage(tagId, id),
          ),
        ];

        await Promise.all(tagPromises);
        alert("Update Successful!");
        const freshSpecies: Butterfly = await ButterflyAPI.getSpeciesById(
          currentSpeciesId!,
        );
        await showSpeciesView(freshSpecies);

        bootstrap.Modal.getInstance(
          document.getElementById("imageDetailsModal")!,
        )!.hide();
      } catch (err) {
        console.error("Save failed:", err);
        alert("Error saving: " + (err as Error).message);
      }
    };
  };

  const showSpeciesView = async (b: Butterfly) => {
    showView(speciesView);
    if (searchNavBar) searchNavBar.style.display = "none";
    if (filterPanel) {
      filterPanel.style.display = "none";
      filterPanel.classList.remove("show");
    }

    currentSpeciesId = b.id;

    const isAdmin: boolean = userRole === "ADMIN";
    UI.populateSpeciesView(b, isAdmin);

    const editSpeciesBtn: HTMLElement | null =
      document.getElementById("editSpeciesBtn");
    if (editSpeciesBtn && isAdmin) {
      editSpeciesBtn.classList.remove("d-none");

      //workaround for attributes
      editSpeciesBtn.onclick = () => {
        const dynamicContainer: HTMLElement | null = document.getElementById(
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
        const fullDesc: string = b.description || "";

        const attributeRegex: RegExp = /\[\[(.*?):\s*(.*?)\]\]/g;
        let match: RegExpExecArray | null;

        while ((match = attributeRegex.exec(fullDesc)) !== null) {
          addDynamicField(match[1].trim(), match[2].trim());
        }

        (
          document.getElementById(
            "editSpeciesDescription",
          ) as HTMLTextAreaElement
        ).value = fullDesc.replace(/\[\[.*?\]\]/g, "").trim();
      };
    }

    const setMainImage = (img: any) => {
      const url: string = img.url || "assets/img/noimage.jpg";
      (document.getElementById("speciesImage") as HTMLImageElement).src = url;
      const modalImg: HTMLImageElement | null = document.getElementById(
        "butterflyModalImage",
      ) as HTMLImageElement | null;
      if (modalImg) modalImg.src = url;
      const sizeElem: HTMLElement | null =
        document.getElementById("currentImgSize");
      if (sizeElem) sizeElem.innerText = img.size || "Unknown";
      const lifecycleElem: HTMLElement | null =
        document.getElementById("speciesLifecycle");
      if (lifecycleElem) lifecycleElem.innerText = img.lifecycle || "Adult";

      const notesElem: HTMLElement | null =
        document.getElementById("speciesNotes");
      if (notesElem) {
        const noteText: string = img.nathansNotes;

        notesElem.innerText =
          noteText && noteText.trim() !== "" ? noteText : "No notes available.";
      }

      const viewMoreBtn: HTMLElement | null =
        document.getElementById("viewMoreDetails");
      if (viewMoreBtn) {
        viewMoreBtn.onclick = (e: Event) => {
          e.preventDefault();
          openImageDetailsModal(img);
        };
      }
    };

    let fetchedImages: Image[] = [];
    try {
      fetchedImages = await ButterflyAPI.getImagesBySpecies(b.id);
    } catch (err) {
      console.error("Could not load images for species:", err);
    }

    const allImgs: any[] = fetchedImages.map((img: Image) => {
      const noteFromBackend: string =
        img.nathansNotes ||
        img.nathan_notes ||
        img.notes ||
        img.nathansnotes ||
        "";

      return {
        id: img.id,
        url: img.fpath,
        size: img.fileSize ? img.fileSize + " bytes" : "Unknown",
        lifecycle: img.lifecyclestage || "Unknown",
        nathansNotes: noteFromBackend,
        tags: img.tags || [],
      };
    });
    const gridContainer: HTMLElement | null =
      document.getElementById("speciesImages");

    const renderInnerGrid = (selectedTags: string | string[] = "all") => {
      gridContainer!.innerHTML = "";

      const isShowingAll: boolean =
        selectedTags === "all" ||
        (Array.isArray(selectedTags) && selectedTags.includes("all")) ||
        (Array.isArray(selectedTags) && selectedTags.length === 0);

      const filtered: any[] = allImgs.filter((img: any) => {
        if (isShowingAll) return true;

        const imageTagIds: string[] = img.tags.map((t: Tag) =>
          String(t.tagId || t.id),
        );
        return selectedTags.every((id: string) =>
          imageTagIds.includes(String(id)),
        );
      });
      if (filtered.length === 0) {
        gridContainer!.innerHTML =
          '<p class="text-muted p-3">No images match this filter.</p>';
        return;
      }

      filtered.forEach((imgObj: any) => {
        const col: HTMLDivElement = document.createElement("div");
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
        col.querySelector("img")!.onclick = (e: Event) => {
          document
            .querySelectorAll(".gallery-thumb-wrapper img")
            .forEach((el: HTMLImageElement) =>
              el.classList.remove("border-primary", "border-3"),
            );
          (e.currentTarget as HTMLImageElement).classList.add(
            "border-primary",
            "border-3",
          );
          setMainImage(imgObj);
        };

        const deleteBtn: HTMLButtonElement | null = col.querySelector(
          ".delete-single-img-btn",
        ) as HTMLButtonElement | null;
        if (deleteBtn) {
          deleteBtn.onclick = (e: Event) => {
            e.stopPropagation();
            window.handleDeleteSingleImage(imgObj.id);
          };
        }

        col.addEventListener("mouseenter", () => {
          if (deleteBtn) deleteBtn.style.opacity = "0.85";
        });
        col.addEventListener("mouseleave", () => {
          if (deleteBtn) deleteBtn.style.opacity = "0";
        });

        gridContainer!.appendChild(col);
      });

      if (filtered.length > 0) setMainImage(filtered[0]);
    };

    const renderFilterPills = () => {
      const filterBar: HTMLElement | null =
        document.getElementById("filterTagCloud");
      if (!filterBar) return;

      const allUniqueTags: Tag[] = Array.from(
        new Map(
          allImgs
            .flatMap((img: any) => img.tags || [])
            .map((t: Tag) => [t.tagId || t.id, t]),
        ).values(),
      );
      let html: string = `<button class="btn btn-sm btn-primary filter-pill active" data-tag="all">All</button>`;

      allUniqueTags.forEach((tag: Tag) => {
        const tagName: string = tag.tagName || tag.name;
        const tagId: string = tag.tagId || tag.id;
        if (tagName) {
          html += `<button class="btn btn-sm btn-outline-secondary filter-pill" data-tag="${tagId}">${tagName}</button>`;
        }
      });
      filterBar.innerHTML = html;

      filterBar.querySelectorAll(".filter-pill").forEach((btn: Element) => {
        (btn as HTMLButtonElement).onclick = () => {
          const tagId: string = (btn as HTMLButtonElement).getAttribute(
            "data-tag",
          )!;

          if (tagId === "all") {
            filterBar.querySelectorAll(".filter-pill").forEach((b: Element) => {
              (b as HTMLButtonElement).classList.replace(
                "btn-primary",
                "btn-outline-secondary",
              );
              (b as HTMLButtonElement).classList.remove("active");
            });
            (btn as HTMLButtonElement).classList.replace(
              "btn-outline-secondary",
              "btn-primary",
            );
            (btn as HTMLButtonElement).classList.add("active");
          } else {
            (btn as HTMLButtonElement).classList.toggle("active");
            (btn as HTMLButtonElement).classList.toggle("btn-primary");
            (btn as HTMLButtonElement).classList.toggle(
              "btn-outline-secondary",
            );

            const allBtn: HTMLButtonElement | null = filterBar.querySelector(
              '[data-tag="all"]',
            ) as HTMLButtonElement | null;
            allBtn!.classList.replace("btn-primary", "btn-outline-secondary");
            allBtn!.classList.remove("active");
          }

          const activePills: NodeListOf<Element> = filterBar.querySelectorAll(
            ".filter-pill.active",
          );
          const selectedIds: string[] = Array.from(activePills).map(
            (p: Element) => (p as HTMLButtonElement).getAttribute("data-tag")!,
          );

          if (selectedIds.length === 0) {
            const allBtn: HTMLButtonElement | null = filterBar.querySelector(
              '[data-tag="all"]',
            ) as HTMLButtonElement | null;
            allBtn!.classList.replace("btn-outline-secondary", "btn-primary");
            allBtn!.classList.add("active");
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

  const refreshGallery = (data: Butterfly[] = butterflies) => {
    UI.renderGrid(
      data,
      (b: Butterfly) => showSpeciesView(b),
      currentDisplayMode,
    );
  };

  async function loadStudentData(email: string) {
    if (!email) return;
    try {
      const dashboardData: DashboardData =
        await ButterflyAPI.getStudentDashboard(email);
      let myTeam: Team | undefined = dashboardData
        ? dashboardData.team
        : undefined;
      let myApiKey: string =
        dashboardData && dashboardData.apiKey
          ? dashboardData.apiKey
          : "No active API Key found";

      if (!myTeam) {
        const allTeams: Team[] = await ButterflyAPI.getAllTeams();
        for (const t of allTeams) {
          const members: User[] = await ButterflyAPI.getTeamMembers(t.id);
          if (members.some((m: User) => m.email === email)) {
            myTeam = t;
            const keys: ApiKey[] = await ButterflyAPI.getAllApiKeys();
            const teamKey: ApiKey | undefined = keys.find(
              (k: ApiKey) => k.teamName === t.name && k.active !== false,
            );
            if (teamKey) myApiKey = teamKey.keyVal;
            break;
          }
        }
      }

      const container: HTMLElement | null =
        document.getElementById("studentTeamContent");
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

      const members: User[] = await ButterflyAPI.getTeamMembers(myTeam.id);
      const membersHtml: string = members
        .map(
          (m: User) =>
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

  let allCachedUsers: User[] = [];
  let globalUserTeamMap: { [key: string]: string } = {};

  async function loadAdminData() {
    const [users, teams]: [User[], Team[]] = await Promise.all([
      ButterflyAPI.getAllUsers(),
      ButterflyAPI.getAllTeams(),
    ]);
    users.sort((a: User, b: User) =>
      a.username.toLowerCase().localeCompare(b.username.toLowerCase()),
    );
    allCachedUsers = users;

    globalUserTeamMap = {};
    const memberResults: User[][] = await Promise.all(
      teams.map((t: Team) => ButterflyAPI.getTeamMembers(t.id)),
    );
    teams.forEach((t: Team, i: number) => {
      for (const m of memberResults[i]) {
        globalUserTeamMap[m.userId] = t.name;
      }
    });

    renderAllUsersTable(allCachedUsers);
    await loadTeams();
  }

  function renderAllUsersTable(usersList: User[]) {
    const tbody: HTMLElement | null =
      document.getElementById("allUsersTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    usersList.forEach((u: User) => {
      const tr: HTMLTableRowElement = document.createElement("tr");
      const currentRole: string = u.uType || u.userType || u.utype;
      const badgeClass: string =
        currentRole === "ADMIN" ? "bg-danger" : "bg-primary";
      const teamName: string =
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

  const adminUserSearch: HTMLInputElement | null = document.getElementById(
    "adminUserSearch",
  ) as HTMLInputElement | null;
  if (adminUserSearch) {
    adminUserSearch.addEventListener("input", (e: Event) => {
      const query: string = (e.target as HTMLInputElement).value.toLowerCase();
      const filtered: User[] = allCachedUsers.filter((u: User) =>
        u.username.toLowerCase().includes(query),
      );
      renderAllUsersTable(filtered);
    });
  }

  async function loadTeams() {
    const [teams, unassigned, allKeys]: [Team[], User[], ApiKey[]] =
      await Promise.all([
        ButterflyAPI.getAllTeams(),
        ButterflyAPI.getUnassignedStudents(),
        ButterflyAPI.getAllApiKeys(),
      ]);
    const container: HTMLElement | null =
      document.getElementById("teamsContainer");
    if (!container) return;

    container.innerHTML = "";

    if (teams.length === 0) {
      container.innerHTML = `<p class="text-muted fst-italic">No teams yet. Click "Create Team" to get started.</p>`;
      return;
    }

    let studentOptions: string = `<option value="">Select a student...</option>`;
    unassigned.forEach((u: User) => {
      studentOptions += `<option value="${u.userId}">${u.username} — ${u.email}</option>`;
    });

    const membersByTeam: User[][] = await Promise.all(
      teams.map((t: Team) => ButterflyAPI.getTeamMembers(t.id)),
    );

    for (let idx: number = 0; idx < teams.length; idx++) {
      const team: Team = teams[idx];
      const members: User[] = membersByTeam[idx];
      const teamKey: ApiKey | undefined = allKeys.find(
        (k: ApiKey) => k.teamName === team.name,
      );
      const isActive: boolean =
        teamKey && teamKey.active !== false && teamKey.status !== "INACTIVE";

      let membersHtml: string = "";
      if (members.length === 0) {
        membersHtml = `<span class="text-muted fst-italic small">No members yet</span>`;
      } else {
        membersHtml = members
          .map((m: User) => {
            const initials: string = m.username.substring(0, 2).toUpperCase();
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

      let apiKeyHtml: string = "";
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
        const expiresText: string = teamKey.expiration
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

      const card: HTMLDivElement = document.createElement("div");
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

  (window as any).deleteSystemUser = async (userId: string) => {
    if (confirm("Delete this user permanently?")) {
      await ButterflyAPI.deleteUser(userId);
      await loadAdminData();
    }
  };

  (window as any).toggleUserRole = async (
    userId: string,
    currentRole: string,
  ) => {
    const targetUser: User | undefined = allCachedUsers.find(
      (u: User) => u.userId.toString() === userId.toString(),
    );
    if (currentRole === "ADMIN") {
      const adminCount: number = allCachedUsers.filter(
        (u: User) => (u.uType || u.userType || u.utype) === "ADMIN",
      ).length;
      if (adminCount <= 1)
        return alert(
          "Action Denied: The system must always have at least one administrator.",
        );
      if (targetUser && targetUser.email === userEmail) {
        const proceed: boolean = confirm(
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

  (window as any).deleteTeam = async (teamId: string) => {
    if (confirm("Delete this team entirely?")) {
      await ButterflyAPI.deleteTeam(teamId);
      await loadAdminData();
    }
  };

  (window as any).addStudentToTeam = async (teamId: string) => {
    const select: HTMLSelectElement | null = document.getElementById(
      `assignStudentSelect-${teamId}`,
    ) as HTMLSelectElement | null;
    const userId: string = select!.value;
    if (!userId) return alert("Please select a student first.");
    try {
      await ButterflyAPI.addTeamMember(teamId, userId);
      await loadAdminData();
    } catch (error) {
      alert("Could not add student: " + (error as Error).message);
    }
  };

  (window as any).removeStudentFromTeam = async (
    teamId: string,
    userId: string,
  ) => {
    if (confirm("Remove this student from the team?")) {
      try {
        await ButterflyAPI.removeTeamMember(teamId, userId);
        await loadAdminData();
      } catch (error) {
        alert("Could not remove student: " + (error as Error).message);
      }
    }
  };

  (window as any).toggleApiKeyStatus = async (
    keyId: string,
    currentlyActive: boolean,
  ) => {
    if (currentlyActive) {
      await ButterflyAPI.deactivateApiKey(keyId);
    } else {
      await ButterflyAPI.activateApiKey(keyId);
    }
    await loadAdminData();
  };

  (window as any).regenerateTeamKey = async (
    teamName: string,
    projectName: string,
    semester: string,
  ) => {
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
      } catch (err) {
        alert("Failed to regenerate key: " + (err as Error).message);
      }
    }
  };

  (window as any).deleteApiKey = async (keyId: string) => {
    if (
      confirm(
        "Delete this API key permanently? Students using it will lose access.",
      )
    ) {
      try {
        await ButterflyAPI.deleteApiKey(keyId);
        await loadAdminData();
      } catch (err) {
        alert("Failed to delete key: " + (err as Error).message);
      }
    }
  };

  (window as any).handleDeleteSingleImage = async (imageId: string) => {
    if (confirm("Delete this specific photo?")) {
      try {
        await ButterflyAPI.deleteImage(imageId);
        alert("Image Deleted");
        if (currentSpeciesId) {
          const freshButterfly: Butterfly =
            await ButterflyAPI.getSpeciesById(currentSpeciesId);
          await showSpeciesView(freshButterfly);
        } else {
          location.reload();
        }
      } catch (err) {
        alert("Error: " + (err as Error).message);
      }
    }
  };

  (window as any).openExtendModal = (keyId: string) => {
    const extendInput: HTMLInputElement | null = document.getElementById(
      "extendKeyId",
    ) as HTMLInputElement | null;
    if (extendInput) extendInput.value = keyId;
    const modalElem: HTMLElement | null = document.getElementById(
      "adminExtendKeyModal",
    );
    if (modalElem) new bootstrap.Modal(modalElem).show();
  };

  (window as any).openEditUserModal = (
    userId: string,
    currentUsername: string,
    currentEmail: string,
  ) => {
    (document.getElementById("editUserId") as HTMLInputElement).value = userId;
    (document.getElementById("editUsername") as HTMLInputElement).value =
      currentUsername;
    (document.getElementById("editEmail") as HTMLInputElement).value =
      currentEmail;
    (document.getElementById("editPassword") as HTMLInputElement).value = "";
    new bootstrap.Modal(document.getElementById("adminEditUserModal")!).show();
  };

  const adminCreateTeamForm: HTMLFormElement | null = document.getElementById(
    "adminCreateTeamForm",
  ) as HTMLFormElement | null;
  if (adminCreateTeamForm) {
    adminCreateTeamForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const teamData: { name: string; projectName: string; semester: string } =
        {
          name: (
            document.getElementById("newCreateTeamName") as HTMLInputElement
          ).value,
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
        document.getElementById("adminCreateTeamModal")!,
      )!.hide();
    });
  }

  const adminAddUserForm: HTMLFormElement | null = document.getElementById(
    "adminAddUserForm",
  ) as HTMLFormElement | null;
  if (adminAddUserForm) {
    adminAddUserForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const usernameVal: string = (
        document.getElementById("adminNewUsername") as HTMLInputElement
      ).value;
      const emailVal: string = (
        document.getElementById("adminNewEmail") as HTMLInputElement
      ).value;
      const passVal: string = (
        document.getElementById("adminNewPassword") as HTMLInputElement
      ).value;
      const roleVal: string = (
        document.getElementById("adminNewRole") as HTMLSelectElement
      ).value;

      const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal))
        return alert("Please enter a valid email address.");
      if (usernameVal.length < 5)
        return alert("Username must be at least 5 characters long.");
      if (passVal.length < 7)
        return alert("Password must be at least 7 characters long.");

      try {
        const allUsers: User[] = await ButterflyAPI.getAllUsers();
        if (
          allUsers.some(
            (u: User) => u.username.toLowerCase() === usernameVal.toLowerCase(),
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
          document.getElementById("adminAddUserModal")!,
        )!.hide();
        alert("User successfully created!");
      } catch (error) {
        alert("Could not create user: " + (error as Error).message);
      }
    });
  }

  const adminEditUserForm: HTMLFormElement | null = document.getElementById(
    "adminEditUserForm",
  ) as HTMLFormElement | null;
  if (adminEditUserForm) {
    adminEditUserForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const userId: string = (
        document.getElementById("editUserId") as HTMLInputElement
      ).value;
      const newUsername: string = (
        document.getElementById("editUsername") as HTMLInputElement
      ).value;
      const newEmail: string = (
        document.getElementById("editEmail") as HTMLInputElement
      ).value;

      const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail))
        return alert("Please enter a valid email address.");
      if (newUsername.length < 5)
        return alert("Username must be at least 5 characters long.");

      try {
        const allUsers: User[] = await ButterflyAPI.getAllUsers();
        if (
          allUsers.some(
            (u: User) =>
              u.username.toLowerCase() === newUsername.toLowerCase() &&
              u.userId.toString() !== userId.toString(),
          )
        ) {
          return alert("This username already exists.");
        }
        await ButterflyAPI.updateUsername(userId, newUsername);
        await ButterflyAPI.updateEmail(userId, newEmail);

        const newPassword: string = (
          document.getElementById("editPassword") as HTMLInputElement
        ).value.trim();
        if (newPassword !== "") {
          if (newPassword.length < 7)
            return alert("Password must be at least 7 characters long.");
          await ButterflyAPI.resetPassword(newEmail, newPassword);
        }
        await loadAdminData();
        bootstrap.Modal.getInstance(
          document.getElementById("adminEditUserModal")!,
        )!.hide();
        alert("User successfully updated!");
      } catch (error) {
        alert("Failed to update user.");
      }
    });
  }

  if (adminGenerateKeyForm) {
    adminGenerateKeyForm.addEventListener("submit", async (e: Event) => {
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
      const modalElem: HTMLElement | null = document.getElementById(
        "adminGenerateKeyModal",
      );
      if (modalElem) bootstrap.Modal.getInstance(modalElem)!.hide();
    });
  }

  if (adminExtendKeyForm) {
    adminExtendKeyForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const keyId: string = (
        document.getElementById("extendKeyId") as HTMLInputElement
      ).value;
      const months: string = (
        document.getElementById("extendMonths") as HTMLInputElement
      ).value;
      await ButterflyAPI.extendApiKey(keyId, months);
      await loadAdminData();
      (e.target as HTMLFormElement).reset();
      const modalElem: HTMLElement | null = document.getElementById(
        "adminExtendKeyModal",
      );
      if (modalElem) bootstrap.Modal.getInstance(modalElem)!.hide();
    });
  }

  const universalUploadForm: HTMLFormElement | null = document.getElementById(
    "universalUploadForm",
  ) as HTMLFormElement | null;
  if (universalUploadForm) {
    const uploadModal: HTMLElement | null =
      document.getElementById("addButterflyModal");
    if (uploadModal) {
      uploadModal.addEventListener("show.bs.modal", async () => {
        await TagManager.initTagContainer();
        const selector: HTMLSelectElement | null = document.getElementById(
          "speciesSelector",
        ) as HTMLSelectElement | null;
        if (selector) {
          selector.innerHTML = `<option value="NEW">-- Create New Species --</option>`;
          butterflies.forEach((s: Butterfly) => {
            selector.innerHTML += `<option value="${s.id}">${s.name}</option>`;
          });
          const newSpeciesFields: HTMLElement | null =
            document.getElementById("newSpeciesFields");
          if (newSpeciesFields) {
            newSpeciesFields.style.display =
              selector.value === "NEW" ? "block" : "none";
          }
          selector.onchange = () => {
            if (newSpeciesFields) {
              newSpeciesFields.style.display =
                selector.value === "NEW" ? "block" : "none";
            }
          };
        }
      });
    }

    universalUploadForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const selector: HTMLSelectElement | null = document.getElementById(
        "speciesSelector",
      ) as HTMLSelectElement | null;
      const fileInput: HTMLInputElement | null = document.getElementById(
        "newImageFile",
      ) as HTMLInputElement | null;

      if (!fileInput.files || fileInput.files.length === 0) {
        return alert("Please select at least one image file.");
      }

      let speciesId: string = selector!.value;

      if (speciesId === "NEW") {
        const name: string = (
          document.getElementById("newName") as HTMLInputElement
        ).value.trim();
        if (!name)
          return alert("Please enter a common name for the new species.");
        try {
          const newSpecies: Butterfly = await ButterflyAPI.create({
            name: name,
            scientificName: (
              document.getElementById("newScientific") as HTMLInputElement
            ).value,
            description: (
              document.getElementById("newDescription") as HTMLTextAreaElement
            ).value,
            orderName:
              (document.getElementById("newOrderName") as HTMLInputElement)
                ?.value || "",
            family:
              (document.getElementById("newFamily") as HTMLInputElement)
                ?.value || "",
            genus:
              (document.getElementById("newGenus") as HTMLInputElement)
                ?.value || "",
          });
          speciesId = newSpecies.id;
          butterflies = await ButterflyAPI.getAll();
          refreshGallery();
        } catch (err) {
          return alert("Failed to create species: " + (err as Error).message);
        }
      }

      const checkedBoxes: NodeListOf<HTMLInputElement> =
        universalUploadForm.querySelectorAll('input[name="tagIds"]:checked');
      const tagIds: string[] = Array.from(checkedBoxes).map(
        (cb: HTMLInputElement) => cb.value,
      );
      const nathansNotes: string = (
        document.getElementById("nathanNotes") as HTMLTextAreaElement
      ).value;

      const files: File[] = Array.from(fileInput.files);
      let successCount: number = 0;
      let failCount: number = 0;

      for (const file of files) {
        const formData: FormData = new FormData();
        formData.append("file", file);
        formData.append("species_id", speciesId);
        formData.append("nathansNotes", nathansNotes);
        if (tagIds.length > 0) {
          tagIds.forEach((id: string) => formData.append("tagId", id));
        }
        try {
          await ButterflyAPI.uploadImage(formData);
          successCount++;
        } catch (err) {
          console.error("Failed to upload " + file.name + ":", err);
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

      (e.target as HTMLFormElement).reset();
      const selectorAfterReset: HTMLSelectElement | null =
        document.getElementById("speciesSelector") as HTMLSelectElement | null;
      if (selectorAfterReset) selectorAfterReset.value = "NEW";
      const newSpeciesFields: HTMLElement | null =
        document.getElementById("newSpeciesFields");
      if (newSpeciesFields) newSpeciesFields.style.display = "block";

      bootstrap.Modal.getInstance(
        document.getElementById("addButterflyModal")!,
      )!.hide();
      butterflies = await ButterflyAPI.getAll();
      refreshGallery();
    });
  }

  const addImageToSpeciesForm: HTMLFormElement | null = document.getElementById(
    "addImageToSpeciesForm",
  ) as HTMLFormElement | null;
  if (addImageToSpeciesForm) {
    addImageToSpeciesForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const speciesId: string = (
        document.getElementById("targetSpeciesId") as HTMLInputElement
      ).value;
      const fileInput: HTMLInputElement | null = document.getElementById(
        "speciesImageFiles",
      ) as HTMLInputElement | null;
      const notes: string = (
        document.getElementById("speciesImageNotes") as HTMLTextAreaElement
      ).value;

      if (!fileInput.files || fileInput.files.length === 0) {
        return alert("Please select at least one image.");
      }

      const files: File[] = Array.from(fileInput.files);
      let successCount: number = 0;
      let failCount: number = 0;

      for (const file of files) {
        const formData: FormData = new FormData();
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
        document.getElementById("addImageToSpeciesModal")!,
      )!.hide();

      const freshSpecies: Butterfly =
        await ButterflyAPI.getSpeciesById(speciesId);
      await showSpeciesView(freshSpecies);
      butterflies = await ButterflyAPI.getAll();
    });
  }

  const editSpeciesForm: HTMLFormElement | null = document.getElementById(
    "editSpeciesForm",
  ) as HTMLFormElement | null;
  if (editSpeciesForm) {
    editSpeciesForm.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const speciesId: string = (
        document.getElementById("editSpeciesId") as HTMLInputElement
      ).value;
      let currentDescValue: string =
        (
          document.getElementById(
            "editSpeciesDescription",
          ) as HTMLTextAreaElement
        ).value || "";
      let cleanBaseDescription: string = currentDescValue
        .replace(/\[\[.*?\]\]/g, "")
        .trim();
      const customInputs: NodeListOf<HTMLInputElement> =
        document.querySelectorAll(".custom-species-input");
      let extraString: string = "";

      customInputs.forEach((input: HTMLInputElement) => {
        const label: string | null = input.getAttribute("data-label");
        const value: string = input.value;
        if (label && value && value.trim() !== "") {
          extraString += ` [[${label}: ${value.trim()}]]`;
        }
      });
      const finalDescription: string = (
        cleanBaseDescription + extraString
      ).trim();
      console.log("Total Description Length:", finalDescription.length);

      const data: Partial<Butterfly> = {
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
        const editModal: HTMLElement | null =
          document.getElementById("editSpeciesModal");
        const modalInstance: any = bootstrap.Modal.getInstance(editModal);
        if (modalInstance) modalInstance.hide();
        butterflies = await ButterflyAPI.getAll();

        const freshSpecies: Butterfly =
          await ButterflyAPI.getSpeciesById(speciesId);
        await showSpeciesView(freshSpecies);

        if (typeof refreshGallery === "function") refreshGallery();

        alert("Species updated successfully!");
      } catch (err) {
        console.error("Update failed:", err);
        alert("Update failed: " + (err as Error).message);
      }
    });
  }

  const clearFiltersBtn: HTMLElement | null =
    document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      const currentSpecies: Butterfly | undefined = butterflies.find(
        (b: Butterfly) =>
          b.name ===
          (document.getElementById("speciesName") as HTMLElement)?.innerText,
      );
      if (currentSpecies) showSpeciesView(currentSpecies);
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      goToGallery();
    });
  }

  const navBrand: HTMLElement | null = document.getElementById("navBrandLink");
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

  let searchTimeout: number | undefined;

  const applyAllFilters = async () => {
    const checkedOrders: string[] = Array.from(
      document.querySelectorAll("#filterOrderContainer input:checked"),
    ).map((cb: HTMLInputElement) => cb.value);
    const checkedFamilies: string[] = Array.from(
      document.querySelectorAll("#filterFamilyContainer input:checked"),
    ).map((cb: HTMLInputElement) => cb.value);

    (document.getElementById("orderBtnText") as HTMLElement).innerText =
      checkedOrders.length > 0
        ? `${checkedOrders.length} Selected`
        : "All Orders";
    (document.getElementById("familyBtnText") as HTMLElement).innerText =
      checkedFamilies.length > 0
        ? `${checkedFamilies.length} Selected`
        : "All Families";

    const query: string = searchInput ? searchInput.value.toLowerCase() : "";

    let filtered: Butterfly[] = butterflies;

    if (checkedOrders.length > 0) {
      filtered = filtered.filter((b: Butterfly) =>
        checkedOrders.includes(b.orderName!),
      );
    }
    if (checkedFamilies.length > 0) {
      filtered = filtered.filter((b: Butterfly) =>
        checkedFamilies.includes(b.family!),
      );
    }
    if (query) {
      filtered = filtered.filter((b: Butterfly) => {
        if (currentDisplayMode === "scientific") {
          return (b.scientificName || "").toLowerCase().includes(query);
        } else {
          return (b.name || "").toLowerCase().includes(query);
        }
      });
    }

    refreshGallery(filtered);
  };

  async function initFilters() {
    try {
      const options: FilterOptions = await ButterflyAPI.getFilterOptions();
      const orderContainer: HTMLElement | null = document.getElementById(
        "filterOrderContainer",
      );
      const familyContainer: HTMLElement | null = document.getElementById(
        "filterFamilyContainer",
      );

      const populateCheckboxes = (
        container: HTMLElement | null,
        items: string[],
        type: string,
      ) => {
        if (!container || !items) return;
        container.innerHTML = "";
        items.forEach((item: string, index: number) => {
          if (item) {
            const id: string = `cb-${type}-${index}`;
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

      const uniqueOrders: string[] = [...new Set(options.orders)].filter(
        Boolean,
      );
      const uniqueFamilies: string[] = [...new Set(options.families)].filter(
        Boolean,
      );

      populateCheckboxes(orderContainer, uniqueOrders, "order");
      populateCheckboxes(familyContainer, uniqueFamilies, "family");

      console.log("HEY POOKIE! The new code is running!");

      document.querySelectorAll(".filter-checkbox").forEach((cb: Element) => {
        (cb as HTMLInputElement).addEventListener("change", applyAllFilters);
      });

      const setupSearch = (inputId: string, containerId: string) => {
        const searchBox: HTMLInputElement | null = document.getElementById(
          inputId,
        ) as HTMLInputElement | null;
        if (searchBox) {
          searchBox.addEventListener("input", (e: Event) => {
            const term: string = (
              e.target as HTMLInputElement
            ).value.toLowerCase();
            const items: NodeListOf<Element> = document.querySelectorAll(
              `#${containerId} .filter-item`,
            );
            items.forEach((item: Element) => {
              const label: HTMLElement | null = item.querySelector("label");
              if (label) {
                item.classList.toggle(
                  "d-none",
                  !label.innerText.toLowerCase().includes(term),
                );
              }
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

  const nameToggleBtn: HTMLElement | null =
    document.getElementById("nameToggleBtn");

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

    //for adding a base category
    (
      document.getElementById("addNewSpeciesFieldBtn") as HTMLElement
    )?.addEventListener("click", () => {
      const fieldName: string | null = prompt(
        "What is the name of the new category? (e.g. Host Plant, Habitat)",
      );
      if (!fieldName) return;

      const container: HTMLElement | null = document.getElementById(
        "dynamicSpeciesFields",
      );
      if (!container) return;
      const safeName: string = fieldName.replace(/\s+/g, "_").toLowerCase();

      const html: string = `
        <div class="mb-3 dynamic-field-wrapper">
            <label class="form-label fw-bold d-flex justify-content-between">
                ${fieldName}
                <button type="button" class="btn-close small" style="font-size: 0.6rem;" onclick="this.parentElement.parentElement.remove()"></button>
            </label>
            <input type="text" class="form-control custom-species-input" 
                   data-label="${fieldName}" 
                   placeholder="Enter ${fieldName}...">
        </div>
    `;
      container.insertAdjacentHTML("beforeend", html);
    });

    //for the base category but i dont think backend is updated
    const addFieldBtn: HTMLElement | null = document.getElementById(
      "addNewSpeciesFieldBtn",
    );
    if (addFieldBtn) {
      addFieldBtn.onclick = () => {
        const fieldName: string | null = prompt(
          "What is the name of the new category? (e.g. Host Plant, Habitat)",
        );
        if (fieldName && fieldName.trim() !== "") {
          addDynamicField(fieldName.trim());
        }
      };
    }

    await initFilters();
    const deleteSpeciesFullBtn: HTMLElement | null = document.getElementById(
      "deleteSpeciesFullBtn",
    );
    if (deleteSpeciesFullBtn) {
      deleteSpeciesFullBtn.addEventListener("click", async () => {
        const id: string | null = (deleteSpeciesFullBtn as any).dataset
          .speciesId;
        if (!id) return;
        if (
          confirm("Are you sure? This deletes the species and ALL its images!")
        ) {
          try {
            await ButterflyAPI.delete(id);
            alert("Species deleted successfully.");
            location.reload();
          } catch (err) {
            alert("Delete failed: " + (err as Error).message);
          }
        }
      });
    }

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const body: HTMLElement = document.body;
        const isDark: boolean = body.getAttribute("data-bs-theme") === "dark";
        body.setAttribute("data-bs-theme", isDark ? "light" : "dark");
        body.classList.toggle("bg-dark");
        body.classList.toggle("text-white");
        document
          .querySelectorAll(".modal-content")
          .forEach((m: Element) =>
            (m as HTMLElement).classList.toggle("bg-dark"),
          );
      });
    }
    showView(portfolio);
    refreshGallery();
  }

  function addDynamicField(label: string = "", value: string = "") {
    const container: HTMLElement | null = document.getElementById(
      "dynamicSpeciesFields",
    );
    if (!container) return;

    const div: HTMLDivElement = document.createElement("div");
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

let currentSpeciesId: string | null = null;

export async function initHome(userRole, userEmail) {
  console.log(
    "Home Initializing with role:",
    userRole,
    "and email:",
    userEmail,
  );

  let currentDisplayMode = "common";

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

  const searchInput = document.getElementById("searchInput");
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
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pass1 = document.getElementById("newPersonalPassword").value;
      const pass2 = document.getElementById("confirmPersonalPassword").value;

      if (pass1 !== pass2) {
        return alert("Passwords do not match! Please try again.");
      }
      if (pass1.length < 7) {
        return alert("Password must be at least 7 characters long.");
      }

      try {
        await ButterflyAPI.resetPassword(userEmail, pass1);
        alert("Password successfully updated!");
        e.target.reset();
        bootstrap.Modal.getInstance(
          document.getElementById("changePasswordModal"),
        ).hide();
      } catch (err) {
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

    if (!editBtn || !saveBtn || !notesDisplay || !tagsDisplay) return;

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
    const copyIdBtn = document.getElementById("copyIdBtn");
    const copyUrlBtn = document.getElementById("copyUrlBtn");
    const copyApiKeyBtn = document.getElementById("copyApiKeyBtn");

    if (copyUrlBtn) {
      copyUrlBtn.innerHTML = `<i class="fas fa-link me-1"></i>Copy Image URL`;
      copyUrlBtn.onclick = () => {
        let urlToCopy = img.url || img.fpath;

        if (studentApiKey) {
          const separator = urlToCopy.includes("?") ? "&" : "?";
          urlToCopy += `${separator}apiKey=${studentApiKey}`;
        }

        navigator.clipboard.writeText(urlToCopy);
        copyUrlBtn.innerHTML = `<i class="fas fa-check me-1"></i>Copied!`;
        setTimeout(
          () =>
            (copyUrlBtn.innerHTML = `<i class="fas fa-link me-1"></i>Copy Image URL`),
          2000,
        );
      };
    }

    if (studentApiKey && copyApiKeyBtn) {
      copyApiKeyBtn.classList.remove("d-none");
      copyApiKeyBtn.innerHTML = `<i class="fas fa-key me-1"></i>Copy API Key`;
      copyApiKeyBtn.onclick = () => {
        navigator.clipboard.writeText(studentApiKey);
        copyApiKeyBtn.innerHTML = `<i class="fas fa-check me-1"></i>Copied!`;
        setTimeout(
          () =>
            (copyApiKeyBtn.innerHTML = `<i class="fas fa-key me-1"></i>Copy API Key`),
          2000,
        );
      };
    } else if (copyApiKeyBtn) {
      copyApiKeyBtn.classList.add("d-none");
    }

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
        notesDisplay.innerText === "No notes available."
          ? ""
          : notesDisplay.innerText;

      notesDisplay.classList.add("d-none");
      notesInput.classList.remove("d-none");

      notesInput.value = currentNotes;

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

      const editInput = document.getElementById("editNotesInput");
      const newNotes = editInput ? editInput.value : "";

      const selectedCheckboxes = document.querySelectorAll(
        ".edit-tag-checkbox:checked",
      );
      const newTagIds = Array.from(selectedCheckboxes).map((cb) =>
        String(cb.value),
      );

      const oldTagIds = (img.tags || []).map((t) => String(t.id || t.tagId));
      const toAdd = newTagIds.filter((tagId) => !oldTagIds.includes(tagId));
      const toRemove = oldTagIds.filter((tagId) => !newTagIds.includes(tagId));
      const noteInput =
        document.getElementById("editNotesInput") ||
        document.getElementById("modalNotes");
      const updatedNotes = noteInput ? noteInput.value : "";

      console.log("Notes being sent to server:", updatedNotes);

      try {
        await ButterflyAPI.updateImageDetails(id, {
          //description: img.description || "",
          nathansNotes: updatedNotes,
          life_cycle:
            document.getElementById("editLifecycleInput")?.value || "Adult",
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
      } catch (err) {
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

        document.getElementById("editSpeciesId").value = b.id;
        document.getElementById("editSpeciesName").value = b.name || "";
        document.getElementById("editSpeciesScientific").value =
          b.scientificName || "";
        document.getElementById("editSpeciesOrder").value = b.orderName || "";
        document.getElementById("editSpeciesFamily").value = b.family || "";
        document.getElementById("editSpeciesGenus").value = b.genus || "";
        const fullDesc = b.description || "";

        const attributeRegex = /\[\[(.*?):\s*(.*?)\]\]/g;
        let match;

        while ((match = attributeRegex.exec(fullDesc)) !== null) {
          addDynamicField(match[1].trim(), match[2].trim());
        }

        document.getElementById("editSpeciesDescription").value = fullDesc
          .replace(/\[\[.*?\]\]/g, "")
          .trim();
      };
    }

    const setMainImage = (img) => {
      const url = img.url || "assets/img/noimage.jpg";
      document.getElementById("speciesImage").src = url;
      const modalImg = document.getElementById("butterflyModalImage");
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

    const allImgs = fetchedImages.map((img) => {
      const noteFromBackend =
        img.nathansNotes ||
        img.nathan_notes ||
        img.notes ||
        img.nathansnotes ||
        "";

      return {
        id: img.id,
        url: img.fpath,
        size: img.fileSize ? img.fileSize + " bytes" : "Unknown",
        lifecycle: img.lifecyclestage || "Unknown",
        nathansNotes: noteFromBackend,
        tags: img.tags || [],
      };
    });
    const gridContainer = document.getElementById("speciesImages");

    const renderInnerGrid = (selectedTags = "all") => {
      gridContainer.innerHTML = "";

      const isShowingAll =
        selectedTags === "all" ||
        (Array.isArray(selectedTags) && selectedTags.includes("all")) ||
        (Array.isArray(selectedTags) && selectedTags.length === 0);

      const filtered = allImgs.filter((img) => {
        if (isShowingAll) return true;

        const imageTagIds = img.tags.map((t) => String(t.tagId || t.id));
        return selectedTags.every((id) => imageTagIds.includes(String(id)));
      });
      if (filtered.length === 0) {
        gridContainer.innerHTML =
          '<p class="text-muted p-3">No images match this filter.</p>';
        return;
      }

      filtered.forEach((imgObj) => {
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
        col.querySelector("img").onclick = (e) => {
          document
            .querySelectorAll(".gallery-thumb-wrapper img")
            .forEach((el) => el.classList.remove("border-primary", "border-3"));
          e.currentTarget.classList.add("border-primary", "border-3");
          setMainImage(imgObj);
        };

        const deleteBtn = col.querySelector(".delete-single-img-btn");
        if (deleteBtn) {
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            window.handleDeleteSingleImage(imgObj.id);
          };
        }

        col.addEventListener("mouseenter", () => {
          if (deleteBtn) deleteBtn.style.opacity = "0.85";
        });
        col.addEventListener("mouseleave", () => {
          if (deleteBtn) deleteBtn.style.opacity = "0";
        });

        gridContainer.appendChild(col);
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

      filterBar.querySelectorAll(".filter-pill").forEach((btn) => {
        btn.onclick = () => {
          const tagId = btn.getAttribute("data-tag");

          if (tagId === "all") {
            filterBar.querySelectorAll(".filter-pill").forEach((b) => {
              b.classList.replace("btn-primary", "btn-outline-secondary");
              b.classList.remove("active");
            });
            btn.classList.replace("btn-outline-secondary", "btn-primary");
            btn.classList.add("active");
          } else {
            btn.classList.toggle("active");
            btn.classList.toggle("btn-primary");
            btn.classList.toggle("btn-outline-secondary");

            const allBtn = filterBar.querySelector('[data-tag="all"]');
            allBtn.classList.replace("btn-primary", "btn-outline-secondary");
            allBtn.classList.remove("active");
          }

          const activePills = filterBar.querySelectorAll(".filter-pill.active");
          const selectedIds = Array.from(activePills).map((p) =>
            p.getAttribute("data-tag"),
          );

          if (selectedIds.length === 0) {
            const allBtn = filterBar.querySelector('[data-tag="all"]');
            allBtn.classList.replace("btn-outline-secondary", "btn-primary");
            allBtn.classList.add("active");
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

  const refreshGallery = (data = butterflies) => {
    UI.renderGrid(data, (b) => showSpeciesView(b), currentDisplayMode);
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
      const query = e.target.value.toLowerCase();
      const filtered = allCachedUsers.filter((u) =>
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
      (u) => u.userId.toString() === userId.toString(),
    );
    if (currentRole === "ADMIN") {
      const adminCount = allCachedUsers.filter(
        (u) => (u.uType || u.userType || u.utype) === "ADMIN",
      ).length;
      if (adminCount <= 1)
        return alert(
          "Action Denied: The system must always have at least one administrator.",
        );
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
    const userId = select.value;
    if (!userId) return alert("Please select a student first.");
    try {
      await ButterflyAPI.addTeamMember(teamId, userId);
      await loadAdminData();
    } catch (error) {
      alert("Could not add student: " + error.message);
    }
  };

  window.removeStudentFromTeam = async (teamId, userId) => {
    if (confirm("Remove this student from the team?")) {
      try {
        await ButterflyAPI.removeTeamMember(teamId, userId);
        await loadAdminData();
      } catch (error) {
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
      } catch (err) {
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
      } catch (err) {
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
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  window.openExtendModal = (keyId) => {
    const extendInput = document.getElementById("extendKeyId");
    if (extendInput) extendInput.value = keyId;
    const modalElem = document.getElementById("adminExtendKeyModal");
    if (modalElem) new bootstrap.Modal(modalElem).show();
  };

  window.openEditUserModal = (userId, currentUsername, currentEmail) => {
    document.getElementById("editUserId").value = userId;
    document.getElementById("editUsername").value = currentUsername;
    document.getElementById("editEmail").value = currentEmail;
    document.getElementById("editPassword").value = "";
    new bootstrap.Modal(document.getElementById("adminEditUserModal")).show();
  };

  const adminCreateTeamForm = document.getElementById("adminCreateTeamForm");
  if (adminCreateTeamForm) {
    adminCreateTeamForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const teamData = {
        name: document.getElementById("newCreateTeamName").value,
        projectName: document.getElementById("newCreateProjectName").value,
        semester: document.getElementById("newCreateSemester").value,
      };
      await ButterflyAPI.createTeam(teamData);
      await loadAdminData();
      e.target.reset();
      bootstrap.Modal.getInstance(
        document.getElementById("adminCreateTeamModal"),
      ).hide();
    });
  }

  const adminAddUserForm = document.getElementById("adminAddUserForm");
  if (adminAddUserForm) {
    adminAddUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameVal = document.getElementById("adminNewUsername").value;
      const emailVal = document.getElementById("adminNewEmail").value;
      const passVal = document.getElementById("adminNewPassword").value;
      const roleVal = document.getElementById("adminNewRole").value;

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
        e.target.reset();
        bootstrap.Modal.getInstance(
          document.getElementById("adminAddUserModal"),
        ).hide();
        alert("User successfully created!");
      } catch (error) {
        alert("Could not create user: " + error.message);
      }
    });
  }

  const adminEditUserForm = document.getElementById("adminEditUserForm");
  if (adminEditUserForm) {
    adminEditUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = document.getElementById("editUserId").value;
      const newUsername = document.getElementById("editUsername").value;
      const newEmail = document.getElementById("editEmail").value;

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

        const newPassword = document
          .getElementById("editPassword")
          .value.trim();
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
        teamName: document.getElementById("newTeamName").value,
        projectName: document.getElementById("newProjectName").value,
        semester: document.getElementById("newSemester").value,
      });
      await loadAdminData();
      e.target.reset();
      const modalElem = document.getElementById("adminGenerateKeyModal");
      if (modalElem) bootstrap.Modal.getInstance(modalElem).hide();
    });
  }

  if (adminExtendKeyForm) {
    adminExtendKeyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const keyId = document.getElementById("extendKeyId").value;
      const months = document.getElementById("extendMonths").value;
      await ButterflyAPI.extendApiKey(keyId, months);
      await loadAdminData();
      e.target.reset();
      const modalElem = document.getElementById("adminExtendKeyModal");
      if (modalElem) bootstrap.Modal.getInstance(modalElem).hide();
    });
  }

  const universalUploadForm = document.getElementById("universalUploadForm");
  if (universalUploadForm) {
    const uploadModal = document.getElementById("addButterflyModal");
    if (uploadModal) {
      uploadModal.addEventListener("show.bs.modal", async () => {
        await TagManager.initTagContainer();
        const selector = document.getElementById("speciesSelector");
        if (selector) {
          selector.innerHTML = `<option value="NEW">-- Create New Species --</option>`;
          butterflies.forEach((s) => {
            selector.innerHTML += `<option value="${s.id}">${s.name}</option>`;
          });
          const newSpeciesFields = document.getElementById("newSpeciesFields");
          if (newSpeciesFields) {
            newSpeciesFields.style.display =
              selector.value === "NEW" ? "block" : "none";
          }
          selector.onchange = () => {
            if (newSpeciesFields) {
              newSpeciesFields.style.display =
                selector.value === "NEW" ? "block" : "none";
            }
          };
        }
      });
    }

    universalUploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const selector = document.getElementById("speciesSelector");
      const fileInput = document.getElementById("newImageFile");

      if (!fileInput.files || fileInput.files.length === 0) {
        return alert("Please select at least one image file.");
      }

      let speciesId = selector.value;

      if (speciesId === "NEW") {
        const name = document.getElementById("newName").value.trim();
        if (!name)
          return alert("Please enter a common name for the new species.");
        try {
          const newSpecies = await ButterflyAPI.create({
            name: name,
            scientificName: document.getElementById("newScientific").value,
            description: document.getElementById("newDescription").value,
            orderName: document.getElementById("newOrderName")
              ? document.getElementById("newOrderName").value
              : "",
            family: document.getElementById("newFamily")
              ? document.getElementById("newFamily").value
              : "",
            genus: document.getElementById("newGenus")
              ? document.getElementById("newGenus").value
              : "",
          });
          speciesId = newSpecies.id;
          butterflies = await ButterflyAPI.getAll();
          refreshGallery();
        } catch (err) {
          return alert("Failed to create species: " + err.message);
        }
      }

      const checkedBoxes = universalUploadForm.querySelectorAll(
        'input[name="tagIds"]:checked',
      );
      const tagIds = Array.from(checkedBoxes).map((cb) => cb.value);
      const nathansNotes = document.getElementById("nathanNotes").value;

      const files = Array.from(fileInput.files);
      let successCount = 0;
      let failCount = 0;

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("species_id", speciesId);
        formData.append("nathansNotes", nathansNotes);
        if (tagIds.length > 0) {
          tagIds.forEach((id) => formData.append("tagId", id));
        }
        try {
          await ButterflyAPI.uploadImage(formData);
          successCount++;
        } catch (err) {
          console.error("Failed to upload " + file.name + ":", err);
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

      e.target.reset();
      const selectorAfterReset = document.getElementById("speciesSelector");
      if (selectorAfterReset) selectorAfterReset.value = "NEW";
      const newSpeciesFields = document.getElementById("newSpeciesFields");
      if (newSpeciesFields) newSpeciesFields.style.display = "block";

      bootstrap.Modal.getInstance(
        document.getElementById("addButterflyModal"),
      ).hide();
      butterflies = await ButterflyAPI.getAll();
      refreshGallery();
    });
  }

  const addImageToSpeciesForm = document.getElementById(
    "addImageToSpeciesForm",
  );
  if (addImageToSpeciesForm) {
    addImageToSpeciesForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const speciesId = document.getElementById("targetSpeciesId").value;
      const fileInput = document.getElementById("speciesImageFiles");
      const notes = document.getElementById("speciesImageNotes").value;

      if (!fileInput.files || fileInput.files.length === 0) {
        return alert("Please select at least one image.");
      }

      const files = Array.from(fileInput.files);
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
      e.target.reset();
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
      const speciesId = document.getElementById("editSpeciesId").value;
      let currentDescValue =
        document.getElementById("editSpeciesDescription").value || "";
      let cleanBaseDescription = currentDescValue
        .replace(/\[\[.*?\]\]/g, "")
        .trim();
      const customInputs = document.querySelectorAll(".custom-species-input");
      let extraString = "";

      customInputs.forEach((input) => {
        const label = input.getAttribute("data-label");
        const value = input.value;
        if (label && value && value.trim() !== "") {
          extraString += ` [[${label}: ${value.trim()}]]`;
        }
      });
      const finalDescription = (cleanBaseDescription + extraString).trim();
      console.log("Total Description Length:", finalDescription.length);

      const data = {
        name: document.getElementById("editSpeciesName").value,
        scientificName:
          document.getElementById("editSpeciesScientific").value || "",
        description: finalDescription,
        orderName: document.getElementById("editSpeciesOrder").value || "",
        family: document.getElementById("editSpeciesFamily").value || "",
        genus: document.getElementById("editSpeciesGenus").value || "",
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
      } catch (err) {
        console.error("Update failed:", err);
        alert("Update failed: " + err.message);
      }
    });
  }

  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      const currentSpecies = butterflies.find(
        (b) => b.name === document.getElementById("speciesName").innerText,
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
    ).map((cb) => cb.value);
    const checkedFamilies = Array.from(
      document.querySelectorAll("#filterFamilyContainer input:checked"),
    ).map((cb) => cb.value);

    document.getElementById("orderBtnText").innerText =
      checkedOrders.length > 0
        ? `${checkedOrders.length} Selected`
        : "All Orders";
    document.getElementById("familyBtnText").innerText =
      checkedFamilies.length > 0
        ? `${checkedFamilies.length} Selected`
        : "All Families";

    const query = searchInput ? searchInput.value.toLowerCase() : "";

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

    refreshGallery(filtered);
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
            const term = e.target.value.toLowerCase();
            const items = document.querySelectorAll(
              `#${containerId} .filter-item`,
            );
            items.forEach((item) => {
              const label = item.querySelector("label").innerText.toLowerCase();
              item.style.display = label.includes(term) ? "block" : "none";
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
        searchInput.placeholder = "Search by scientific name...";

        nameToggleBtn.style.backgroundColor = "white";
        nameToggleBtn.style.color = "#1abc9c";
        nameToggleBtn.style.borderColor = "#1abc9c";

        nameToggleBtn.innerHTML = `<i class="fas fa-exchange-alt me-1"></i><span class="fw-bold small">Scientific</span>`;
      } else {
        currentDisplayMode = "common";
        searchInput.placeholder = "Search by common name...";

        nameToggleBtn.style.backgroundColor = "#1abc9c";
        nameToggleBtn.style.color = "white";
        nameToggleBtn.style.borderColor = "#1abc9c";

        nameToggleBtn.innerHTML = `<i class="fas fa-exchange-alt me-1"></i><span class="fw-bold small">Common</span>`;
      }
      applyAllFilters();
    });

    //for adding a base category
    document.getElementById("addNewSpeciesFieldBtn").onclick = () => {
      const fieldName = prompt(
        "What is the name of the new category? (e.g. Host Plant, Habitat)",
      );
      if (!fieldName) return;

      const container = document.getElementById("dynamicSpeciesFields");
      const safeName = fieldName.replace(/\s+/g, "_").toLowerCase();

      const html = `
        <div class="mb-3 dynamic-field-wrapper">
            <label class="form-label fw-bold d-flex justify-content-between">
                ${fieldName}
                <button type="button" class="btn-close small" style="font-size: 0.6rem;" onclick="this.parentElement.parentElement.remove()"></button>
            </label>
            <input type="text" class="form-control custom-species-input" 
                   data-label="${fieldName}" 
                   placeholder="Enter ${fieldName}...">
        </div>
    `;
      container.insertAdjacentHTML("beforeend", html);
    };

    //for the base category but i dont think backend is updated
    const addFieldBtn = document.getElementById("addNewSpeciesFieldBtn");
    if (addFieldBtn) {
      addFieldBtn.onclick = () => {
        const fieldName = prompt(
          "What is the name of the new category? (e.g. Host Plant, Habitat)",
        );
        if (fieldName && fieldName.trim() !== "") {
          addDynamicField(fieldName.trim());
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
          } catch (err) {
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
    refreshGallery();
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
