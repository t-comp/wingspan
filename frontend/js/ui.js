// js/ui.js
export const UI = {
  renderGrid(list, onCardClick) {
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
        <div class="card h-100 butterfly-card border-0 shadow-sm">
          <div class="butterfly-img-wrapper"><img src="${b.image}" alt="${b.name}"></div>
          <div class="card-body">
            <h5 class="card-title fw-bold mb-2">${b.name}</h5>
            <div class="mb-2">${tagsHtml}</div>
          </div>
        </div>`;

      col
        .querySelector(".butterfly-card")
        .addEventListener("click", () => onCardClick(b, idx, tagsHtml));
      grid.appendChild(col);
    });
  },

  populateModal(b, idx, tagsHtml) {
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
    document.getElementById("butterflyModalAPI").value =
      b.apiEndpoint || `GET /api/species/${b.id}`;

    const deleteBtn = document.getElementById("deleteButterflyBtn");
    deleteBtn.dataset.index = idx;
  },
};
