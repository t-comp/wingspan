window.addEventListener("DOMContentLoaded", (event) => {
  /* =========================================
     1. DATA INITIALIZATION
     ========================================= */
  let butterflies = JSON.parse(localStorage.getItem("butterflies")) || [
    {
      name: "Monarch",
      scientific: "Danaus plexippus",
      sex: "Male",
      description: "Bright orange butterfly found in North America.",
      tags: "migratory, orange",
      image: "assets/img/placeholder1.jpg",
    },
    {
      name: "Swallowtail",
      scientific: "Papilio machaon",
      sex: "Female",
      description: "Yellow butterfly with black stripes.",
      tags: "yellow, striped",
      image: "assets/img/placeholder2.jpg",
    },
    {
      name: "Blue Morpho",
      scientific: "Morpho peleides",
      sex: "Unknown",
      description: "Large iridescent blue butterfly.",
      tags: "blue, tropical",
      image: "assets/img/placeholder3.jpg",
    },
  ];

  /* =========================================
     2. ELEMENT SELECTORS
     ========================================= */
  // Buttons & Links
  const deleteBtn = document.getElementById("deleteButterflyBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  const adminLogoutLink = document.getElementById("adminLogoutLink");
  const themeToggle = document.getElementById("toggleTheme");

  // Forms & Inputs
  const loginForm = document.getElementById("loginForm");
  const addForm = document.getElementById("addButterflyForm");
  const searchInput = document.getElementById("searchInput");

  /* =========================================
     3. CORE FUNCTIONS
     ========================================= */

  function saveButterflies() {
    localStorage.setItem("butterflies", JSON.stringify(butterflies));
  }

  function renderButterflies(list) {
    const grid = document.getElementById("butterflyGrid");
    grid.innerHTML = "";

    list.forEach((b, idx) => {
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4 mb-5";

      // Create Tag Badges
      const tagsHtml = (b.tags || "")
        .split(",")
        .map(
          (tag) =>
            `<span class="badge rounded-pill bg-light text-dark border me-1">${tag.trim()}</span>`,
        )
        .join("");

      col.innerHTML = `
      <div class="card h-100 butterfly-card border-0 shadow-sm" 
           data-bs-toggle="modal" data-bs-target="#butterflyModal">
        
        <div class="butterfly-img-wrapper">
            <img src="${b.image}" alt="${b.name}">
        </div>

        <div class="card-body">
            <h5 class="card-title fw-bold mb-2">${b.name}</h5>
            <div class="mb-2">${tagsHtml}</div>
        </div>
      </div>`;
      grid.appendChild(col);

      // Event Listener for Modal
      const card = col.querySelector(".butterfly-card");
      card.addEventListener("click", () => {
        document.getElementById("butterflyModalLabel").innerText = b.name;
        document.getElementById("butterflyModalScientific").innerText =
          b.scientific;
        document.getElementById("butterflyModalSex").innerText = b.sex;
        document.getElementById("butterflyModalDescription").innerText =
          b.description;
        document.getElementById("butterflyModalTags").innerText = b.tags;
        document.getElementById("butterflyModalImage").src = b.image;
        deleteBtn.dataset.index = idx;
      });
    });
  }

  /* =========================================
     4. EVENT LISTENERS: AUTHENTICATION
     ========================================= */

  // Admin Login
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("adminUser").value;
    const pass = document.getElementById("adminPass").value;

    if (user === "admin" && pass === "123") {
      alert("Welcome, Admin! Edit mode enabled.");

      // Reveal Admin features
      uploadBtn.classList.remove("d-none");
      deleteBtn.classList.remove("d-none");

      // SWAP DROPDOWN ITEMS: Hide Login, Show Logout
      adminLoginBtn.classList.add("d-none");
      adminLogoutLink.classList.remove("d-none");

      bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
      e.target.reset();
    } else {
      alert("Invalid credentials!");
    }
  });

  // Admin Logout
  adminLogoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Logged out. Admin features disabled.");

    // Hide Admin features
    uploadBtn.classList.add("d-none");
    deleteBtn.classList.add("d-none");

    // SWAP DROPDOWN ITEMS BACK: Show Login, Hide Logout
    adminLoginBtn.classList.remove("d-none");
    adminLogoutLink.classList.add("d-none");
  });

  /* =========================================
     5. EVENT LISTENERS: DATA MANAGEMENT
     ========================================= */

  // Add New Butterfly
  addForm.addEventListener("submit", (e) => {
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
    butterflies.push(newB);
    saveButterflies();
    renderButterflies(butterflies);
    e.target.reset();
    bootstrap.Modal.getInstance(
      document.getElementById("addButterflyModal"),
    ).hide();
  });

  // Delete Butterfly
  deleteBtn.addEventListener("click", () => {
    const idx = parseInt(deleteBtn.dataset.index);
    if (isNaN(idx)) return;
    if (
      confirm(`Are you sure you want to delete "${butterflies[idx].name}"?`)
    ) {
      butterflies.splice(idx, 1);
      saveButterflies();
      renderButterflies(butterflies);
      bootstrap.Modal.getInstance(
        document.getElementById("butterflyModal"),
      ).hide();
    }
  });

  /* =========================================
     6. EVENT LISTENERS: UI & INTERACTION
     ========================================= */

  // Search Logic
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = butterflies.filter((b) =>
      b.name.toLowerCase().includes(query),
    );
    renderButterflies(filtered);
  });

  // Dark Mode Logic
  themeToggle.addEventListener("click", () => {
    const body = document.body;
    const modals = document.querySelectorAll(".modal-content"); // Select all pop-ups

    if (body.getAttribute("data-bs-theme") === "dark") {
      // Switch to LIGHT
      body.setAttribute("data-bs-theme", "light");
      body.classList.remove("bg-dark", "text-white");

      // Reset modals to light mode
      modals.forEach((modal) => {
        modal.classList.remove("bg-dark", "text-white", "border-secondary");
      });
    } else {
      // Switch to DARK
      body.setAttribute("data-bs-theme", "dark");
      body.classList.add("bg-dark", "text-white");

      // Make modals dark and add a subtle border so they pop
      modals.forEach((modal) => {
        modal.classList.add("bg-dark", "text-white", "border-secondary");
      });
    }
  });

  /* =========================================
     7. INITIAL RENDER
     ========================================= */
  renderButterflies(butterflies);
});
