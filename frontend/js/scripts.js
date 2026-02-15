window.addEventListener("DOMContentLoaded", (event) => {
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

  function saveButterflies() {
    localStorage.setItem("butterflies", JSON.stringify(butterflies));
  }

  const deleteBtn = document.getElementById("deleteButterflyBtn");

  function renderButterflies(list) {
    const grid = document.getElementById("butterflyGrid");
    grid.innerHTML = "";

    list.forEach((b, idx) => {
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4 mb-5";
      col.innerHTML = `
      <div class="card h-100 butterfly-card" 
           data-name="${b.name}" 
           data-scientific="${b.scientific}" 
           data-sex="${b.sex}" 
           data-description="${b.description}" 
           data-tags="${b.tags}" 
           data-image="${b.image}"
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

        deleteBtn.dataset.index = idx;
      });
    });
  }

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
        document.getElementById("butterflyModal")
      ).hide();
    }
  });

  renderButterflies(butterflies);

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = butterflies.filter((b) =>
      b.name.toLowerCase().includes(query)
    );
    renderButterflies(filtered);
  });

  document
    .getElementById("addButterflyForm")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      const newB = {
        name: document.getElementById("newName").value,
        scientific: document.getElementById("newScientific").value,
        sex: document.getElementById("newSex").value,
        description: document.getElementById("newDescription").value,
        tags: document.getElementById("newTags").value,
        image:
          document.getElementById("newImage").value ||
          "assets/img/noimage.jpg",
      };
      butterflies.push(newB);

      saveButterflies();

      renderButterflies(butterflies);

      e.target.reset();
      const modalEl = document.getElementById("addButterflyModal");
      bootstrap.Modal.getInstance(modalEl).hide();
    });
});
