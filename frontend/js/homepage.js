import { ButterflyAPI } from "./api.js";
import { UI } from "./ui.js";

export async function initHome(userRole, userEmail) {
  console.log(
    "Home Initializing with role:",
    userRole,
    "and email:",
    userEmail,
  );

  // 1. DATA INITIALIZATION
  let butterflies = await ButterflyAPI.getAll();

  // 2. ELEMENT SELECTORS
  const portfolio = document.getElementById("portfolio");
  const teamView = document.getElementById("teamView");
  const speciesView = document.getElementById("speciesView");
  const searchNavBar = document.getElementById("searchNavBar");

  const viewGalleryBtn = document.getElementById("viewGalleryBtn");
  const viewTeamBtn = document.getElementById("viewTeamBtn");
  const backBtn = document.getElementById("backToGalleryBtn");

  const searchInput = document.getElementById("searchInput");
  const themeToggle = document.getElementById("toggleTheme");

  const deleteBtn = document.getElementById("deleteButterflyBtn");
  const addForm = document.getElementById("addButterflyForm");

  const adminTeamContent = document.getElementById("adminTeamContent");
  const studentTeamContent = document.getElementById("studentTeamContent");

  const adminGenerateKeyForm = document.getElementById("adminGenerateKeyForm");
  const adminExtendKeyForm = document.getElementById("adminExtendKeyForm");

  // Tag Management State
  let activeTagFilters = new Set();
  const filterTagCloud = document.getElementById("filterTagCloud");

  // 3. VIEW MANAGEMENT HELPERS
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

    document.getElementById("speciesName").innerText = b.name;
    document.getElementById("speciesScientific").innerText = b.scientific;
    document.getElementById("speciesDescription").innerText = b.description;

    const setMainImage = (imgUrl, sizeText) => {
      document.getElementById("speciesImage").src =
        imgUrl || "assets/img/noimage.jpg";
      document.getElementById("butterflyModalImage").src =
        imgUrl || "assets/img/noimage.jpg";
      document.getElementById("currentImgSize").innerText =
        sizeText || "Unknown";
    };

    const gridContainer = document.getElementById("speciesImages");
    gridContainer.innerHTML = "";

    const allImgs = [
      { url: b.image, size: b.imgSize, tags: b.tags || [] },
      ...(b.additionalImages || []).map((img) => ({
        url: img.url,
        size: img.imgSize || "Unknown",
        tags: img.tagIds || [],
      })),
    ];

    const renderInnerGrid = (imagesToRender) => {
      gridContainer.innerHTML = "";
      if (imagesToRender.length === 0) {
        gridContainer.innerHTML =
          '<p class="text-muted">No images match the selected tags.</p>';
        return;
      }

      imagesToRender.forEach((imgObj, idx) => {
        const col = document.createElement("div");
        col.className = "col-4";
        col.innerHTML = `
        <div class="inner-thumb-wrapper rounded ${idx === 0 ? "active" : ""}" style="aspect-ratio: 1/1;">
          <img src="${imgObj.url || "assets/img/noimage.jpg"}" style="width:100%; height:100%; object-fit:cover;">
        </div>
      `;

        col.querySelector(".inner-thumb-wrapper").onclick = (e) => {
          document
            .querySelectorAll(".inner-thumb-wrapper")
            .forEach((el) => el.classList.remove("active"));
          e.currentTarget.classList.add("active");
          setMainImage(imgObj.url, imgObj.size);
        };

        gridContainer.appendChild(col);
      });

      if (imagesToRender.length > 0) {
        setMainImage(imagesToRender[0].url, imagesToRender[0].size);
      }
    };

    renderInnerGrid(allImgs);
    await renderTags(userRole, renderInnerGrid, allImgs);
  };

  const refreshGallery = (data = butterflies) => {
    UI.renderGrid(data, (b) => {
      showSpeciesView(b);
    });
  };

  // --- 4. TAG MANAGEMENT LOGIC ---
  const renderTags = async (role, gridRenderFunction, currentImages) => {
    if (!filterTagCloud) return;

    try {
      const tags = await ButterflyAPI.getAllTags();
      filterTagCloud.innerHTML = "";
      activeTagFilters.clear();

      tags.forEach((tag) => {
        const tagWrapper = document.createElement("div");
        tagWrapper.className = "d-flex align-items-center gap-1 mb-1";

        const btn = document.createElement("button");
        btn.className = "btn btn-sm btn-outline-dark rounded-pill fw-bold";
        btn.innerText = tag.name;

        btn.onclick = async () => {
          if (activeTagFilters.has(tag.id)) {
            activeTagFilters.delete(tag.id);
            btn.classList.replace("btn-success", "btn-outline-dark");
            btn.classList.replace("text-white", "text-dark");
          } else {
            activeTagFilters.add(tag.id);
            btn.classList.replace("btn-outline-dark", "btn-success");
            btn.classList.replace("text-dark", "text-white");
          }

          if (activeTagFilters.size === 0) {
            gridRenderFunction(currentImages);
          } else {
            const activeArray = Array.from(activeTagFilters);
            const filteredImgs = currentImages.filter((img) => {
              return activeArray.every((selectedTagId) =>
                img.tags.includes(selectedTagId),
              );
            });
            gridRenderFunction(filteredImgs);
          }
        };

        tagWrapper.appendChild(btn);

        if (role === "ADMIN") {
          const delBtn = document.createElement("button");
          delBtn.className = "btn btn-sm btn-link p-0 text-danger ms-1";
          delBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
          delBtn.onclick = async () => {
            if (confirm("Delete this tag entirely?")) {
              await ButterflyAPI.deleteTag(tag.id);
              await renderTags(role, gridRenderFunction, currentImages);
            }
          };
          tagWrapper.appendChild(delBtn);
        }

        filterTagCloud.appendChild(tagWrapper);
      });

      if (role === "ADMIN") {
        const addTagBtn = document.createElement("button");
        addTagBtn.className =
          "btn btn-sm btn-success rounded-pill fw-bold ms-2";
        addTagBtn.innerHTML = '<i class="fas fa-plus"></i> Add Filter';
        addTagBtn.setAttribute("data-bs-toggle", "modal");
        addTagBtn.setAttribute("data-bs-target", "#adminTagModal");
        filterTagCloud.appendChild(addTagBtn);
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const adminTagForm = document.getElementById("adminTagForm");
  if (adminTagForm) {
    adminTagForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const tagData = {
        name: document.getElementById("tagName").value,
        category: document.getElementById("tagCategory").value,
      };

      await ButterflyAPI.createTag(tagData);

      const currentSpecies = butterflies.find(
        (b) => b.name === document.getElementById("speciesName").innerText,
      );
      if (currentSpecies) showSpeciesView(currentSpecies);

      e.target.reset();
      const modalElem = document.getElementById("adminTagModal");
      if (modalElem) bootstrap.Modal.getInstance(modalElem).hide();
    });
  }

  // ==========================================
  // 5. STUDENT DASHBOARD LOGIC
  // ==========================================
  async function loadStudentData(email) {
    if (!email) return;

    try {
      const dashboardData = await ButterflyAPI.getStudentDashboard(email);
      let myTeam = dashboardData ? dashboardData.team : null;
      let myApiKey =
        dashboardData && dashboardData.apiKey
          ? dashboardData.apiKey.id
          : "No active API Key found";

      if (!myTeam) {
        console.warn(
          "Dashboard endpoint missed the team. Searching manually...",
        );
        const allTeams = await ButterflyAPI.getAllTeams();

        for (const t of allTeams) {
          const members = await ButterflyAPI.getTeamMembers(t.id);
          if (members.some((m) => m.email === email)) {
            myTeam = t;
            const keys = await ButterflyAPI.getAllApiKeys();
            const teamKey = keys.find(
              (k) => k.teamName === t.name && k.active !== false,
            );
            if (teamKey) myApiKey = teamKey.id;
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
          </div>
        `;
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
              <div class="bg-white border rounded p-3 text-break font-monospace text-primary fw-bold shadow-sm">
                ${myApiKey}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error loading student dashboard:", error);
    }
  }

  // ==========================================
  // 6. ADMIN TABBED INTERFACE LOGIC
  // ==========================================
  let allCachedUsers = [];
  let globalUserTeamMap = {}; // Maps userId -> Team Name

  async function loadAdminData() {
    // 1. Fetch Users & Sort Alphabetically
    let users = await ButterflyAPI.getAllUsers();
    users.sort((a, b) =>
      a.username.toLowerCase().localeCompare(b.username.toLowerCase()),
    );
    allCachedUsers = users;

    // 2. Fetch Teams & Members to build the mapping workaround
    globalUserTeamMap = {};
    const teams = await ButterflyAPI.getAllTeams();
    for (const t of teams) {
      const members = await ButterflyAPI.getTeamMembers(t.id);
      for (const m of members) {
        globalUserTeamMap[m.userId] = t.name;
      }
    }

    // 3. Render all tables
    renderAllUsersTable(allCachedUsers);
    await loadUnassignedStudents();
    await loadTeams();
    await loadApiKeysTable();
  }

  // --- TAB 1: USERS ---
  function renderAllUsersTable(usersList) {
    const tbody = document.getElementById("allUsersTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    usersList.forEach((u) => {
      const tr = document.createElement("tr");
      const currentRole = u.uType || u.userType || u.utype;
      const badgeClass = currentRole === "ADMIN" ? "bg-danger" : "bg-primary";

      // Look up the team name, default to "Unassigned" if not found
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
        </td>
      `;
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

  // --- TAB 2: ASSIGN TO TEAM ---
  async function loadUnassignedStudents() {
    const unassigned = await ButterflyAPI.getUnassignedStudents();
    const tbody = document.getElementById("unassignedUsersTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    unassigned.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.username}</td>
        <td>${u.email}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function loadTeams() {
    const teams = await ButterflyAPI.getAllTeams();
    const unassigned = await ButterflyAPI.getUnassignedStudents();
    const container = document.getElementById("teamsContainer");
    if (!container) return;

    container.innerHTML = "";

    let studentOptions = `<option value="">Select a student...</option>`;
    unassigned.forEach((u) => {
      studentOptions += `<option value="${u.userId}">${u.username}</option>`;
    });

    for (const team of teams) {
      const members = await ButterflyAPI.getTeamMembers(team.id);

      let membersHtml =
        members.length === 0
          ? `<p class="text-muted small mb-0">No members assigned.</p>`
          : members
              .map(
                (m) => `
            <span class="badge bg-secondary me-1 mb-1 d-inline-flex align-items-center">
              ${m.username}
              <i class="fas fa-times ms-2" style="cursor:pointer;" onclick="window.removeStudentFromTeam('${team.id}', '${m.userId}')"></i>
            </span>
          `,
              )
              .join("");

      const card = document.createElement("div");
      card.className = "card shadow-sm border-0";
      card.innerHTML = `
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="fw-bold mb-0 text-primary">${team.name}</h5>
          </div>
          <div class="mb-3">
            <h6 class="small fw-bold text-dark mb-1">Members:</h6>
            <div>${membersHtml}</div>
          </div>
          <div class="input-group input-group-sm">
            <select class="form-select" id="assignStudentSelect-${team.id}">
              ${studentOptions}
            </select>
            <button class="btn btn-outline-success" onclick="window.addStudentToTeam('${team.id}')">Add</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    }
  }

  // --- TAB 3: TEAMS & API KEYS ---
  async function loadApiKeysTable() {
    const keys = await ButterflyAPI.getAllApiKeys();
    const teams = await ButterflyAPI.getAllTeams();
    const tbody = document.getElementById("adminApiKeysTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    teams.forEach((team) => {
      const tr = document.createElement("tr");
      const teamKey = keys.find((k) => k.teamName === team.name);

      let statusBadge = '<span class="badge bg-secondary">No Key Found</span>';
      let keyIdDisplay = "N/A";
      let keyActions = "";

      if (teamKey) {
        keyIdDisplay = teamKey.id;
        const isActive =
          teamKey.active !== false && teamKey.status !== "INACTIVE";
        statusBadge = isActive
          ? '<span class="badge bg-success">Active</span>'
          : '<span class="badge bg-warning text-dark">Inactive</span>';

        keyActions = `
          <button class="btn btn-sm btn-outline-secondary me-1" onclick="window.toggleApiKeyStatus('${teamKey.id}', ${isActive})">Toggle Key</button>
          <button class="btn btn-sm btn-outline-warning me-1" onclick="window.openExtendModal('${teamKey.id}')">Extend</button>
        `;
      }

      tr.innerHTML = `
        <td class="fw-bold">${team.name}</td>
        <td>${team.projectName}</td>
        <td>${team.semester}</td>
        <td class="font-monospace text-primary">${keyIdDisplay}</td>
        <td>${statusBadge}</td>
        <td class="text-end">
            ${keyActions}
            <button class="btn btn-sm btn-outline-danger" onclick="window.deleteTeam('${team.id}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ==========================================
  // 7. WINDOW ATTACHED FUNCTIONS (INLINE HTML)
  // ==========================================
  window.deleteSystemUser = async (userId) => {
    if (confirm("Delete this user permanently?")) {
      await ButterflyAPI.deleteUser(userId);
      await loadAdminData();
    }
  };

  window.toggleUserRole = async (userId, currentRole) => {
    // Find the user being modified from our cached list
    const targetUser = allCachedUsers.find(
      (u) => u.userId.toString() === userId.toString(),
    );

    if (currentRole === "ADMIN") {
      // 1. Check how many admins currently exist
      const adminCount = allCachedUsers.filter(
        (u) => (u.uType || u.userType || u.utype) === "ADMIN",
      ).length;

      // 2. Prevent demoting the final admin
      if (adminCount <= 1) {
        return alert(
          "Action Denied: The system must always have at least one administrator.",
        );
      }

      // 3. Check if the admin is trying to demote themselves
      if (targetUser && targetUser.email === userEmail) {
        const proceed = confirm(
          "WARNING: You are about to remove your own admin privileges! You will be logged out immediately if you proceed. Do you want to continue?",
        );

        if (!proceed) return; // Stop if they click Cancel

        try {
          await ButterflyAPI.makeStudent(userId);
          alert("Your admin privileges have been revoked. Logging out...");
          location.reload(); // Refreshing the page effectively logs them out and resets to the welcome screen
          return;
        } catch (error) {
          return alert("Failed to change role.");
        }
      }

      // 4. Demoting another admin (not themselves)
      await ButterflyAPI.makeStudent(userId);
    } else {
      // Promoting a student to admin
      await ButterflyAPI.makeAdmin(userId);
    }

    // Refresh the table to show the new roles
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
      console.error("Add Student Error:", error);
      alert(`Could not add student: ${error.message}`);
    }
  };

  window.removeStudentFromTeam = async (teamId, userId) => {
    if (confirm("Remove this student from the team?")) {
      try {
        await ButterflyAPI.removeTeamMember(teamId, userId);
        await loadAdminData();
      } catch (error) {
        console.error("Remove Student Error:", error);
        alert(`Could not remove student: ${error.message}`);
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

  // ==========================================
  // 8. FORM EVENT LISTENERS
  // ==========================================

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

  // Handle Admin User Creation Form
  const adminAddUserForm = document.getElementById("adminAddUserForm");
  if (adminAddUserForm) {
    adminAddUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const usernameVal = document.getElementById("adminNewUsername").value;
      const emailVal = document.getElementById("adminNewEmail").value;
      const passVal = document.getElementById("adminNewPassword").value;
      const roleVal = document.getElementById("adminNewRole").value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        return alert("Please enter a valid email address.");
      }

      if (usernameVal.length !== 5) {
        return alert("Username must be exactly 5 characters long.");
      }
      if (passVal.length !== 7) {
        return alert("Password must be exactly 7 characters long.");
      }

      try {
        const allUsers = await ButterflyAPI.getAllUsers();
        const usernameExists = allUsers.some(
          (u) => u.username.toLowerCase() === usernameVal.toLowerCase(),
        );

        if (usernameExists) {
          return alert(
            "This username already exists. Please choose a different one.",
          );
        }

        const newUserData = {
          username: usernameVal,
          email: emailVal,
          password: passVal,
          utype: roleVal,
        };

        await ButterflyAPI.adminCreateAccount(newUserData);
        await loadAdminData();

        e.target.reset();
        bootstrap.Modal.getInstance(
          document.getElementById("adminAddUserModal"),
        ).hide();
        alert("User successfully created!");
      } catch (error) {
        console.error("Admin User Creation Error:", error);
        alert(`Could not create user: ${error.message}`);
      }
    });
  }

  // Handle Edit User Form
  const adminEditUserForm = document.getElementById("adminEditUserForm");
  if (adminEditUserForm) {
    adminEditUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = document.getElementById("editUserId").value;
      const newUsername = document.getElementById("editUsername").value;
      const newEmail = document.getElementById("editEmail").value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return alert("Please enter a valid email address.");
      }

      if (newUsername.length !== 5) {
        return alert("Username must be exactly 5 characters long.");
      }

      try {
        const allUsers = await ButterflyAPI.getAllUsers();
        const usernameExists = allUsers.some(
          (u) =>
            u.username.toLowerCase() === newUsername.toLowerCase() &&
            u.userId.toString() !== userId.toString(),
        );

        if (usernameExists) {
          return alert(
            "This username already exists. Please choose a different one.",
          );
        }

        await ButterflyAPI.updateUsername(userId, newUsername);
        await ButterflyAPI.updateEmail(userId, newEmail);
        await loadAdminData();

        document.activeElement.blur();

        bootstrap.Modal.getInstance(
          document.getElementById("adminEditUserModal"),
        ).hide();
        alert("User successfully updated!");
      } catch (error) {
        alert("Failed to update user.");
      }
    });
  }

  // Handle Generate Key Form
  if (adminGenerateKeyForm) {
    adminGenerateKeyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newKeyData = {
        teamName: document.getElementById("newTeamName").value,
        projectName: document.getElementById("newProjectName").value,
        semester: document.getElementById("newSemester").value,
      };

      await ButterflyAPI.generateApiKey(newKeyData);
      await loadAdminData();

      e.target.reset();
      const modalElem = document.getElementById("adminGenerateKeyModal");
      if (modalElem) bootstrap.Modal.getInstance(modalElem).hide();
    });
  }

  // Handle Extend Key Form
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

  // Clear Tags Button
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      activeTagFilters.clear();
      const currentSpecies = butterflies.find(
        (b) => b.name === document.getElementById("speciesName").innerText,
      );
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

  // Search logic
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = butterflies.filter((b) =>
        b.name.toLowerCase().includes(query),
      );
      refreshGallery(filtered);
    });
  }

  // Add new butterfly
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newB = {
        name: document.getElementById("newName").value,
        scientific: document.getElementById("newScientific").value,
        sex: document.getElementById("newSex").value,
        description: document.getElementById("newDescription").value,
        tags: document.getElementById("newTags").value,
        image:
          document.getElementById("newImage").value || "assets/img/noimage.jpg",
      };

      const savedSpecies = await ButterflyAPI.create(newB);
      butterflies.push(savedSpecies);
      refreshGallery();
      e.target.reset();
      const modalElem = document.getElementById("addButterflyModal");
      if (modalElem) bootstrap.Modal.getInstance(modalElem).hide();
    });
  }

  // Delete butterfly
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const idx = parseInt(deleteBtn.dataset.index);
      if (isNaN(idx)) return;
      if (confirm(`Delete "${butterflies[idx].name}"?`)) {
        butterflies.splice(idx, 1);
        await ButterflyAPI.delete(butterflies[idx].id);
        refreshGallery();
      }
    });
  }

  // Theme Toggle
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
      const apiContainer = document.getElementById("apiContainer");
      if (apiContainer) apiContainer.classList.toggle("bg-secondary");
      const imgContainer = document.getElementById("imgContainer");
      if (imgContainer) imgContainer.classList.toggle("bg-secondary");
    });
  }

  // 9. INITIAL RENDER
  showView(portfolio);
  refreshGallery();
}
