import { ButterflyAPI } from "./api.js";
import { UI } from "./ui.js";
import { TagManager } from "./tags.js";
let currentSpeciesId = null;
export async function initHome(userRole, userEmail) {
    console.log("Home Initializing with role:", userRole, "and email:", userEmail);
    let currentDisplayMode = "common";
    let butterflies = await ButterflyAPI.getAll();
    console.log("DATABASES SPECIES LIST:", butterflies);
    let studentApiKey = "";
    if (userRole !== "ADMIN") {
        try {
            const dashboardData = await ButterflyAPI.getStudentDashboard(userEmail);
            if (dashboardData && dashboardData.apiKey) {
                studentApiKey = dashboardData.apiKey;
            }
            else {
                const allTeams = await ButterflyAPI.getAllTeams();
                for (const t of allTeams) {
                    const members = await ButterflyAPI.getTeamMembers(t.id);
                    if (members.some((m) => m.email === userEmail)) {
                        const keys = await ButterflyAPI.getAllApiKeys();
                        const teamKey = keys.find((k) => k.teamName === t.name && k.active !== false);
                        if (teamKey)
                            studentApiKey = teamKey.keyVal;
                        break;
                    }
                }
            }
        }
        catch (e) {
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
    const openChangePasswordBtn = document.getElementById("openChangePasswordBtn");
    const changePasswordForm = document.getElementById("changePasswordForm");
    if (openChangePasswordBtn) {
        openChangePasswordBtn.addEventListener("click", (e) => {
            e.preventDefault();
            new window.bootstrap.Modal(document.getElementById("changePasswordModal")).show();
        });
    }
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const pass1 = document.getElementById("newPersonalPassword").value;
            const pass2 = document.getElementById("confirmPersonalPassword").value;
            if (pass1 !== pass2)
                return alert("Passwords do not match! Please try again.");
            if (pass1.length < 7)
                return alert("Password must be at least 7 characters long.");
            try {
                await ButterflyAPI.resetPassword(userEmail, pass1);
                alert("Password successfully updated!");
                e.target.reset();
                window.bootstrap.Modal.getInstance(document.getElementById("changePasswordModal")).hide();
            }
            catch (err) {
                alert("Failed to update password: " + err.message);
            }
        });
    }
    const showView = (view) => {
        [portfolio, speciesView, teamView].forEach((v) => {
            if (v)
                v.style.display = "none";
        });
        if (view)
            view.style.display = "block";
        window.scrollTo(0, 0);
    };
    const goToGallery = () => {
        showView(portfolio);
        if (searchNavBar)
            searchNavBar.style.display = "flex";
        if (filterPanel)
            filterPanel.style.display = "";
        if (viewGalleryBtn)
            viewGalleryBtn.classList.add("active");
        if (viewTeamBtn)
            viewTeamBtn.classList.remove("active");
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
        }
        else {
            editBtn.classList.add("d-none");
        }
        saveBtn.classList.add("d-none");
        notesDisplay.classList.remove("d-none");
        notesInput.classList.add("d-none");
        tagsDisplay.classList.remove("d-none");
        if (editTagsContainer)
            editTagsContainer.classList.add("d-none");
        const sizeElem = document.getElementById("modalSize");
        if (sizeElem)
            sizeElem.innerText = img.size || "Unknown";
        const noteText = img.nathansNotes ||
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
        }
        else {
            tagsDisplay.innerHTML =
                '<span class="text-muted small">No tags assigned.</span>';
        }
        setupImageEditing(img);
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
                setTimeout(() => (copyUrlBtn.innerHTML = `<i class="fas fa-link me-1"></i>Copy Image URL`), 2000);
            };
        }
        if (studentApiKey && copyApiKeyBtn) {
            copyApiKeyBtn.classList.remove("d-none");
            copyApiKeyBtn.innerHTML = `<i class="fas fa-key me-1"></i>Copy API Key`;
            copyApiKeyBtn.onclick = () => {
                navigator.clipboard.writeText(studentApiKey);
                copyApiKeyBtn.innerHTML = `<i class="fas fa-check me-1"></i>Copied!`;
                setTimeout(() => (copyApiKeyBtn.innerHTML = `<i class="fas fa-key me-1"></i>Copy API Key`), 2000);
            };
        }
        else if (copyApiKeyBtn) {
            copyApiKeyBtn.classList.add("d-none");
        }
        const modalElement = document.getElementById("imageDetailsModal");
        if (modalElement) {
            let detailModal = window.bootstrap.Modal.getInstance(modalElement);
            if (!detailModal)
                detailModal = new window.bootstrap.Modal(modalElement);
            detailModal.show();
        }
    };
    const setupImageEditing = (img) => {
        const editBtn = document.getElementById("editImageBtn");
        const saveBtn = document.getElementById("saveImageBtn");
        const checkboxList = document.getElementById("tagCheckboxList");
        if (!editBtn || !saveBtn)
            return;
        editBtn.onclick = async () => {
            editBtn.classList.add("d-none");
            saveBtn.classList.remove("d-none");
            const notesDisplay = document.getElementById("modalNotes");
            const notesInput = document.getElementById("editNotesInput");
            if (!notesDisplay || !notesInput)
                return;
            const currentNotes = notesDisplay.innerText === "No notes available."
                ? ""
                : notesDisplay.innerText;
            notesDisplay.classList.add("d-none");
            notesInput.classList.remove("d-none");
            notesInput.value = currentNotes;
            const tagsDisplay = document.getElementById("modalTags");
            const editTagsContainer = document.getElementById("editTagsContainer");
            if (tagsDisplay)
                tagsDisplay.classList.add("d-none");
            if (editTagsContainer)
                editTagsContainer.classList.remove("d-none");
            try {
                const dbTags = await ButterflyAPI.getAllTags();
                const currentTagIds = (img.tags || []).map((t) => String(t.tagId || t.id || t));
                let finalHtml = "";
                for (const [categoryName, tagNames] of Object.entries(TagManager.tagData)) {
                    let categoryGroupHtml = "";
                    let hasFoundAny = false;
                    tagNames.forEach((name) => {
                        const match = dbTags.find((t) => t &&
                            t.tagName &&
                            t.tagName.toString().trim().toLowerCase() ===
                                name.trim().toLowerCase());
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
                if (checkboxList)
                    checkboxList.innerHTML =
                        finalHtml ||
                            '<p class="text-muted small">No matching tags found.</p>';
            }
            catch (err) {
                console.error("Edit Tag UI Error:", err);
            }
        };
        saveBtn.onclick = async () => {
            const id = img.id || img.imageId;
            if (!id)
                return alert("Error: Could not find the ID for this image.");
            const editInput = document.getElementById("editNotesInput");
            const newNotes = editInput ? editInput.value : "";
            const selectedCheckboxes = document.querySelectorAll(".edit-tag-checkbox:checked");
            const newTagIds = Array.from(selectedCheckboxes).map((cb) => String(cb.value));
            const oldTagIds = (img.tags || []).map((t) => String(t.id || t.tagId));
            const toAdd = newTagIds.filter((tagId) => !oldTagIds.includes(tagId));
            const toRemove = oldTagIds.filter((tagId) => !newTagIds.includes(tagId));
            try {
                await ButterflyAPI.updateImageDetails(id, {
                    nathansNotes: newNotes,
                    life_cycle: document.getElementById("editLifecycleInput")?.value || "Adult",
                });
                const tagPromises = [
                    ...toAdd.map((tagId) => ButterflyAPI.addTagToImage(tagId, id)),
                    ...toRemove.map((tagId) => ButterflyAPI.removeTagFromImage(tagId, id)),
                ];
                await Promise.all(tagPromises);
                alert("Update Successful!");
                if (currentSpeciesId) {
                    const freshSpecies = await ButterflyAPI.getSpeciesById(currentSpeciesId);
                    await showSpeciesView(freshSpecies);
                }
                window.bootstrap.Modal.getInstance(document.getElementById("imageDetailsModal")).hide();
            }
            catch (err) {
                console.error("Save failed:", err);
                alert("Error saving: " + err.message);
            }
        };
    };
    const showSpeciesView = async (b) => {
        showView(speciesView);
        if (searchNavBar)
            searchNavBar.style.display = "none";
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
            editSpeciesBtn.onclick = () => {
                const dynamicContainer = document.getElementById("dynamicSpeciesFields");
                if (dynamicContainer)
                    dynamicContainer.innerHTML = "";
                document.getElementById("editSpeciesId").value =
                    String(b.id);
                document.getElementById("editSpeciesName").value =
                    b.name || "";
                document.getElementById("editSpeciesScientific").value = b.scientificName || "";
                document.getElementById("editSpeciesOrder").value = b.orderName || "";
                document.getElementById("editSpeciesFamily").value = b.family || "";
                document.getElementById("editSpeciesGenus").value = b.genus || "";
                const fullDesc = b.description || "";
                const attributeRegex = /\[\[(.*?):\s*(.*?)\]\]/g;
                let match;
                while ((match = attributeRegex.exec(fullDesc)) !== null) {
                    addDynamicField(match[1], match[2]);
                }
                document.getElementById("editSpeciesDescription").value = fullDesc.replace(/\[\[.*?\]\]/g, "").trim();
            };
        }
        const setMainImage = (img) => {
            const url = img.url || "assets/img/noimage.jpg";
            document.getElementById("speciesImage").src = url;
            const modalImg = document.getElementById("butterflyModalImage");
            if (modalImg)
                modalImg.src = url;
            const sizeElem = document.getElementById("currentImgSize");
            if (sizeElem)
                sizeElem.innerText = img.size || "Unknown";
            const lifecycleElem = document.getElementById("speciesLifecycle");
            if (lifecycleElem)
                lifecycleElem.innerText = img.lifecycle || "Adult";
            const notesElem = document.getElementById("speciesNotes");
            if (notesElem)
                notesElem.innerText =
                    img.nathansNotes && img.nathansNotes.trim() !== ""
                        ? img.nathansNotes
                        : "No notes available.";
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
        }
        catch (err) {
            console.error("Could not load images for species:", err);
        }
        const allImgs = fetchedImages.map((img) => ({
            id: img.id,
            url: img.fpath,
            size: img.fileSize ? img.fileSize + " bytes" : "Unknown",
            lifecycle: img.lifecyclestage || "Unknown",
            nathansNotes: img.nathansNotes ||
                img.nathan_notes ||
                img.notes ||
                img.nathansnotes ||
                "",
            tags: img.tags || [],
        }));
        const gridContainer = document.getElementById("speciesImages");
        if (!gridContainer)
            return;
        const renderInnerGrid = (selectedTags = "all") => {
            gridContainer.innerHTML = "";
            const isShowingAll = selectedTags === "all" ||
                (Array.isArray(selectedTags) && selectedTags.length === 0);
            const filtered = allImgs.filter((img) => {
                if (isShowingAll)
                    return true;
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
                <img src="${imgObj.url || "assets/img/noimage.jpg"}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;">
            </div>
            ${isAdmin
                    ? `<button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle delete-single-img-btn" style="width:24px; height:24px; padding:0; font-size:10px; z-index:5; opacity:0; transition: opacity 0.2s;" title="Delete this image"><i class="fas fa-times"></i></button>`
                    : ""}
        `;
                const imgElement = col.querySelector("img");
                if (imgElement) {
                    imgElement.onclick = (e) => {
                        document
                            .querySelectorAll(".gallery-thumb-wrapper img")
                            .forEach((el) => el.classList.remove("border-primary", "border-3"));
                        e.currentTarget.classList.add("border-primary", "border-3");
                        setMainImage(imgObj);
                    };
                }
                const deleteBtn = col.querySelector(".delete-single-img-btn");
                if (deleteBtn) {
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        window.handleDeleteSingleImage(imgObj.id);
                    };
                    col.addEventListener("mouseenter", () => (deleteBtn.style.opacity = "0.85"));
                    col.addEventListener("mouseleave", () => (deleteBtn.style.opacity = "0"));
                }
                gridContainer.appendChild(col);
            });
            if (filtered.length > 0)
                setMainImage(filtered[0]);
        };
        const renderFilterPills = () => {
            const filterBar = document.getElementById("filterTagCloud");
            if (!filterBar)
                return;
            const allUniqueTags = Array.from(new Map(allImgs
                .flatMap((img) => img.tags || [])
                .map((t) => [t.tagId || t.id, t])).values());
            let html = `<button class="btn btn-sm btn-primary filter-pill active" data-tag="all">All</button>`;
            allUniqueTags.forEach((tag) => {
                if (tag.tagName || tag.name) {
                    html += `<button class="btn btn-sm btn-outline-secondary filter-pill" data-tag="${tag.tagId || tag.id}">${tag.tagName || tag.name}</button>`;
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
                    }
                    else {
                        btn.classList.toggle("active");
                        btn.classList.toggle("btn-primary");
                        btn.classList.toggle("btn-outline-secondary");
                        const allBtn = filterBar.querySelector('[data-tag="all"]');
                        if (allBtn) {
                            allBtn.classList.replace("btn-primary", "btn-outline-secondary");
                            allBtn.classList.remove("active");
                        }
                    }
                    const activePills = filterBar.querySelectorAll(".filter-pill.active");
                    const selectedIds = Array.from(activePills).map((p) => p.getAttribute("data-tag"));
                    if (selectedIds.length === 0 || selectedIds.includes("all")) {
                        const allBtn = filterBar.querySelector('[data-tag="all"]');
                        if (allBtn) {
                            allBtn.classList.replace("btn-outline-secondary", "btn-primary");
                            allBtn.classList.add("active");
                        }
                        renderInnerGrid("all");
                    }
                    else {
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
    let allCachedUsers = [];
    let globalUserTeamMap = {};
    async function loadAdminData() {
        const [users, teams] = await Promise.all([
            ButterflyAPI.getAllUsers(),
            ButterflyAPI.getAllTeams(),
        ]);
        users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
        allCachedUsers = users;
        globalUserTeamMap = {};
        const memberResults = await Promise.all(teams.map((t) => ButterflyAPI.getTeamMembers(t.id)));
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
        if (!tbody)
            return;
        tbody.innerHTML = "";
        usersList.forEach((u) => {
            const tr = document.createElement("tr");
            const currentRole = u.uType || u.userType || u.utype;
            const badgeClass = currentRole === "ADMIN" ? "bg-danger" : "bg-primary";
            const teamName = globalUserTeamMap[u.userId] ||
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
    async function loadTeams() {
        const [teams, unassigned, allKeys] = await Promise.all([
            ButterflyAPI.getAllTeams(),
            ButterflyAPI.getUnassignedStudents(),
            ButterflyAPI.getAllApiKeys(),
        ]);
        const container = document.getElementById("teamsContainer");
        if (!container)
            return;
        container.innerHTML = "";
        if (teams.length === 0) {
            container.innerHTML = `<p class="text-muted fst-italic">No teams yet. Click "Create Team" to get started.</p>`;
            return;
        }
        let studentOptions = `<option value="">Select a student...</option>`;
        unassigned.forEach((u) => {
            studentOptions += `<option value="${u.userId}">${u.username} — ${u.email}</option>`;
        });
        const membersByTeam = await Promise.all(teams.map((t) => ButterflyAPI.getTeamMembers(t.id)));
        for (let idx = 0; idx < teams.length; idx++) {
            const team = teams[idx];
            const members = membersByTeam[idx];
            const teamKey = allKeys.find((k) => k.teamName === team.name);
            const isActive = teamKey && teamKey.active !== false && teamKey.status !== "INACTIVE";
            let membersHtml = members.length === 0
                ? `<span class="text-muted fst-italic small">No members yet</span>`
                : members
                    .map((m) => {
                    const initials = m.username.substring(0, 2).toUpperCase();
                    return `
            <span class="d-inline-flex align-items-center gap-1 me-1 mb-1 px-2 py-1 rounded-pill border small" style="background: #f8f9fa; font-size: 0.8rem;">
                <span class="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold" style="width:20px; height:20px; background:#EEEDFE; color:#3C3489; font-size:9px;">${initials}</span>
                ${m.username}
                <span style="cursor:pointer; font-size:10px; color:#888; margin-left:2px;" onclick="window.removeStudentFromTeam('${team.id}', '${m.userId}')">✕</span>
            </span>`;
                })
                    .join("");
            let apiKeyHtml = !teamKey
                ? `
          <div class="d-flex align-items-center justify-content-between p-2 rounded" style="background:#f8f9fa; border: 0.5px solid #dee2e6;">
              <span class="text-muted small fst-italic">No API key found</span>
              <button class="btn btn-sm btn-outline-secondary" style="font-size:0.75rem;" onclick="window.regenerateTeamKey('${team.name}', '${team.projectName}', '${team.semester}')"><i class="fas fa-key me-1"></i>Generate Key</button>
          </div>`
                : `
          <div class="p-2 rounded" style="background:#f8f9fa; border: 0.5px solid #dee2e6;">
              <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="badge rounded-pill px-2 py-1" style="font-size:0.7rem; background: ${isActive ? "#d1fae5" : "#fef3c7"}; color: ${isActive ? "#065f46" : "#92400e"};">${isActive ? "Active" : "Inactive"}</span>
                  <span class="text-muted" style="font-size:0.7rem;">${teamKey.expiration ? "Expires " + new Date(teamKey.expiration).toLocaleDateString() : "No expiry set"}</span>
              </div>
              <div class="font-monospace text-break mb-2" style="font-size:0.72rem; color:#555; word-break:break-all;">${teamKey.keyVal}</div>
              <div class="d-flex flex-wrap gap-1">
                  <button class="btn btn-sm btn-outline-secondary" style="font-size:0.72rem;" onclick="window.toggleApiKeyStatus('${teamKey.id}', ${isActive})">${isActive ? "Deactivate" : "Activate"}</button>
                  <button class="btn btn-sm btn-outline-warning" style="font-size:0.72rem;" onclick="window.openExtendModal('${teamKey.id}')">Extend</button>
                  <button class="btn btn-sm btn-outline-primary" style="font-size:0.72rem;" onclick="window.regenerateTeamKey('${team.name}', '${team.projectName}', '${team.semester}')">Regenerate</button>
                  <button class="btn btn-sm btn-outline-danger" style="font-size:0.72rem;" onclick="window.deleteApiKey('${teamKey.id}')">Delete Key</button>
              </div>
          </div>`;
            const card = document.createElement("div");
            card.className = "card shadow-sm border-0 mb-3";
            card.innerHTML = `
          <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-1">
                  <div>
                      <h5 class="fw-bold mb-0" style="color: #0399b0;">${team.name}</h5>
                      <div class="text-muted small">${team.projectName} &nbsp;·&nbsp; ${team.semester}</div>
                  </div>
                  <button class="btn btn-sm btn-outline-danger" style="font-size:0.72rem;" onclick="window.deleteTeam('${team.id}')"><i class="fas fa-trash"></i></button>
              </div>
              <hr class="my-2">
              <div class="mb-1 small fw-bold text-dark">Members</div>
              <div class="mb-2 d-flex flex-wrap">${membersHtml}</div>
              <div class="input-group input-group-sm mb-3">
                  <select class="form-select" id="assignStudentSelect-${team.id}" style="font-size:0.8rem;">${studentOptions}</select>
                  <button class="btn btn-outline-success" style="font-size:0.8rem;" onclick="window.addStudentToTeam('${team.id}')">+ Add</button>
              </div>
              <div class="mb-1 small fw-bold text-dark">API Key</div>
              ${apiKeyHtml}
          </div>`;
            container.appendChild(card);
        }
    }
    // Bind Global Functions
    window.deleteSystemUser = async (userId) => {
        if (confirm("Delete this user permanently?")) {
            await ButterflyAPI.deleteUser(userId);
            await loadAdminData();
        }
    };
    window.toggleUserRole = async (userId, currentRole) => {
        const targetUser = allCachedUsers.find((u) => u.userId.toString() === userId.toString());
        if (currentRole === "ADMIN") {
            const adminCount = allCachedUsers.filter((u) => (u.uType || u.userType || u.utype) === "ADMIN").length;
            if (adminCount <= 1)
                return alert("Action Denied: The system must always have at least one administrator.");
            if (targetUser && targetUser.email === userEmail) {
                if (!confirm("WARNING: You are about to remove your own admin privileges! You will be logged out immediately if you proceed. Do you want to continue?"))
                    return;
                try {
                    await ButterflyAPI.makeStudent(userId);
                    alert("Your admin privileges have been revoked. Logging out...");
                    location.reload();
                    return;
                }
                catch (error) {
                    return alert("Failed to change role.");
                }
            }
            await ButterflyAPI.makeStudent(userId);
        }
        else {
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
        if (!select.value)
            return alert("Please select a student first.");
        try {
            await ButterflyAPI.addTeamMember(teamId, select.value);
            await loadAdminData();
        }
        catch (error) {
            alert("Could not add student: " + error.message);
        }
    };
    window.removeStudentFromTeam = async (teamId, userId) => {
        if (confirm("Remove this student from the team?")) {
            try {
                await ButterflyAPI.removeTeamMember(teamId, userId);
                await loadAdminData();
            }
            catch (error) {
                alert("Could not remove student: " + error.message);
            }
        }
    };
    window.toggleApiKeyStatus = async (keyId, currentlyActive) => {
        if (currentlyActive)
            await ButterflyAPI.deactivateApiKey(keyId);
        else
            await ButterflyAPI.activateApiKey(keyId);
        await loadAdminData();
    };
    window.regenerateTeamKey = async (teamName, projectName, semester) => {
        if (confirm("Regenerate the API key for " +
            teamName +
            "? The old key will stop working immediately.")) {
            try {
                await ButterflyAPI.generateApiKey({ teamName, projectName, semester });
                await loadAdminData();
            }
            catch (err) {
                alert("Failed to regenerate key: " + err.message);
            }
        }
    };
    window.deleteApiKey = async (keyId) => {
        if (confirm("Delete this API key permanently? Students using it will lose access.")) {
            try {
                await ButterflyAPI.deleteApiKey(keyId);
                await loadAdminData();
            }
            catch (err) {
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
                    const freshButterfly = await ButterflyAPI.getSpeciesById(currentSpeciesId);
                    await showSpeciesView(freshButterfly);
                }
                else {
                    location.reload();
                }
            }
            catch (err) {
                alert("Error: " + err.message);
            }
        }
    };
    window.openExtendModal = (keyId) => {
        const extendInput = document.getElementById("extendKeyId");
        if (extendInput)
            extendInput.value = String(keyId);
        const modalElem = document.getElementById("adminExtendKeyModal");
        if (modalElem)
            new window.bootstrap.Modal(modalElem).show();
    };
    window.openEditUserModal = (userId, currentUsername, currentEmail) => {
        document.getElementById("editUserId").value =
            String(userId);
        document.getElementById("editUsername").value =
            currentUsername;
        document.getElementById("editEmail").value =
            currentEmail;
        document.getElementById("editPassword").value = "";
        new window.bootstrap.Modal(document.getElementById("adminEditUserModal")).show();
    };
    const adminCreateTeamForm = document.getElementById("adminCreateTeamForm");
    if (adminCreateTeamForm) {
        adminCreateTeamForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const teamData = {
                name: document.getElementById("newCreateTeamName")
                    .value,
                projectName: document.getElementById("newCreateProjectName").value,
                semester: document.getElementById("newCreateSemester").value,
            };
            await ButterflyAPI.createTeam(teamData);
            await loadAdminData();
            e.target.reset();
            window.bootstrap.Modal.getInstance(document.getElementById("adminCreateTeamModal")).hide();
        });
    }
    const universalUploadForm = document.getElementById("universalUploadForm");
    if (universalUploadForm) {
        universalUploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const selector = document.getElementById("speciesSelector");
            const fileInput = document.getElementById("newImageFile");
            if (!fileInput.files || fileInput.files.length === 0)
                return alert("Please select at least one image file.");
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
                            ?.value || "",
                        family: document.getElementById("newFamily")
                            ?.value || "",
                        genus: document.getElementById("newGenus")
                            ?.value || "",
                    });
                    speciesId = newSpecies.id;
                    butterflies = await ButterflyAPI.getAll();
                    refreshGallery();
                }
                catch (err) {
                    return alert("Failed to create species: " + err.message);
                }
            }
            const checkedBoxes = universalUploadForm.querySelectorAll('input[name="tagIds"]:checked');
            const tagIds = Array.from(checkedBoxes).map((cb) => cb.value);
            const nathansNotes = document.getElementById("nathanNotes").value;
            const files = Array.from(fileInput.files);
            let successCount = 0;
            let failCount = 0;
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("species_id", String(speciesId));
                formData.append("nathansNotes", nathansNotes);
                tagIds.forEach((id) => formData.append("tagId", id));
                try {
                    await ButterflyAPI.uploadImage(formData);
                    successCount++;
                }
                catch (err) {
                    console.error("Failed to upload " + file.name + ":", err);
                    failCount++;
                }
            }
            alert(failCount === 0
                ? `${successCount} image(s) uploaded successfully!`
                : `${successCount} uploaded, ${failCount} failed.`);
            e.target.reset();
            window.bootstrap.Modal.getInstance(document.getElementById("addButterflyModal")).hide();
            butterflies = await ButterflyAPI.getAll();
            refreshGallery();
        });
    }
    const editSpeciesForm = document.getElementById("editSpeciesForm");
    if (editSpeciesForm) {
        editSpeciesForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const speciesId = document.getElementById("editSpeciesId").value;
            let cleanBaseDescription = (document.getElementById("editSpeciesDescription")
                .value || "")
                .replace(/\[\[.*?\]\]/g, "")
                .trim();
            let extraString = "";
            document
                .querySelectorAll(".custom-species-input")
                .forEach((input) => {
                const label = input.getAttribute("data-label");
                const value = input.value;
                if (label && value && value.trim() !== "")
                    extraString += ` [[${label}: ${value.trim()}]]`;
            });
            const data = {
                name: document.getElementById("editSpeciesName")
                    .value,
                scientificName: document.getElementById("editSpeciesScientific")
                    .value || "",
                description: (cleanBaseDescription + extraString).trim(),
                orderName: document.getElementById("editSpeciesOrder")
                    .value || "",
                family: document.getElementById("editSpeciesFamily")
                    .value || "",
                genus: document.getElementById("editSpeciesGenus")
                    .value || "",
            };
            try {
                await ButterflyAPI.updateSpecies(speciesId, data);
                window.bootstrap.Modal.getInstance(document.getElementById("editSpeciesModal")).hide();
                butterflies = await ButterflyAPI.getAll();
                const freshSpecies = await ButterflyAPI.getSpeciesById(speciesId);
                await showSpeciesView(freshSpecies);
                refreshGallery();
                alert("Species updated successfully!");
            }
            catch (err) {
                alert("Update failed: " + err.message);
            }
        });
    }
    function addDynamicField(label = "", value = "") {
        const container = document.getElementById("dynamicSpeciesFields");
        if (!container)
            return;
        const div = document.createElement("div");
        div.className = "mb-3 dynamic-field-wrapper";
        div.innerHTML = `
      <label class="form-label fw-bold d-flex justify-content-between small text-muted">
          ${label}
          <button type="button" class="btn-close" style="font-size: 0.5rem;" onclick="this.closest('.dynamic-field-wrapper').remove()"></button>
      </label>
      <input type="text" class="form-control custom-species-input" data-label="${label}" value="${value}">
    `;
        container.appendChild(div);
    }
}
//# sourceMappingURL=homepage.js.map