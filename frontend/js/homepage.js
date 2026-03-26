import { ButterflyAPI } from "./api.js";
import { UI } from "./ui.js";
import { TagManager } from "./tags.js";

export async function initHome(userRole, userEmail) {
    console.log("Home Initializing with role:", userRole, "and email:", userEmail);

    let butterflies = await ButterflyAPI.getAll();
    console.log("DATABASES SPECIES LIST:", butterflies);

    const portfolio = document.getElementById("portfolio");
    const teamView = document.getElementById("teamView");
    const speciesView = document.getElementById("speciesView");
    const searchNavBar = document.getElementById("searchNavBar");

    const viewGalleryBtn = document.getElementById("viewGalleryBtn");
    const viewTeamBtn = document.getElementById("viewTeamBtn");
    const backBtn = document.getElementById("backToGalleryBtn");

    const searchInput = document.getElementById("searchInput");
    const themeToggle = document.getElementById("toggleTheme");

    const adminTeamContent = document.getElementById("adminTeamContent");
    const studentTeamContent = document.getElementById("studentTeamContent");

    const adminGenerateKeyForm = document.getElementById("adminGenerateKeyForm");
    const adminExtendKeyForm = document.getElementById("adminExtendKeyForm");

    let activeTagFilters = new Set();
    const filterTagCloud = document.getElementById("filterTagCloud");

    const showView = (view) => {
        [portfolio, speciesView, teamView].forEach((v) => {
            if (v) v.style.display = "none";
        });
        if (view) view.style.display = "block";
        window.scrollTo(0, 0);
    };

    const showSpeciesView = async (b) => {
        showView(speciesView);
        if (searchNavBar) searchNavBar.style.display = "none";

        const isAdmin = (userRole === "ADMIN");
        UI.populateSpeciesView(b, isAdmin);

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
                notesElem.innerText = (noteText && noteText !== "undefined") ? noteText : "No researcher notes available.";
            }
        };

        // TAYLOR CHANGE: fetch images from backend
        let fetchedImages = [];
        try {
            fetchedImages = await ButterflyAPI.getImagesBySpecies(b.id);
        } catch (err) {
            console.error("Could not load images for species:", err);
        }

        const allImgs = fetchedImages.map(img => ({
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

            const filtered = allImgs.filter(img => {
                if (tagId === "all") return true;
                return img.tags.some(t => String(t.tagId || t.id) === String(tagId) || String(t) === String(tagId));
            });

            if (filtered.length === 0) {
                gridContainer.innerHTML = '<p class="text-muted p-3">No images match this filter.</p>';
                return;
            }

            filtered.forEach((imgObj) => {
                const col = document.createElement("div");
                col.className = "col-4 mb-2 gallery-thumb-wrapper";
                col.innerHTML = `
                    <div class="ratio ratio-1x1 shadow-sm rounded overflow-hidden">
                        <img src="${imgObj.url || "assets/img/noimage.jpg"}"
                             style="width:100%; height:100%; object-fit:cover; cursor:pointer;">
                    </div>
                `;
                col.querySelector("img").onclick = (e) => {
                    document.querySelectorAll(".gallery-thumb-wrapper img").forEach(el => el.classList.remove("border-primary", "border-3"));
                    e.currentTarget.classList.add("border-primary", "border-3");
                    setMainImage(imgObj);
                };
                gridContainer.appendChild(col);
            });

            if (filtered.length > 0) setMainImage(filtered[0]);
        };

        const renderFilterPills = () => {
            const filterBar = document.getElementById("filterTagCloud");
            if (!filterBar) return;

            // TAYLOR CHANGE: changed to use use tagId/tagName to match backend dto
            const allUniqueTags = Array.from(new Map(
                allImgs.flatMap(img => img.tags || []).map(t => [t.tagId || t.id, t])
            ).values());

            console.log("Tags found on images:", allUniqueTags);

            const filterSection = filterBar.closest(".p-3.rounded.border");
            if (allUniqueTags.length === 0) {
                if (filterSection) filterSection.style.display = "none";
                return;
            }
            if (filterSection) filterSection.style.display = "block";

            let html = `<button class="btn btn-sm btn-primary filter-pill active" data-tag="all">All</button>`;
            allUniqueTags.forEach(tag => {
                const tagName = tag.tagName || tag.name;
                const tagId = tag.tagId || tag.id;
                if (tagName) {
                    html += `<button class="btn btn-sm btn-outline-secondary filter-pill" data-tag="${tagId}">${tagName}</button>`;
                }
            });
            filterBar.innerHTML = html;

            filterBar.querySelectorAll('.filter-pill').forEach(btn => {
                btn.onclick = () => {
                    filterBar.querySelectorAll('.filter-pill').forEach(b => {
                        b.classList.replace('btn-primary', 'btn-outline-secondary');
                        b.classList.remove('active');
                    });
                    btn.classList.replace('btn-outline-secondary', 'btn-primary');
                    btn.classList.add('active');
                    renderInnerGrid(btn.getAttribute("data-tag"));
                };
            });
        };

        renderFilterPills();
        renderInnerGrid("all");
    };

    const refreshGallery = (data = butterflies) => {
        UI.renderGrid(data, (b) => showSpeciesView(b));
    };

    // STUDENT DASHBOARD
    async function loadStudentData(email) {
        if (!email) return;
        try {
            const dashboardData = await ButterflyAPI.getStudentDashboard(email);
            let myTeam = dashboardData ? dashboardData.team : null;
            let myApiKey = dashboardData && dashboardData.apiKey
                ? dashboardData.apiKey
                : "No active API Key found";

            if (!myTeam) {
                const allTeams = await ButterflyAPI.getAllTeams();
                for (const t of allTeams) {
                    const members = await ButterflyAPI.getTeamMembers(t.id);
                    if (members.some((m) => m.email === email)) {
                        myTeam = t;
                        const keys = await ButterflyAPI.getAllApiKeys();
                        const teamKey = keys.find((k) => k.teamName === t.name && k.active !== false);
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
            const membersHtml = members.map(m => `<span class="badge bg-primary fs-6 me-2 mb-2">${m.username}</span>`).join("");

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

    // ADMIN DATA
    let allCachedUsers = [];
    let globalUserTeamMap = {};

    async function loadAdminData() {
        let users = await ButterflyAPI.getAllUsers();
        users.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
        allCachedUsers = users;

        globalUserTeamMap = {};
        const teams = await ButterflyAPI.getAllTeams();
        for (const t of teams) {
            const members = await ButterflyAPI.getTeamMembers(t.id);
            for (const m of members) {
                globalUserTeamMap[m.userId] = t.name;
            }
        }

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
            const teamName = globalUserTeamMap[u.userId] || '<span class="text-muted fst-italic">Unassigned</span>';

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
            const filtered = allCachedUsers.filter((u) => u.username.toLowerCase().includes(query));
            renderAllUsersTable(filtered);
        });
    }

    // TAYLOR CHANGE: team card
    async function loadTeams() {
        const teams = await ButterflyAPI.getAllTeams();
        const unassigned = await ButterflyAPI.getUnassignedStudents();
        const allKeys = await ButterflyAPI.getAllApiKeys();
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

        for (const team of teams) {
            const members = await ButterflyAPI.getTeamMembers(team.id);
            const teamKey = allKeys.find((k) => k.teamName === team.name);
            const isActive = teamKey && teamKey.active !== false && teamKey.status !== "INACTIVE";

            let membersHtml = "";
            if (members.length === 0) {
                membersHtml = `<span class="text-muted fst-italic small">No members yet</span>`;
            } else {
                membersHtml = members.map((m) => {
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
                }).join("");
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
                                background: ${isActive ? '#d1fae5' : '#fef3c7'};
                                color: ${isActive ? '#065f46' : '#92400e'};">
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
        const targetUser = allCachedUsers.find((u) => u.userId.toString() === userId.toString());
        if (currentRole === "ADMIN") {
            const adminCount = allCachedUsers.filter((u) => (u.uType || u.userType || u.utype) === "ADMIN").length;
            if (adminCount <= 1) return alert("Action Denied: The system must always have at least one administrator.");
            if (targetUser && targetUser.email === userEmail) {
                const proceed = confirm("WARNING: You are about to remove your own admin privileges! You will be logged out immediately if you proceed. Do you want to continue?");
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
        if (confirm("Regenerate the API key for " + teamName + "? The old key will stop working immediately.")) {
            try {
                await ButterflyAPI.generateApiKey({ teamName, projectName, semester });
                await loadAdminData();
            } catch (err) {
                alert("Failed to regenerate key: " + err.message);
            }
        }
    };

    window.deleteApiKey = async (keyId) => {
        if (confirm("Delete this API key permanently? Students using it will lose access.")) {
            try {
                await ButterflyAPI.deleteApiKey(keyId);
                await loadAdminData();
            } catch (err) {
                alert("Failed to delete key: " + err.message);
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
            bootstrap.Modal.getInstance(document.getElementById("adminCreateTeamModal")).hide();
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
            if (!emailRegex.test(emailVal)) return alert("Please enter a valid email address.");
            if (usernameVal.length < 5) return alert("Username must be at least 5 characters long.");
            if (passVal.length < 7) return alert("Password must be at least 7 characters long.");

            try {
                const allUsers = await ButterflyAPI.getAllUsers();
                if (allUsers.some((u) => u.username.toLowerCase() === usernameVal.toLowerCase())) {
                    return alert("This username already exists.");
                }
                await ButterflyAPI.adminCreateAccount({ username: usernameVal, email: emailVal, password: passVal, utype: roleVal });
                await loadAdminData();
                e.target.reset();
                bootstrap.Modal.getInstance(document.getElementById("adminAddUserModal")).hide();
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
            if (!emailRegex.test(newEmail)) return alert("Please enter a valid email address.");
            if (newUsername.length < 5) return alert("Username must be at least 5 characters long.");

            try {
                const allUsers = await ButterflyAPI.getAllUsers();
                if (allUsers.some((u) => u.username.toLowerCase() === newUsername.toLowerCase() && u.userId.toString() !== userId.toString())) {
                    return alert("This username already exists.");
                }
                await ButterflyAPI.updateUsername(userId, newUsername);
                await ButterflyAPI.updateEmail(userId, newEmail);
                await loadAdminData();
                bootstrap.Modal.getInstance(document.getElementById("adminEditUserModal")).hide();
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

    // TAYLOR CHANGE: bulk upload and adding orderName/family/genus
    const universalUploadForm = document.getElementById("universalUploadForm");
    if (universalUploadForm) {
        const uploadModal = document.getElementById("addButterflyModal");
        if (uploadModal) {
            uploadModal.addEventListener("show.bs.modal", async () => {
                await TagManager.initTagContainer();
                const selector = document.getElementById("speciesSelector");
                if (selector) {
                    selector.innerHTML = `<option value="NEW">-- Create New Species --</option>`;
                    butterflies.forEach(s => {
                        selector.innerHTML += `<option value="${s.id}">${s.name}</option>`;
                    });
                    const newSpeciesFields = document.getElementById("newSpeciesFields");
                    if (newSpeciesFields) {
                        newSpeciesFields.style.display = selector.value === "NEW" ? "block" : "none";
                    }
                    selector.onchange = () => {
                        if (newSpeciesFields) {
                            newSpeciesFields.style.display = selector.value === "NEW" ? "block" : "none";
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
                if (!name) return alert("Please enter a common name for the new species.");
                try {
                    const newSpecies = await ButterflyAPI.create({
                        name: name,
                        scientificName: document.getElementById("newScientific").value,
                        description: document.getElementById("newDescription").value,
                        orderName: document.getElementById("newOrderName") ? document.getElementById("newOrderName").value : "",
                        family: document.getElementById("newFamily") ? document.getElementById("newFamily").value : "",
                        genus: document.getElementById("newGenus") ? document.getElementById("newGenus").value : "",
                    });
                    speciesId = newSpecies.id;
                    butterflies = await ButterflyAPI.getAll();
                    refreshGallery();
                } catch (err) {
                    return alert("Failed to create species: " + err.message);
                }
            }

            const checkedBoxes = universalUploadForm.querySelectorAll('input[name="tagIds"]:checked');
            const tagIds = Array.from(checkedBoxes).map(cb => cb.value);
            const lifecycle = document.getElementById("lifecycleStage").value;
            const nathansNotes = document.getElementById("nathanNotes").value;

            const files = Array.from(fileInput.files);
            let successCount = 0;
            let failCount = 0;

            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("species_id", speciesId);
                formData.append("life_cycle", lifecycle);
                formData.append("nathansNotes", nathansNotes);
                if (tagIds.length > 0) {
                    tagIds.forEach(id => formData.append("tagId", id));
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
                alert(successCount + " image" + (successCount > 1 ? "s" : "") + " uploaded successfully!");
            } else {
                alert(successCount + " uploaded, " + failCount + " failed. Check console for details.");
            }

            e.target.reset();
            bootstrap.Modal.getInstance(document.getElementById("addButterflyModal")).hide();
            butterflies = await ButterflyAPI.getAll();
            refreshGallery();
        });
    }

    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", () => {
            const currentSpecies = butterflies.find(b => b.name === document.getElementById("speciesName").innerText);
            if (currentSpecies) showSpeciesView(currentSpecies);
        });
    }

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            showView(portfolio);
            if (searchNavBar) searchNavBar.style.display = "flex";
        });
    }

    if (viewGalleryBtn) {
        viewGalleryBtn.addEventListener("click", () => {
            showView(portfolio);
            if (searchNavBar) searchNavBar.style.display = "flex";
            viewGalleryBtn.classList.add("active");
            if (viewTeamBtn) viewTeamBtn.classList.remove("active");
        });
    }

    if (viewTeamBtn) {
        viewTeamBtn.addEventListener("click", async () => {
            showView(teamView);
            if (searchNavBar) searchNavBar.style.display = "none";
            viewTeamBtn.classList.add("active");
            if (viewGalleryBtn) viewGalleryBtn.classList.remove("active");

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

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase();
            const filtered = butterflies.filter(b => b.name.toLowerCase().includes(query));
            refreshGallery(filtered);
        });
    }

    const deleteSpeciesFullBtn = document.getElementById("deleteSpeciesFullBtn");
    if (deleteSpeciesFullBtn) {
        deleteSpeciesFullBtn.addEventListener("click", async () => {
            const id = deleteSpeciesFullBtn.dataset.speciesId;
            if (!id) return;
            if (confirm("Are you sure? This deletes the species and ALL its images!")) {
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
            document.querySelectorAll(".modal-content").forEach(m => m.classList.toggle("bg-dark"));
        });
    }

    showView(portfolio);
    refreshGallery();
}