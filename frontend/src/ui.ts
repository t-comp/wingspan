// js/ui.js
export const UI = {
  renderGrid(list: any[], onCardClick: Function, displayMode = "common") {
    const grid = document.getElementById("butterflyGrid");
    if (grid) {
      grid.innerHTML = "";
      list.forEach((b: any, idx: number) => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-3 mb-5";
        const imageUrl = b.thumbnailUrl
          ? b.thumbnailUrl
          : "assets/img/noimage.jpg";

        const tagsHtml = Array.isArray(b.tags)
          ? b.tags
              .map(
                (t: any) =>
                  `<span class="badge rounded-pill bg-light text-dark border me-1">${t.name}</span>`,
              )
              .join("")
          : "";

        const displayName =
          displayMode === "scientific" && b.scientificName
            ? `<i>${b.scientificName}</i>`
            : b.name;

        col.innerHTML = `
            <div class="card h-100 butterfly-card border-0 shadow-sm">
                <div class="butterfly-img-wrapper">
                  <img src="${imageUrl}" alt="${b.name}" style="width:100%; height:100%; object-fit:cover;">                </div>
                <div class="card-body">
                    <h5 class="card-title fw-bold mb-2">${displayName}</h5>
                    <div class="mb-2">${tagsHtml}</div>
                </div>
            </div>`;

        const card = col.querySelector(".butterfly-card") as HTMLElement | null;
        if (card) {
          card.addEventListener("click", () => onCardClick(b, idx, tagsHtml));
        }
        grid.appendChild(col);
      });
    }
  },

  populateSpeciesView(b: any, isAdmin: boolean) {
    const nameElem = document.getElementById("speciesName");
    if (nameElem) nameElem.innerText = b.name;

    const scientificElem = document.getElementById("speciesScientific");
    if (scientificElem) scientificElem.innerText = b.scientificName || "N/A";

    const descElem = document.getElementById("speciesDescription");
    if (descElem)
      descElem.innerText = b.description || "No description provided.";

    const imgElem = document.getElementById(
      "speciesImage",
    ) as HTMLImageElement | null;
    if (imgElem) imgElem.src = b.thumbnailUrl || "assets/img/noimage.jpg";

    const orderElem = document.getElementById("speciesOrder");
    if (orderElem) orderElem.innerText = b.orderName || "—";

    const familyElem = document.getElementById("speciesFamily");
    if (familyElem) familyElem.innerText = b.family || "—";

    const genusElem = document.getElementById("speciesGenus");
    if (genusElem) genusElem.innerText = b.genus || "—";

    // Inside populateSpeciesView(b, isAdmin)
    let rawDesc = b.description || "";
    let cleanDesc = rawDesc;
    const extraAttributes = {};

    // Regex to find [[Label: Value]]
    const regex = /\[\[(.*?):\s*(.*?)\]\]/g;
    let match;
    while ((match = regex.exec(rawDesc)) !== null) {
      extraAttributes[match[1]] = match[2];
      // Remove the bracketed text so the user doesn't see it in the description box
      cleanDesc = cleanDesc.replace(match[0], "");
    }

    // 1. Show only the clean text in the description area
    if (descElem) {
      descElem.innerText = cleanDesc.trim() || "No description.";
    }

    // 2. Show the attributes in your blue-labeled rows
    const container = document.getElementById("customAttributesDisplay");
    if (container) {
      container.innerHTML = "";
      Object.entries(extraAttributes).forEach(([label, value]) => {
        container.insertAdjacentHTML(
          "beforeend",
          `
            <div class="row mb-2">
                <div class="col-4 fw-bold" style="color: #0399b0">${label}:</div>
                <div class="col-8 text-muted">${value}</div>
            </div>
        `,
        );
      });
    }

    // 3. Attach back to 'b' so the Edit Modal can see them
    b.extraAttributes = extraAttributes;

    const thumbModalImg = document.getElementById(
      "thumbnailModalImage",
    ) as HTMLImageElement | null;
    if (thumbModalImg) {
      thumbModalImg.src = b.thumbnailUrl || "assets/img/noimage.jpg";
    }

    const deleteSection = document.getElementById("adminDeleteSection");
    if (deleteSection) {
      if (isAdmin) {
        deleteSection.classList.remove("d-none");
      } else {
        deleteSection.classList.add("d-none");
      }
      const deleteBtn = document.getElementById(
        "deleteSpeciesFullBtn",
      ) as HTMLElement | null;
      if (deleteBtn) deleteBtn.dataset.speciesId = b.id;
    }

    const addImageBtn = document.getElementById("openAddImageModalBtn");
    if (addImageBtn) {
      if (isAdmin) {
        addImageBtn.classList.remove("d-none");
        const targetIdInput = document.getElementById(
          "targetSpeciesId",
        ) as HTMLInputElement | null;
        if (targetIdInput) targetIdInput.value = b.id;
        const targetNameDisplay = document.getElementById(
          "targetSpeciesNameDisplay",
        );
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
