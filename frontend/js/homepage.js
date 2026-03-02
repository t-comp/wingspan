import { ButterflyAPI } from "./api.js";
import { UI } from "./ui.js";

export async function initHome(userRole) {
  console.log("Home Initializing with role:", userRole);

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

  const showSpeciesView = (b) => {
    showView(speciesView);
    if (searchNavBar) {
      searchNavBar.style.display = "none";
    }

    document.getElementById("speciesName").innerText = b.name;
    document.getElementById("speciesScientific").innerText = b.scientific;
    document.getElementById("speciesSex").innerText = b.sex;
    document.getElementById("speciesLifecycle").innerText =
      b.lifecycle || "N/A";
    document.getElementById("speciesDescription").innerText = b.description;
    document.getElementById("speciesImage").src = b.image;

    const speciesImagesContainer = document.getElementById("speciesImages");
    if (speciesImagesContainer) {
      speciesImagesContainer.innerHTML = "";

      (b.additionalImages || []).forEach((imgUrl) => {
        const img = document.createElement("img");
        img.src = imgUrl;
        img.className = "img-fluid rounded shadow-sm";
        img.style.width = "30%";
        img.style.maxHeight = "150px";
        img.style.objectFit = "cover";
        img.style.cursor = "pointer";

        img.addEventListener("click", () => {
          const modalElem = document.getElementById("additionalImageModal");
          if (modalElem) {
            const modal = new bootstrap.Modal(modalElem);
            document.getElementById("modalImage").src = imgUrl;
            document.getElementById("modalName").innerText = b.name;
            document.getElementById("modalScientific").innerText = b.scientific;
            document.getElementById("modalDescription").innerText =
              b.description;
            document.getElementById("modalImgSize").innerText =
              b.imgSize || "Unknown";
            document.getElementById("modalDownloadLink").href = imgUrl;
            modal.show();
          }
        });

        speciesImagesContainer.appendChild(img);
      });
    }
  };

  const refreshGallery = (data = butterflies) => {
    UI.renderGrid(data, (b) => {
      showSpeciesView(b);
    });
  };

  // 4. ADMIN TABLE LOGIC (Users)
  async function loadAdminTable() {
    const users = await ButterflyAPI.getAllUsers();
    const tbody = document.getElementById("adminUsersTableBody");
    if (!tbody) {
      return;
    }

    tbody.innerHTML = "";

    users.forEach((u) => {
      const tr = document.createElement("tr");
      let badgeClass = "bg-primary";
      if (u.uType === "ADMIN") {
        badgeClass = "bg-danger";
      }

      tr.innerHTML = `
        <td>${u.id || "N/A"}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td><span class="badge ${badgeClass}">${u.uType}</span></td>
        <td class="text-end">
            <button class="btn btn-sm btn-outline-secondary me-1" onclick="window.toggleUserRole('${u.id}', '${u.uType}')">Toggle Role</button>
            <button class="btn btn-sm btn-outline-danger" onclick="window.deleteSystemUser('${u.id}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
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

  // 5. ADMIN TABLE LOGIC (API Keys)
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
  // 6. EVENT LISTENERS
  // ==========================

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
        await loadAdminTable();
        await loadApiKeysTable(); // Load keys too!
      } else {
        if (adminTeamContent) {
          adminTeamContent.style.display = "none";
        }
        if (studentTeamContent) {
          studentTeamContent.style.display = "block";
        }
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

  // 7. INITIAL RENDER
  showView(portfolio);
  refreshGallery();
}

// import { ButterflyAPI } from "./api.js";
// import { UI } from "./ui.js";

// export async function initHome(userRole) {
//   console.log("Home Initializing with role:", userRole);

//   // 1. DATA INITIALIZATION
//   let butterflies = await ButterflyAPI.getAll();

//   // 2. ELEMENT SELECTORS
//   const portfolio = document.getElementById("portfolio");
//   const teamView = document.getElementById("teamView"); // Replaced checkoutView
//   const speciesView = document.getElementById("speciesView");
//   const searchNavBar = document.getElementById("searchNavBar");

//   const viewGalleryBtn = document.getElementById("viewGalleryBtn");
//   const viewTeamBtn = document.getElementById("viewTeamBtn"); // Replaced viewCheckoutBtn
//   const backBtn = document.getElementById("backToGalleryBtn");

//   const searchInput = document.getElementById("searchInput");
//   const themeToggle = document.getElementById("toggleTheme");

//   const deleteBtn = document.getElementById("deleteButterflyBtn");
//   const addForm = document.getElementById("addButterflyForm");

//   const adminTeamContent = document.getElementById("adminTeamContent");
//   const studentTeamContent = document.getElementById("studentTeamContent");

//   // 3. VIEW MANAGEMENT HELPERS
//   const showView = (view) => {
//     // Hide all main views
//     [portfolio, speciesView, teamView].forEach((v) => {
//       if (v) {
//         v.style.display = "none";
//       }
//     });
//     if (view) {
//       view.style.display = "block";
//     }
//     window.scrollTo(0, 0);
//   };

//   const showSpeciesView = (b) => {
//     showView(speciesView);
//     if (searchNavBar) {
//       searchNavBar.style.display = "none";
//     }

//     document.getElementById("speciesName").innerText = b.name;
//     document.getElementById("speciesScientific").innerText = b.scientific;
//     document.getElementById("speciesSex").innerText = b.sex;
//     document.getElementById("speciesLifecycle").innerText =
//       b.lifecycle || "N/A";
//     document.getElementById("speciesDescription").innerText = b.description;
//     document.getElementById("speciesImage").src = b.image;

//     const speciesImagesContainer = document.getElementById("speciesImages");
//     if (speciesImagesContainer) {
//       speciesImagesContainer.innerHTML = "";

//       (b.additionalImages || []).forEach((imgUrl) => {
//         const img = document.createElement("img");
//         img.src = imgUrl;
//         img.className = "img-fluid rounded shadow-sm";
//         img.style.width = "30%";
//         img.style.maxHeight = "150px";
//         img.style.objectFit = "cover";
//         img.style.cursor = "pointer";

//         img.addEventListener("click", () => {
//           const modalElem = document.getElementById("additionalImageModal");
//           if (modalElem) {
//             const modal = new bootstrap.Modal(modalElem);
//             document.getElementById("modalImage").src = imgUrl;
//             document.getElementById("modalName").innerText = b.name;
//             document.getElementById("modalScientific").innerText = b.scientific;
//             document.getElementById("modalDescription").innerText =
//               b.description;
//             document.getElementById("modalImgSize").innerText =
//               b.imgSize || "Unknown";
//             document.getElementById("modalDownloadLink").href = imgUrl;
//             modal.show();
//           }
//         });

//         speciesImagesContainer.appendChild(img);
//       });
//     }
//   };

//   const refreshGallery = (data = butterflies) => {
//     UI.renderGrid(data, (b) => {
//       showSpeciesView(b);
//     });
//   };

//   // 4. ADMIN TABLE LOGIC (For Teams Tab)
//   async function loadAdminTable() {
//     const users = await ButterflyAPI.getAllUsers();
//     const tbody = document.getElementById("adminUsersTableBody");
//     if (!tbody) {
//       return;
//     }

//     tbody.innerHTML = "";

//     users.forEach((u) => {
//       const tr = document.createElement("tr");
//       let badgeClass = "bg-primary";
//       if (u.uType === "ADMIN") {
//         badgeClass = "bg-danger";
//       }

//       tr.innerHTML = `
//         <td>${u.id || "N/A"}</td>
//         <td>${u.username}</td>
//         <td>${u.email}</td>
//         <td><span class="badge ${badgeClass}">${u.uType}</span></td>
//         <td class="text-end">
//             <button class="btn btn-sm btn-outline-secondary me-1" onclick="window.toggleUserRole('${u.id}', '${u.uType}')">Toggle Role</button>
//             <button class="btn btn-sm btn-outline-danger" onclick="window.deleteSystemUser('${u.id}')"><i class="fas fa-trash"></i></button>
//         </td>
//       `;
//       tbody.appendChild(tr);
//     });
//   }

//   // Attach global functions for the inline onclick handlers in the admin table
//   window.deleteSystemUser = async (userId) => {
//     if (confirm("Are you sure you want to delete this user?")) {
//       await ButterflyAPI.deleteUser(userId);
//       await loadAdminTable();
//     }
//   };

//   window.toggleUserRole = async (userId, currentRole) => {
//     if (currentRole === "ADMIN") {
//       await ButterflyAPI.makeStudent(userId);
//     } else {
//       await ButterflyAPI.makeAdmin(userId);
//     }
//     await loadAdminTable();
//   };

//   // ==========================
//   // 5. EVENT LISTENERS
//   // ==========================

//   if (backBtn) {
//     backBtn.addEventListener("click", () => {
//       showView(portfolio);
//       if (searchNavBar) {
//         searchNavBar.style.display = "flex";
//       }
//     });
//   }

//   if (viewGalleryBtn) {
//     viewGalleryBtn.addEventListener("click", () => {
//       showView(portfolio);
//       if (searchNavBar) {
//         searchNavBar.style.display = "flex";
//       }
//       viewGalleryBtn.classList.add("active");
//       if (viewTeamBtn) {
//         viewTeamBtn.classList.remove("active");
//       }
//     });
//   }

//   if (viewTeamBtn) {
//     viewTeamBtn.addEventListener("click", async () => {
//       showView(teamView);
//       if (searchNavBar) {
//         searchNavBar.style.display = "none";
//       }
//       viewTeamBtn.classList.add("active");
//       if (viewGalleryBtn) {
//         viewGalleryBtn.classList.remove("active");
//       }

//       // Role-based logic for Teams View
//       if (userRole === "ADMIN") {
//         if (adminTeamContent) {
//           adminTeamContent.style.display = "block";
//         }
//         if (studentTeamContent) {
//           studentTeamContent.style.display = "none";
//         }
//         await loadAdminTable();
//       } else {
//         if (adminTeamContent) {
//           adminTeamContent.style.display = "none";
//         }
//         if (studentTeamContent) {
//           studentTeamContent.style.display = "block";
//         }
//       }
//     });
//   }

//   // Search logic
//   if (searchInput) {
//     searchInput.addEventListener("input", () => {
//       const query = searchInput.value.toLowerCase();
//       const filtered = butterflies.filter((b) =>
//         b.name.toLowerCase().includes(query),
//       );
//       refreshGallery(filtered);
//     });
//   }

//   // Add new butterfly
//   if (addForm) {
//     addForm.addEventListener("submit", async (e) => {
//       e.preventDefault();
//       const newB = {
//         name: document.getElementById("newName").value,
//         scientific: document.getElementById("newScientific").value,
//         sex: document.getElementById("newSex").value,
//         description: document.getElementById("newDescription").value,
//         tags: document.getElementById("newTags").value,
//         image:
//           document.getElementById("newImage").value || "assets/img/noimage.jpg",
//       };

//       const savedSpecies = await ButterflyAPI.create(newB);
//       butterflies.push(savedSpecies);
//       refreshGallery();
//       e.target.reset();
//       const modalElem = document.getElementById("addButterflyModal");
//       if (modalElem) {
//         bootstrap.Modal.getInstance(modalElem).hide();
//       }
//     });
//   }

//   // Delete butterfly
//   if (deleteBtn) {
//     deleteBtn.addEventListener("click", async () => {
//       const idx = parseInt(deleteBtn.dataset.index);
//       if (isNaN(idx)) return;
//       if (confirm(`Delete "${butterflies[idx].name}"?`)) {
//         butterflies.splice(idx, 1);
//         await ButterflyAPI.delete(butterflies[idx].id); // Updated to use the new API method
//         refreshGallery();
//       }
//     });
//   }

//   // Theme Toggle (Light/Dark Mode)
//   if (themeToggle) {
//     themeToggle.addEventListener("click", () => {
//       const body = document.body;
//       const isDark = body.getAttribute("data-bs-theme") === "dark";
//       body.setAttribute("data-bs-theme", isDark ? "light" : "dark");
//       body.classList.toggle("bg-dark");
//       body.classList.toggle("text-white");

//       document
//         .querySelectorAll(".modal-content")
//         .forEach((m) => m.classList.toggle("bg-dark"));
//       const apiContainer = document.getElementById("apiContainer");
//       if (apiContainer) {
//         apiContainer.classList.toggle("bg-secondary");
//       }
//       const imgContainer = document.getElementById("imgContainer");
//       if (imgContainer) {
//         imgContainer.classList.toggle("bg-secondary");
//       }
//     });
//   }

//   // 6. INITIAL RENDER
//   showView(portfolio);
//   refreshGallery();
// }
