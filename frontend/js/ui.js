// js/ui.js
export const UI = {
    renderGrid(list, onCardClick) {
        const grid = document.getElementById("butterflyGrid");
        grid.innerHTML = "";
        list.forEach((b, idx) => {
            console.log(`Species: ${b.name} | URL: ${b.thumbnailUrl}`);
            const col = document.createElement("div");
            col.className = "col-md-6 col-lg-4 mb-5";
            const imageUrl = b.thumbnailUrl ? b.thumbnailUrl : "assets/img/noimage.jpg";
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
        console.log("Populating View. Is Admin?", isAdmin);
        document.getElementById("speciesName").innerText = b.name;
        document.getElementById("speciesScientific").innerText = b.scientificName || "N/A";
        document.getElementById("speciesDescription").innerText = b.description || "No description provided.";
        document.getElementById("speciesImage").src = b.thumbnailUrl || "assets/img/noimage.jpg";

        const orderElem = document.getElementById("speciesOrder");
        if (orderElem) orderElem.innerText = b.orderName || "—";
        const familyElem = document.getElementById("speciesFamily");
        if (familyElem) familyElem.innerText = b.family || "—";
        const genusElem = document.getElementById("speciesGenus");
        if (genusElem) genusElem.innerText = b.genus || "—";

        const thumbModalImg = document.getElementById("thumbnailModalImage");
        if (thumbModalImg) thumbModalImg.src = b.thumbnailUrl || "assets/img/noimage.jpg";

        const deleteSection = document.getElementById("adminDeleteSection");
        if (deleteSection) {
            if (isAdmin) {
                deleteSection.classList.remove("d-none");
            } else {
                deleteSection.classList.add("d-none");
            }
            document.getElementById("deleteSpeciesFullBtn").dataset.speciesId = b.id;
        }

        const addImageBtn = document.getElementById("openAddImageModalBtn");
        if (addImageBtn) {
            if (isAdmin) {
                addImageBtn.classList.remove("d-none");
                const targetIdInput = document.getElementById("targetSpeciesId");
                if (targetIdInput) targetIdInput.value = b.id;
                const targetNameDisplay = document.getElementById("targetSpeciesNameDisplay");
                if (targetNameDisplay) targetNameDisplay.innerText = b.name;
            } else {
                addImageBtn.classList.add("d-none");
            }
        }

        const galleryContainer = document.getElementById("speciesImages");
        if (galleryContainer) {
            galleryContainer.innerHTML = `<p class="text-muted">Loading images...</p>`;
        }
    },
};