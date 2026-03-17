// js/ui.js
export const UI = {renderGrid(list, onCardClick) {
  const grid = document.getElementById("butterflyGrid");
    grid.innerHTML = "";

    list.forEach((b, idx) => {
      console.log(`Species: ${b.name} | URL: ${b.thumbnailUrl}`);
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4 mb-5";
      const imageUrl = b.thumbnailUrl 
        ? b.thumbnailUrl 
        : "assets/img/noimage.jpg"; 

      const tagsHtml = Array.isArray(b.tags) 
        ? b.tags.map(t => `<span class="badge rounded-pill bg-light text-dark border me-1">${t.name}</span>`).join("")
        : "";

      col.innerHTML = `
        <div class="card h-100 butterfly-card border-0 shadow-sm">
          <div class="butterfly-img-wrapper">
            <img src="${imageUrl}" alt="${b.name}" style="width:100%; height:200px; object-fit:cover;">
          </div>
          <div class="card-body">
            <h5 class="card-title fw-bold mb-2">${b.name}</h5>
            <div class="mb-2">${tagsHtml}</div>
          </div>
        </div>`;

      col.querySelector(".butterfly-card").addEventListener("click", () => onCardClick(b, idx, tagsHtml));
      grid.appendChild(col);
    });
  },

  populateSpeciesView(b, isAdmin) {
    console.log("Populating View. Is Admin?", isAdmin); // <--- ADD THIS
    document.getElementById("speciesName").innerText = b.name;
    document.getElementById("speciesScientific").innerText = b.scientificName || "N/A";
    document.getElementById("speciesDescription").innerText = b.description || "No description provided.";
    document.getElementById("speciesImage").src = b.thumbnailUrl || "assets/img/noimage.jpg";
    
    // Handle the Delete Species Button visibility
    const deleteSection = document.getElementById("adminDeleteSection");
    if (deleteSection) {
      isAdmin ? deleteSection.classList.remove("d-none") : deleteSection.classList.add("d-none");
      // Attach the ID to the button for the router to use
      document.getElementById("deleteSpeciesFullBtn").dataset.speciesId = b.id;
    }
    
    // Handle the Image Gallery on the right (placeholder for now)
    const galleryContainer = document.getElementById("speciesImages");
    galleryContainer.innerHTML = `<p class="text-muted">Loading images...</p>`;
  },

  populateModal(b, idx, tagsHtml) {
    document.getElementById("butterflyModalLabel").innerText = b.name;
    document.getElementById("butterflyModalScientific").innerText =
      b.scientificName;
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
