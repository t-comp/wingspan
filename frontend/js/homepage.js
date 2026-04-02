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
        // Uses the userEmail passed into initHome!
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
    const tagsDisplay = document.getElementById("modalTags");
    const editTagsContainer = document.getElementById("editTagsContainer");

    if (!editBtn || !saveBtn || !notesDisplay || !tagsDisplay) return;

    // ONLY show the Edit button if the user is an ADMIN
    if (userRole === "ADMIN") {
      editBtn.classList.remove("d-none");
    } else {
      editBtn.classList.add("d-none");
    }

    saveBtn.classList.add("d-none");
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

    // Setup Copy Buttons
    const copyIdBtn = document.getElementById("copyIdBtn");
    const copyUrlBtn = document.getElementById("copyUrlBtn");
    const copyApiKeyBtn = document.getElementById("copyApiKeyBtn");

    if (copyUrlBtn) {
      copyUrlBtn.innerHTML = `<i class="fas fa-link me-1"></i>Copy Image URL`;
      copyUrlBtn.onclick = () => {
        let urlToCopy = img.url || img.fpath;

        // Automatically attach the API key to the URL if they have one!
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

    // Setup the new API Key Button
    if (studentApiKey && copyApiKeyBtn) {
      copyApiKeyBtn.classList.remove("d-none"); // Unhide it for students with keys!
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
      copyApiKeyBtn.classList.add("d-none"); // Keep hidden if no key
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
      if (tagsDisplay) tagsDisplay.classList.add("d-none");
      if (editTagsContainer) editTagsContainer.classList.remove("d-none");

      const currentNotes =
        notesDisplay.innerText === "No notes available."
          ? ""
          : notesDisplay.innerText;
      notesDisplay.innerHTML = `<textarea id="editNotesInput" class="form-control" rows="3">${currentNotes}</textarea>`;

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
                                           value="${match.tagId}" id="edit-tag-${match.tagId}" ${isChecked ? "checked" : ""}>
                                    <label class="form-check-label small text-dark" for="edit-tag-${match.tagId}">
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

      const oldTagIds = (img.tags || []).map((t) =>
        String(t.tagId || t.id || t),
      );

      const toAdd = newTagIds.filter((tagId) => !oldTagIds.includes(tagId));
      const toRemove = oldTagIds.filter((tagId) => !newTagIds.includes(tagId));

      console.log("SYNCING DATA:", {
        imageId: id,
        adding: toAdd,
        removing: toRemove,
        notes: newNotes,
      });

      try {
        await ButterflyAPI.updateImageDescription(
          id,
          img.description || "",
          newNotes,
        );

        const tagPromises = [
          ...toAdd.map((tagId) => ButterflyAPI.addTagToImage(tagId, id)),
          ...toRemove.map((tagId) =>
            ButterflyAPI.removeTagFromImage(tagId, id),
          ),
        ];
        await Promise.all(tagPromises);

        const modalElement = document.getElementById("imageDetailsModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();

        if (currentSpeciesId) {
          butterflies = await ButterflyAPI.getAll();
          const freshButterfly =
            await ButterflyAPI.getSpeciesById(currentSpeciesId);
          await showSpeciesView(freshButterfly);
          alert("Changes saved successfully!");
        } else {
          location.reload();
        }
      } catch (err) {
        console.error("Save failed:", err);
        alert("Update failed: " + err.message);
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
    if (editSpeciesBtn) {
      if (isAdmin) {
        editSpeciesBtn.classList.remove("d-none");
        editSpeciesBtn.onclick = () => {
          document.getElementById("editSpeciesId").value = b.id;
          document.getElementById("editSpeciesName").value = b.name || "";
          document.getElementById("editSpeciesScientific").value =
            b.scientificName || "";
          document.getElementById("editSpeciesDescription").value =
            b.description || "";
          document.getElementById("editSpeciesOrder").value = b.orderName || "";
          document.getElementById("editSpeciesFamily").value = b.family || "";
          document.getElementById("editSpeciesGenus").value = b.genus || "";
        };
      } else {
        editSpeciesBtn.classList.add("d-none");
      }
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
        const noteText = img.nathansNotes || img.nathan_notes || img.notes;
        notesElem.innerText =
          noteText && noteText !== "undefined"
            ? noteText
            : "No notes available.";
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

    const allImgs = fetchedImages.map((img) => ({
      id: img.id,
      url: img.fpath,
      size: img.fileSize ? img.fileSize + " bytes" : "Unknown",
      lifecycle: img.lifecyclestage || "Unknown",
      nathansNotes: img.nathansNotes,
      tags: img.tags || [],
    }));

    const gridContainer = document.getElementById("speciesImages");

    const renderInnerGrid = (tagId = "all") => {
      gridContainer.innerHTML = "";

      const filtered = allImgs.filter((img) => {
        if (tagId === "all") return true;
        return img.tags.some(
          (t) =>
            String(t.tagId || t.id) === String(tagId) ||
            String(t) === String(tagId),
        );
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

      console.log("Tags found on images:", allUniqueTags);

      const filterSection = filterBar.closest(".p-3.rounded.border");
      if (allUniqueTags.length === 0) {
        if (filterSection) filterSection.style.display = "none";
        return;
      }
      if (filterSection) filterSection.style.display = "block";

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
          filterBar.querySelectorAll(".filter-pill").forEach((b) => {
            b.classList.replace("btn-primary", "btn-outline-secondary");
            b.classList.remove("active");
          });
          btn.classList.replace("btn-outline-secondary", "btn-primary");
          btn.classList.add("active");
          renderInnerGrid(btn.getAttribute("data-tag"));
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
                                    onclick="window.toggleApiKeyStatus('${teamKey.id}', ${isActive})">
                                ${isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button class="btn btn-sm btn-outline-warning" style="font-size:0.72rem;"
                                    onclick="window.openExtendModal('${teamKey.id}')">
                                Extend
                            </button>
                            <button class="btn btn-sm btn-outline-primary" style="font-size:0.72rem;"
                                    onclick="window.regenerateTeamKey('${team.name}', '${team.projectName}', '${team.semester}')">
                                Regenerate
                            </button>
                            <button class="btn btn-sm btn-outline-danger" style="font-size:0.72rem;"
                                    onclick="window.deleteApiKey('${teamKey.id}')">
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
    new bootstrap.Modal(document.getElementById("adminEditUserModal")).show();
  };

  window.openEditUserModal = (userId, currentUsername, currentEmail) => {
    document.getElementById("editUserId").value = userId;
    document.getElementById("editUsername").value = currentUsername;
    document.getElementById("editEmail").value = currentEmail;
    document.getElementById("editPassword").value = ""; // ADD THIS LINE TO CLEAR IT!
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

        // --- NEW PASSWORD RESET LOGIC ---
        const newPassword = document
          .getElementById("editPassword")
          .value.trim();
        if (newPassword !== "") {
          if (newPassword.length < 7)
            return alert("Password must be at least 7 characters long.");
          await ButterflyAPI.resetPassword(newEmail, newPassword);
        }
        // --------------------------------

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
        `${successCount} image(s) uploaded${failCount > 0 ? `, ${failCount} failed` : ""}!`,
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
      const data = {
        name: document.getElementById("editSpeciesName").value,
        scientificName: document.getElementById("editSpeciesScientific").value,
        description: document.getElementById("editSpeciesDescription").value,
        orderName: document.getElementById("editSpeciesOrder").value,
        family: document.getElementById("editSpeciesFamily").value,
        genus: document.getElementById("editSpeciesGenus").value,
      };
      try {
        await ButterflyAPI.updateSpecies(speciesId, data);
        bootstrap.Modal.getInstance(
          document.getElementById("editSpeciesModal"),
        ).hide();
        butterflies = await ButterflyAPI.getAll();
        const freshSpecies = await ButterflyAPI.getSpeciesById(speciesId);
        await showSpeciesView(freshSpecies);
        refreshGallery();
        alert("Species updated!");
      } catch (err) {
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
    // 1. Get all checked checkboxes
    const checkedOrders = Array.from(
      document.querySelectorAll("#filterOrderContainer input:checked"),
    ).map((cb) => cb.value);
    const checkedFamilies = Array.from(
      document.querySelectorAll("#filterFamilyContainer input:checked"),
    ).map((cb) => cb.value);

    // 2. Update the button text so the user knows how many are selected
    document.getElementById("orderBtnText").innerText =
      checkedOrders.length > 0
        ? `${checkedOrders.length} Selected`
        : "All Orders";
    document.getElementById("familyBtnText").innerText =
      checkedFamilies.length > 0
        ? `${checkedFamilies.length} Selected`
        : "All Families";

    const query = searchInput ? searchInput.value.toLowerCase() : "";

    // 3. Filter the local 'butterflies' array directly for lightning-fast multi-select
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

      // Helper function to build the checkboxes
      const populateCheckboxes = (container, items, type) => {
        if (!container || !items) return;
        container.innerHTML = "";
        items.forEach((item, index) => {
          if (item) {
            const id = `cb-${type}-${index}`;
            // Swapped 'px-3' for 'ms-2 mb-2' to add proper margin to the left and bottom
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

      // Filter out duplicates and empty values using a Set
      const uniqueOrders = [...new Set(options.orders)].filter(Boolean);
      const uniqueFamilies = [...new Set(options.families)].filter(Boolean);

      // Pass the new 'unique' arrays here instead!
      populateCheckboxes(orderContainer, uniqueOrders, "order");
      populateCheckboxes(familyContainer, uniqueFamilies, "family");

      console.log("HEY POOKIE! The new code is running!");

      // Attach listeners so clicking a checkbox instantly updates the gallery
      document.querySelectorAll(".filter-checkbox").forEach((cb) => {
        cb.addEventListener("change", applyAllFilters);
      });

      // Helper function for the mini search bars inside the dropdowns
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

  // const applyAllFilters = async () => {
  //     const orderSelect = document.getElementById("filterOrder");
  //     const familySelect = document.getElementById("filterFamily");
  //     const genusSelect = document.getElementById("filterGenus");

  //     const order = orderSelect ? orderSelect.value : "";
  //     const family = familySelect ? familySelect.value : "";
  //     const genus = genusSelect ? genusSelect.value : "";
  //     const query = searchInput ? searchInput.value.toLowerCase() : "";

  //     if (order || family || genus) {
  //         try {
  //             let filtered = await ButterflyAPI.filterSpecies(order, family, genus);
  //             if (query) {
  //                 filtered = filtered.filter(b => b.name.toLowerCase().includes(query));
  //             }
  //             refreshGallery(filtered);
  //         } catch (err) {
  //             console.error("Filter failed:", err);
  //         }
  //     } else {
  //         const filtered = query
  //             ? butterflies.filter(b => b.name.toLowerCase().includes(query))
  //             : butterflies;
  //         refreshGallery(filtered);
  //     }
  // };

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyAllFilters, 250);
    });
  }

  const nameToggleBtn = document.getElementById("nameToggleBtn");
  //   const nameToggleText = document.getElementById("nameToggleText");
  //   const nameToggleIcon = document.getElementById("nameToggleIcon");

  if (nameToggleBtn) {
    nameToggleBtn.addEventListener("click", () => {
      // Flip the mode!
      if (currentDisplayMode === "common") {
        currentDisplayMode = "scientific";
        searchInput.placeholder = "Search by scientific name...";

        // Switch to Scientific (White bg, Teal text/border)
        nameToggleBtn.style.backgroundColor = "white";
        nameToggleBtn.style.color = "#1abc9c";
        nameToggleBtn.style.borderColor = "#1abc9c";

        // Safely rebuild the inside of the button so the arrows NEVER disappear!
        nameToggleBtn.innerHTML = `<i class="fas fa-exchange-alt me-1"></i><span class="fw-bold small">Scientific</span>`;
      } else {
        currentDisplayMode = "common";
        searchInput.placeholder = "Search by common name...";

        // Switch to Common (Teal bg, White text/border)
        nameToggleBtn.style.backgroundColor = "#1abc9c";
        nameToggleBtn.style.color = "white";
        nameToggleBtn.style.borderColor = "#1abc9c";

        // Safely rebuild the inside of the button
        nameToggleBtn.innerHTML = `<i class="fas fa-exchange-alt me-1"></i><span class="fw-bold small">Common</span>`;
      }

      // Re-run the filters to instantly update the gallery cards
      applyAllFilters();
    });
  }

  // async function initFilters() {
  //     try {
  //         const options = await ButterflyAPI.getFilterOptions();
  //         const orderSelect = document.getElementById("filterOrder");
  //         const familySelect = document.getElementById("filterFamily");
  //         const genusSelect = document.getElementById("filterGenus");

  //         if (options.orders) {
  //             options.orders.forEach(o => {
  //                 if (o) orderSelect.innerHTML += `<option value="${o}">${o}</option>`;
  //             });
  //         }
  //         if (options.families) {
  //             options.families.forEach(f => {
  //                 if (f) familySelect.innerHTML += `<option value="${f}">${f}</option>`;
  //             });
  //         }
  //         if (options.genera) {
  //             options.genera.forEach(g => {
  //                 if (g) genusSelect.innerHTML += `<option value="${g}">${g}</option>`;
  //             });
  //         }

  //         if (orderSelect) orderSelect.addEventListener("change", applyAllFilters);
  //         if (familySelect) familySelect.addEventListener("change", applyAllFilters);
  //         if (genusSelect) genusSelect.addEventListener("change", applyAllFilters);
  //     } catch (err) {
  //         console.error("Could not load filter options:", err);
  //     }
  // }

  await initFilters();

  const deleteSpeciesFullBtn = document.getElementById("deleteSpeciesFullBtn");
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
