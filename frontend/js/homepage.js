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

  // New Forms
  const adminGenerateKeyForm = document.getElementById("adminGenerateKeyForm");
  const adminExtendKeyForm = document.getElementById("adminExtendKeyForm");

  // --- NEW: TAG MANAGEMENT STATE ---
  let activeTagFilters = new Set();
  const filterTagCloud = document.getElementById("filterTagCloud");

  // 3. VIEW MANAGEMENT HELPERS
  const showView = (view) => {
    [portfolio, speciesView, teamView].forEach((v) => {
      if (v) {
        v.style.display = "none";
      }
    });
    if (view) {
      view.style.display = "block";
    }
    window.scrollTo(0, 0);
  };

  const showSpeciesView = async (b) => {
    showView(speciesView);

    if (searchNavBar) searchNavBar.style.display = "none";

    // Basic Info Setup
    document.getElementById("speciesName").innerText = b.name;
    document.getElementById("speciesScientific").innerText = b.scientific;
    document.getElementById("speciesDescription").innerText = b.description;

    const setMainImage = (imgUrl, sizeText) => {
      document.getElementById("speciesImage").src = imgUrl;
      document.getElementById("butterflyModalImage").src = imgUrl; // For the popup
      document.getElementById("currentImgSize").innerText =
        sizeText || "Unknown";
    };

    // Build the Grid
    const gridContainer = document.getElementById("speciesImages");
    gridContainer.innerHTML = "";

    // Combine images into a list we can work with
    const allImgs = [
      { url: b.image, size: b.imgSize, tags: b.tags || [] },
      ...(b.additionalImages || []).map((img) => ({
        url: img.url,
        size: img.imgSize || "Unknown",
        tags: img.tagIds || [],
      })),
    ];

    // Helper to render the grid
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
          <img src="${imgObj.url}" style="width:100%; height:100%; object-fit:cover;">
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
      // Set main image to the first one in the filtered list
      if (imagesToRender.length > 0) {
        setMainImage(imagesToRender[0].url, imagesToRender[0].size);
      }
    };
    // Render initial grid
    renderInnerGrid(allImgs);

    // Load Tags for this view
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

      // Clear active filters when a new species is loaded
      activeTagFilters.clear();

      tags.forEach((tag) => {
        const tagWrapper = document.createElement("div");
        tagWrapper.className = "d-flex align-items-center gap-1 mb-1";

        const btn = document.createElement("button");
        // Styled like your mockup!
        btn.className = "btn btn-sm btn-outline-dark rounded-pill fw-bold";
        btn.innerText = tag.name;

        // Filtering logic (Species-specific!)
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

          // LOCAL FILTERING: Only filter the images belonging to THIS species!
          if (activeTagFilters.size === 0) {
            gridRenderFunction(currentImages); // Show all if no filters
          } else {
            const activeArray = Array.from(activeTagFilters);
            const filteredImgs = currentImages.filter((img) => {
              // Check if this image has ALL the selected tags
              return activeArray.every((selectedTagId) =>
                img.tags.includes(selectedTagId),
              );
            });
            gridRenderFunction(filteredImgs);
          }
        };

        tagWrapper.appendChild(btn);

        // Admin-only Delete Button (Red X icon)
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

      // Admin "Add Tag" Button
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

  // Handle Tag Creation Form (Admin Only)
  const adminTagForm = document.getElementById("adminTagForm");
  if (adminTagForm) {
    adminTagForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const tagData = {
        name: document.getElementById("tagName").value,
        category: document.getElementById("tagCategory").value,
      };

      await ButterflyAPI.createTag(tagData);

      // Re-render tags (assuming we are looking at the species view)
      const currentSpecies = butterflies.find(
        (b) => b.name === document.getElementById("speciesName").innerText,
      );
      if (currentSpecies) {
        showSpeciesView(currentSpecies);
      }

      e.target.reset();
      const modalElem = document.getElementById("adminTagModal");
      if (modalElem) {
        bootstrap.Modal.getInstance(modalElem).hide();
      }
    });
  }

  // 5. ADMIN TABLE LOGIC (Users)
  async function loadAdminTable() {
    const users = await ButterflyAPI.getAllUsers();
    const tbody = document.getElementById("adminUsersTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    users.forEach((u) => {
      const tr = document.createElement("tr");
      const currentRole = u.uType || u.userType || u.utype;
      let badgeClass = "bg-primary";
      if (currentRole === "ADMIN") {
        badgeClass = "bg-danger";
      }

      // Use u.userId
      tr.innerHTML = `
        <td>${u.userId || "N/A"}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td><span class="badge ${badgeClass}">${currentRole}</span></td>
        <td class="text-end">
            <button class="btn btn-sm btn-outline-secondary me-1" onclick="window.toggleUserRole('${u.userId}', '${currentRole}')">Toggle Role</button>
            <button class="btn btn-sm btn-outline-danger" onclick="window.deleteSystemUser('${u.userId}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- STUDENT DASHBOARD LOGIC ---
  // --- STUDENT DASHBOARD LOGIC ---
  async function loadStudentData(email) {
    if (!email) return;

    try {
      // Step 1: Try the dashboard endpoint first (in case the backend gets fixed!)
      const dashboardData = await ButterflyAPI.getStudentDashboard(email);
      let myTeam = dashboardData ? dashboardData.team : null;
      let myApiKey =
        dashboardData && dashboardData.apiKey
          ? dashboardData.apiKey.id
          : "No active API Key found";

      // Step 2: FRONTEND WORKAROUND
      // If the dashboard says null, manually search the teams to find where they were assigned
      if (!myTeam) {
        console.warn(
          "Dashboard endpoint missed the team. Searching manually...",
        );
        const allTeams = await ButterflyAPI.getAllTeams();

        for (const t of allTeams) {
          const members = await ButterflyAPI.getTeamMembers(t.id);
          // Check if the current student is inside this team's member list
          if (members.some((m) => m.email === email)) {
            myTeam = t;

            // Try to pull the API key for this specific team
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

      // If they STILL aren't found in any team
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

      // If we found their team, fetch the rest of their teammates to display
      const members = await ButterflyAPI.getTeamMembers(myTeam.id);
      const membersHtml = members
        .map(
          (m) =>
            `<span class="badge bg-primary fs-6 me-2 mb-2">${m.username}</span>`,
        )
        .join("");

      // Render the Team Info UI
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

  window.deleteSystemUser = async (userId) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await ButterflyAPI.deleteUser(userId);
      await loadAdminTable();
    }
  };

  window.toggleUserRole = async (userId, currentRole) => {
    if (currentRole === "ADMIN") {
      await ButterflyAPI.makeStudent(userId);
    } else {
      await ButterflyAPI.makeAdmin(userId);
    }
    await loadAdminTable();
  };

  // 6. ADMIN TABLE LOGIC (API Keys)
  async function loadApiKeysTable() {
    const keys = await ButterflyAPI.getAllApiKeys();
    const tbody = document.getElementById("adminApiKeysTableBody");
    if (!tbody) {
      return;
    }

    tbody.innerHTML = "";

    keys.forEach((k) => {
      const tr = document.createElement("tr");

      // Determine if key is active to style the badge
      let statusBadge = '<span class="badge bg-success">Active</span>';
      if (k.status === "INACTIVE" || k.active === false) {
        statusBadge = '<span class="badge bg-secondary">Inactive</span>';
      }

      tr.innerHTML = `
        <td class="font-monospace text-primary fw-bold">${k.id || "N/A"}</td>
        <td>${k.teamName}</td>
        <td>${k.projectName}</td>
        <td>${k.semester}</td>
        <td>${statusBadge}</td>
        <td class="text-end">
            <button class="btn btn-sm btn-outline-secondary me-1" onclick="window.toggleApiKeyStatus('${k.id}', ${k.active !== false && k.status !== "INACTIVE"})">Toggle</button>
            <button class="btn btn-sm btn-outline-warning me-1" onclick="window.openExtendModal('${k.id}')">Extend</button>
            <button class="btn btn-sm btn-outline-danger" onclick="window.deleteSystemApiKey('${k.id}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- ADMIN TEAM & USER MANAGEMENT LOGIC ---

  async function loadAdminData() {
    await loadUnassignedStudents();
    await loadTeams();
  }

  async function loadUnassignedStudents() {
    const unassigned = await ButterflyAPI.getUnassignedStudents();
    const tbody = document.getElementById("unassignedUsersTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    unassigned.forEach((u) => {
      const tr = document.createElement("tr");
      // Use u.userId
      tr.innerHTML = `
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="window.deleteSystemUser('${u.userId}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
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
      // Use u.userId for the dropdown value
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
            <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="window.deleteTeam('${team.id}')"><i class="fas fa-trash"></i></button>
          </div>
          <p class="small text-muted mb-2">${team.projectName} | ${team.semester}</p>
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

  // --- WINDOW ATTACHED FUNCTIONS FOR INLINE HTML CALLS ---

  window.deleteSystemUser = async (userId) => {
    if (confirm("Delete this user permanently?")) {
      await ButterflyAPI.deleteUser(userId);
      await loadAdminData();
    }
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
      await loadAdminData(); // Refresh UI
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

  // --- FORM EVENT LISTENERS ---

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
      // Using the exact structure from your API endpoints
      const newUserData = {
        username: document.getElementById("adminNewUsername").value,
        email: document.getElementById("adminNewEmail").value,
        password: document.getElementById("adminNewPassword").value,
        utype: document.getElementById("adminNewRole").value,
      };

      // Since the new API allows creating a user from admin without assigning a team immediately
      await ButterflyAPI.adminCreateAccount(newUserData);
      await loadAdminData(); // Refresh the unassigned table

      e.target.reset();
      bootstrap.Modal.getInstance(
        document.getElementById("adminAddUserModal"),
      ).hide();
    });
  }

  // Global functions for inline buttons in API Key Table
  window.deleteSystemApiKey = async (keyId) => {
    if (confirm("Are you sure you want to delete this API key?")) {
      await ButterflyAPI.deleteApiKey(keyId);
      await loadApiKeysTable();
    }
  };

  window.toggleApiKeyStatus = async (keyId, currentlyActive) => {
    if (currentlyActive) {
      await ButterflyAPI.deactivateApiKey(keyId);
    } else {
      await ButterflyAPI.activateApiKey(keyId);
    }
    await loadApiKeysTable();
  };

  window.openExtendModal = (keyId) => {
    const extendInput = document.getElementById("extendKeyId");
    if (extendInput) {
      extendInput.value = keyId;
    }
    const modalElem = document.getElementById("adminExtendKeyModal");
    if (modalElem) {
      const modal = new bootstrap.Modal(modalElem);
      modal.show();
    }
  };

  // ==========================
  // 7. EVENT LISTENERS
  // ==========================

  // Clear Tags Button
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      activeTagFilters.clear();
      const currentSpecies = butterflies.find(
        (b) => b.name === document.getElementById("speciesName").innerText,
      );
      if (currentSpecies) {
        showSpeciesView(currentSpecies);
      }
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      showView(portfolio);
      if (searchNavBar) {
        searchNavBar.style.display = "flex";
      }
    });
  }

  if (viewGalleryBtn) {
    viewGalleryBtn.addEventListener("click", () => {
      showView(portfolio);
      if (searchNavBar) {
        searchNavBar.style.display = "flex";
      }
      viewGalleryBtn.classList.add("active");
      if (viewTeamBtn) {
        viewTeamBtn.classList.remove("active");
      }
    });
  }

  if (viewTeamBtn) {
    viewTeamBtn.addEventListener("click", async () => {
      showView(teamView);
      if (searchNavBar) {
        searchNavBar.style.display = "none";
      }
      viewTeamBtn.classList.add("active");
      if (viewGalleryBtn) {
        viewGalleryBtn.classList.remove("active");
      }

      // Role-based logic for Teams View
      if (userRole === "ADMIN") {
        if (adminTeamContent) {
          adminTeamContent.style.display = "block";
        }
        if (studentTeamContent) {
          studentTeamContent.style.display = "none";
        }

        await loadAdminData();
        await loadApiKeysTable();
      } else {
        if (adminTeamContent) {
          adminTeamContent.style.display = "none";
        }
        if (studentTeamContent) {
          studentTeamContent.style.display = "block";
        }
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
      if (modalElem) {
        bootstrap.Modal.getInstance(modalElem).hide();
      }
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
      await loadApiKeysTable();

      e.target.reset();
      const modalElem = document.getElementById("adminGenerateKeyModal");
      if (modalElem) {
        bootstrap.Modal.getInstance(modalElem).hide();
      }
    });
  }

  // Handle Extend Key Form
  if (adminExtendKeyForm) {
    adminExtendKeyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const keyId = document.getElementById("extendKeyId").value;
      const months = document.getElementById("extendMonths").value;

      await ButterflyAPI.extendApiKey(keyId, months);
      await loadApiKeysTable();

      e.target.reset();
      const modalElem = document.getElementById("adminExtendKeyModal");
      if (modalElem) {
        bootstrap.Modal.getInstance(modalElem).hide();
      }
    });
  }

  // Theme Toggle (Light/Dark Mode)
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
      if (apiContainer) {
        apiContainer.classList.toggle("bg-secondary");
      }
      const imgContainer = document.getElementById("imgContainer");
      if (imgContainer) {
        imgContainer.classList.toggle("bg-secondary");
      }
    });
  }

  // 8. INITIAL RENDER
  showView(portfolio);
  refreshGallery();
}
