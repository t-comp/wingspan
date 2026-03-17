// js/ui.js
export const UI = {renderGrid(list, onCardClick) {
  const grid = document.getElementById("butterflyGrid");
    grid.innerHTML = "";

    list.forEach((b, idx) => {
      // 1. LOG THE NEW PROPERTY: This will show you the S3 link for newer butterflies
      console.log(`Species: ${b.name} | URL: ${b.thumbnailUrl}`);

      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4 mb-5";

      // 2. DYNAMIC URL LOGIC:
      // Use the cloud link if it exists, otherwise use your placeholder
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
//   const grid = document.getElementById("butterflyGrid");
//   grid.innerHTML = "";
//   const API_BASE_URL = "http://159.203.134.226:8080"; // Ensure access to base URL

//   list.forEach((b, idx) => {
//     console.log(`Species: ${b.name} | URL: ${b.thumbnailUrl}`);
//     const col = document.createElement("div");
//     col.className = "col-md-6 col-lg-4 mb-5";
//   //const imgId = b.thumbnailId || b.imageId || b.id; 

//   // 2. Use that captured imgId for the URL
//   const imageUrl = b.thumbnailUrl 
//       ? b.thumbnailUrl 
//       : "assets/img/noimage.jpg"; 

//     // FIX 2: Handle Tags (Backend returns objects, not a comma string)
//     const tagsHtml = Array.isArray(b.tags) 
//       ? b.tags.map(t => `<span class="badge rounded-pill bg-light text-dark border me-1">${t.name}</span>`).join("")
//       : "";

//     col.innerHTML = `
//       <div class="card h-100 butterfly-card border-0 shadow-sm">
//         <div class="butterfly-img-wrapper">
//           <img src="${imageUrl}" alt="${b.name}" style="width:100%; height:200px; object-fit:cover;">
//         </div>
//         <div class="card-body">
//           <h5 class="card-title fw-bold mb-2">${b.name}</h5>
//           <div class="mb-2">${tagsHtml}</div>
//         </div>
//       </div>`;

//     col.querySelector(".butterfly-card").addEventListener("click", () => onCardClick(b, idx, tagsHtml));
//     grid.appendChild(col);
//   });
// },

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
