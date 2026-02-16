window.addEventListener("DOMContentLoaded", (event) => {
  // 1. DATA INITIALIZATION
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

  // 2. ELEMENT SELECTORS
  const deleteBtn = document.getElementById("deleteButterflyBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const loginForm = document.getElementById("loginForm");
  const themeToggle = document.getElementById("toggleTheme");
  const searchInput = document.getElementById("searchInput");
  const addForm = document.getElementById("addButterflyForm");

  // 3. CORE FUNCTIONS
  function saveButterflies() {
    localStorage.setItem("butterflies", JSON.stringify(butterflies));
  }

  function renderButterflies(list) {
    const grid = document.getElementById("butterflyGrid");
    grid.innerHTML = "";

    list.forEach((b, idx) => {
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4 mb-5";
      col.innerHTML = `
      <div class="card h-100 butterfly-card" 
           data-bs-toggle="modal" data-bs-target="#butterflyModal">
        <img src="${b.image}" class="card-img-top" alt="${b.name}">
        <div class="card-body">
          <h5 class="card-title">${b.name}</h5>
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

  // 4. EVENT LISTENERS

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

  // Add Butterfly Logic
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
  themeToggle.addEventListener("click", () => {
    const body = document.body;
    if (body.getAttribute("data-bs-theme") === "dark") {
      body.setAttribute("data-bs-theme", "light");
      body.classList.remove("bg-dark", "text-white");
    } else {
      body.setAttribute("data-bs-theme", "dark");
      body.classList.add("bg-dark", "text-white");
    }
  });

  // INITIAL RENDER
  renderButterflies(butterflies);
});
