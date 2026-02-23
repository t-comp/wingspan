// js/homepage.js
function initHome() {
  console.log("Home Gallery Initializing...");

  /* =========================================
     DATA INITIALIZATION 
     ========================================= */
  let butterflies = JSON.parse(localStorage.getItem("butterflies")) || [
    {
      id: "101",
      name: "Monarch",
      scientific: "Danaus plexippus",
      sex: "Male",
      lifecycle: "Adult",
      description:
        "Bright orange butterfly found in North America. Known for their long migration.",
      tags: "migratory, orange",
      image: "assets/img/placeholder1.jpg",
      imgSize: "1920x1080",
      largeSize: "1024x768",
      mediumSize: "640x480",
      smallSize: "320x240",
      apiEndpoint: "https://wingspan.api/species/101",
    },
    {
      id: "102",
      name: "Swallowtail",
      scientific: "Papilio machaon",
      sex: "Female",
      lifecycle: "Adult",
      description: "Yellow butterfly with black stripes. Common in gardens.",
      tags: "yellow, striped",
      image: "assets/img/placeholder2.jpg",
      imgSize: "2000x1500",
      largeSize: "1024x768",
      mediumSize: "640x480",
      smallSize: "320x240",
      apiEndpoint: "https://wingspan.api/species/102",
    },
    {
      id: "103",
      name: "Blue Morpho",
      scientific: "Morpho peleides",
      sex: "Unknown",
      lifecycle: "Pupa / Chrysalis",
      description: "Large iridescent blue butterfly. Native to rainforests.",
      tags: "blue, tropical",
      image: "assets/img/placeholder3.jpg",
      imgSize: "4000x3000",
      largeSize: "1920x1440",
      mediumSize: "800x600",
      smallSize: "400x300",
      apiEndpoint: "https://wingspan.api/species/103",
    },
  ];

  /* =========================================
     ELEMENT SELECTORS
     ========================================= */
  const deleteBtn = document.getElementById("deleteButterflyBtn");
  const addForm = document.getElementById("addButterflyForm");
  const searchInput = document.getElementById("searchInput");
  const themeToggle = document.getElementById("toggleTheme");

  /* =========================================
     CORE FUNCTIONS
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

      const tagsHtml = (b.tags || "")
        .split(",")
        .map(
          (tag) =>
            `<span class="badge rounded-pill bg-light text-dark border me-1">${tag.trim()}</span>`,
        )
        .join("");

      col.innerHTML = `
      <div class="card h-100 butterfly-card border-0 shadow-sm" data-bs-toggle="modal" data-bs-target="#butterflyModal">
        <div class="butterfly-img-wrapper">
            <img src="${b.image}" alt="${b.name}">
        </div>
        <div class="card-body">
            <h5 class="card-title fw-bold mb-2">${b.name}</h5>
            <div class="mb-2">${tagsHtml}</div>
        </div>
      </div>`;
      grid.appendChild(col);

      const card = col.querySelector(".butterfly-card");
      card.addEventListener("click", () => {
        document.getElementById("butterflyModalLabel").innerText = b.name;
        document.getElementById("butterflyModalScientific").innerText =
          b.scientific;
        document.getElementById("butterflyModalSex").innerText = b.sex;
        document.getElementById("butterflyModalLifecycle").innerText =
          b.lifecycle || "N/A";
        document.getElementById("butterflyModalDescription").innerText =
          b.description;
        document.getElementById("butterflyModalImage").src = b.image;
        document.getElementById("butterflyModalTags").innerHTML = tagsHtml;
        document.getElementById("butterflyModalId").innerText = b.id || "N/A";
        document.getElementById("butterflyModalImgSize").innerText =
          b.imgSize || "Unknown";
        document.getElementById("butterflyModalLargeSize").innerText =
          b.largeSize || "1024x768";
        document.getElementById("butterflyModalMediumSize").innerText =
          b.mediumSize || "640x480";
        document.getElementById("butterflyModalSmallSize").innerText =
          b.smallSize || "320x240";
        document.getElementById("butterflyModalAPI").value =
          b.apiEndpoint || `GET /api/species/${b.id}`;
        deleteBtn.dataset.index = idx;
      });
    });
  }

  /* =========================================
     EVENT LISTENERS 
     ========================================= */

  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newB = {
      id: Math.floor(Math.random() * 1000).toString(),
      name: document.getElementById("newName").value,
      scientific: document.getElementById("newScientific").value,
      sex: document.getElementById("newSex").value,
      lifecycle: "Unknown",
      description: document.getElementById("newDescription").value,
      tags: document.getElementById("newTags").value,
      image:
        document.getElementById("newImage").value || "assets/img/noimage.jpg",
      imgSize: "Unknown",
      largeSize: "Pending",
      mediumSize: "Pending",
      smallSize: "Pending",
      apiEndpoint: "Generated upon save",
    };
    butterflies.push(newB);
    saveButterflies();
    renderButterflies(butterflies);
    e.target.reset();
    bootstrap.Modal.getInstance(
      document.getElementById("addButterflyModal"),
    ).hide();
  });

  deleteBtn.addEventListener("click", () => {
    const idx = parseInt(deleteBtn.dataset.index);
    if (isNaN(idx)) return;
    if (confirm(`Delete "${butterflies[idx].name}"?`)) {
      butterflies.splice(idx, 1);
      saveButterflies();
      renderButterflies(butterflies);
      bootstrap.Modal.getInstance(
        document.getElementById("butterflyModal"),
      ).hide();
    }
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = butterflies.filter((b) =>
      b.name.toLowerCase().includes(query),
    );
    renderButterflies(filtered);
  });

  themeToggle.addEventListener("click", () => {
    const body = document.body;
    const isDark = body.getAttribute("data-bs-theme") === "dark";
    body.setAttribute("data-bs-theme", isDark ? "light" : "dark");
    body.classList.toggle("bg-dark");
    body.classList.toggle("text-white");

    // Toggle modal and container colors
    document
      .querySelectorAll(".modal-content")
      .forEach((m) => m.classList.toggle("bg-dark"));
    document.getElementById("apiContainer")?.classList.toggle("bg-secondary");
    document.getElementById("imgContainer")?.classList.toggle("bg-secondary");
  });

  renderButterflies(butterflies);
}

window.initHome = initHome;
