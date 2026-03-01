import { ButterflyAPI } from "./api.js";
import { UI } from "./ui.js";

export async function initHome(userRole) {
  console.log("Home Initializing with role:", userRole);

  // 1. DATA INITIALIZATION
  let butterflies = await ButterflyAPI.getAll();

  // 2. ELEMENT SELECTORS
  const portfolio = document.getElementById("portfolio");
  const teamView = document.getElementById("teamView"); // Replaced checkoutView
  const speciesView = document.getElementById("speciesView");
  const searchNavBar = document.getElementById("searchNavBar");

  const viewGalleryBtn = document.getElementById("viewGalleryBtn");
  const viewTeamBtn = document.getElementById("viewTeamBtn"); // Replaced viewCheckoutBtn
  const backBtn = document.getElementById("backToGalleryBtn");

  const searchInput = document.getElementById("searchInput");
  const themeToggle = document.getElementById("toggleTheme");

  const deleteBtn = document.getElementById("deleteButterflyBtn");
  const addForm = document.getElementById("addButterflyForm");

  const adminTeamContent = document.getElementById("adminTeamContent");
  const studentTeamContent = document.getElementById("studentTeamContent");

  // 3. VIEW MANAGEMENT HELPERS
  const showView = (view) => {
    // Hide all main views
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

  // 4. ADMIN TABLE LOGIC (For Teams Tab)
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

  // Attach global functions for the inline onclick handlers in the admin table
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

  // ==========================
  // 5. EVENT LISTENERS
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
        await ButterflyAPI.delete(butterflies[idx].id); // Updated to use the new API method
        refreshGallery();
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

  // 6. INITIAL RENDER
  showView(portfolio);
  refreshGallery();
}

// import { ButterflyAPI } from "./api.js";
// import { UI } from "./ui.js";

// export async function initHome() {
//   console.log("Home Gallery Initializing...");

//   // 1. DATA INITIALIZATION
//   let butterflies = await ButterflyAPI.getAll();

//   // 2. ELEMENT SELECTORS
//   const portfolio = document.getElementById("portfolio");
//   const checkoutView = document.getElementById("checkoutView");
//   const speciesView = document.getElementById("speciesView");
//   const searchNavBar = document.getElementById("searchNavBar");

//   const viewGalleryBtn = document.getElementById("viewGalleryBtn");
//   const viewCheckoutBtn = document.getElementById("viewCheckoutBtn");
//   const backBtn = document.getElementById("backToGalleryBtn");

//   const searchInput = document.getElementById("searchInput");
//   const themeToggle = document.getElementById("toggleTheme");

//   const deleteBtn = document.getElementById("deleteButterflyBtn");
//   const addForm = document.getElementById("addButterflyForm");

//   // 3. VIEW MANAGEMENT HELPERS
//   const showView = (view) => {
//     // so we can hide all main views
//     [portfolio, speciesView, checkoutView].forEach((v) => {
//       if (v) v.style.display = "none";
//     });
//     if (view) view.style.display = "block";
//     window.scrollTo(0, 0);
//   };

//   const showSpeciesView = (b) => {
//     showView(speciesView);
//     searchNavBar.style.display = "none";

//     document.getElementById("speciesName").innerText = b.name;
//     document.getElementById("speciesScientific").innerText = b.scientific;
//     document.getElementById("speciesSex").innerText = b.sex;
//     document.getElementById("speciesLifecycle").innerText = b.lifecycle || "N/A";
//     document.getElementById("speciesDescription").innerText = b.description;
//     document.getElementById("speciesImage").src = b.image;

//     const speciesImagesContainer = document.getElementById("speciesImages");
//     speciesImagesContainer.innerHTML = "";

//     (b.additionalImages || []).forEach((imgUrl) => {
//       const img = document.createElement("img");
//       img.src = imgUrl;
//       img.className = "img-fluid rounded shadow-sm";
//       img.style.width = "30%";
//       img.style.maxHeight = "150px";
//       img.style.objectFit = "cover";
//       img.style.cursor = "pointer";

//       img.addEventListener("click", () => {
//         const modal = new bootstrap.Modal(
//           document.getElementById("additionalImageModal")
//         );
//         document.getElementById("modalImage").src = imgUrl;
//         document.getElementById("modalName").innerText = b.name;
//         document.getElementById("modalScientific").innerText = b.scientific;
//         document.getElementById("modalDescription").innerText = b.description;
//         document.getElementById("modalImgSize").innerText = b.imgSize || "Unknown";
//         document.getElementById("modalDownloadLink").href = imgUrl;
//         modal.show();
//       });

//        // this is an idea i had, so if u click the additional image
//       // itll replace the main image on the left and maybe the info could change
//       // img.addEventListener("click", () => {
//       //   document.getElementById("speciesImage").src = imgUrl;
//       // });

//       speciesImagesContainer.appendChild(img);
//     });
//   };

//   const refreshGallery = (data = butterflies) => {
//     UI.renderGrid(data, (b) => {
//       showSpeciesView(b);
//     });
//   };

//   // ==========================
//   // 4. EVENT LISTENERS
//   // ==========================
//   //changed the logic here a little bit

//   backBtn?.addEventListener("click", () => {
//     showView(portfolio);
//     searchNavBar.style.display = "block";
//   });

//   viewGalleryBtn?.addEventListener("click", () => {
//     showView(portfolio);
//     searchNavBar.style.display = "block";
//     viewGalleryBtn.classList.add("active");
//     viewCheckoutBtn.classList.remove("active");
//   });

//   viewCheckoutBtn?.addEventListener("click", () => {
//     showView(checkoutView);
//     searchNavBar.style.display = "none";
//     viewCheckoutBtn.classList.add("active");
//     viewGalleryBtn.classList.remove("active");
//   });

//   // Search logic
//   searchInput?.addEventListener("input", () => {
//     const query = searchInput.value.toLowerCase();
//     const filtered = butterflies.filter((b) => b.name.toLowerCase().includes(query));
//     refreshGallery(filtered);
//   });

//   // Add new butterfly
//   addForm?.addEventListener("submit", async (e) => {
//     e.preventDefault();
//     const newB = {
//       id: Math.floor(Math.random() * 1000).toString(),
//       name: document.getElementById("newName").value,
//       scientific: document.getElementById("newScientific").value,
//       sex: document.getElementById("newSex").value,
//       lifecycle: "Unknown",
//       description: document.getElementById("newDescription").value,
//       tags: document.getElementById("newTags").value,
//       image: document.getElementById("newImage").value || "assets/img/noimage.jpg",
//       imgSize: "Unknown",
//     };
//     butterflies.push(newB);
//     await ButterflyAPI.saveAll(butterflies);
//     refreshGallery();
//     e.target.reset();
//     bootstrap.Modal.getInstance(document.getElementById("addButterflyModal"))?.hide();
//   });

//   // Delete butterfly
//   deleteBtn?.addEventListener("click", async () => {
//     const idx = parseInt(deleteBtn.dataset.index);
//     if (isNaN(idx)) return;
//     if (confirm(`Delete "${butterflies[idx].name}"?`)) {
//       butterflies.splice(idx, 1);
//       await ButterflyAPI.saveAll(butterflies);
//       refreshGallery();
//       bootstrap.Modal.getInstance(document.getElementById("butterflyModal"))?.hide();
//     }
//   });

//   // Theme Toggle (Light/Dark Mode)
//   themeToggle?.addEventListener("click", () => {
//     const body = document.body;
//     const isDark = body.getAttribute("data-bs-theme") === "dark";
//     body.setAttribute("data-bs-theme", isDark ? "light" : "dark");
//     body.classList.toggle("bg-dark");
//     body.classList.toggle("text-white");

//     document.querySelectorAll(".modal-content").forEach((m) => m.classList.toggle("bg-dark"));
//     document.getElementById("apiContainer")?.classList.toggle("bg-secondary");
//     document.getElementById("imgContainer")?.classList.toggle("bg-secondary");
//   });

//   // 5. INITIAL RENDER
//   showView(portfolio);
//   refreshGallery();
// }
