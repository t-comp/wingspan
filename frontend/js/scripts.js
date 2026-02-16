window.addEventListener("DOMContentLoaded", (event) => {
  //---------------- DATA INITIALIZATION  ----------------//
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

  //---------------- ELEMENT SELECTORS ----------------//
  const deleteBtn = document.getElementById("deleteButterflyBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const loginForm = document.getElementById("loginForm");
  const themeToggle = document.getElementById("toggleTheme");
  const searchInput = document.getElementById("searchInput");
  const addForm = document.getElementById("addButterflyForm");

  //---------------- CORE FUNCTIONS ----------------//

  function saveButterflies() {
    localStorage.setItem("butterflies", JSON.stringify(butterflies));
  }

  // UPDATED RENDER FUNCTION
  function renderButterflies(list) {
    const grid = document.getElementById("butterflyGrid");
    grid.innerHTML = "";

    list.forEach((b, idx) => {
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4 mb-5";

      // We removed <div class="card-body"> and added <div class="butterfly-overlay">
      col.innerHTML = `
      <div class="card h-100 butterfly-card" 
           data-bs-toggle="modal" data-bs-target="#butterflyModal">
        <img src="${b.image}" alt="${b.name}">
        <div class="butterfly-overlay">
            <div class="butterfly-name-hover">${b.name}</div>
        </div>
      </div>`;
      grid.appendChild(col);

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

        // Attach index to the delete button
        deleteBtn.dataset.index = idx;
      });
    });
  }

  //---------------- EVENT LISTENERS ----------------//

  // Admin Login Logic
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("adminUser").value;
    const pass = document.getElementById("adminPass").value;

    if (user === "admin" && pass === "123") {
      alert("Welcome, Admin! Edit mode enabled.");
      uploadBtn.classList.remove("d-none"); // Reveal Upload
      deleteBtn.classList.remove("d-none"); // Reveal Delete
      bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
    } else {
      alert("Invalid credentials!");
    }
  });

  // Delete Butterfly Logic
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

  // Search Logic
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = butterflies.filter((b) =>
      b.name.toLowerCase().includes(query),
    );
    renderButterflies(filtered);
  });

  // Butterfly Logic
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

  // Dark Mode Logic
  // --- UPDATED DARK MODE LOGIC ---
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

  // INITIAL RENDER
  renderButterflies(butterflies);
});
