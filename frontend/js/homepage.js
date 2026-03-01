import { ButterflyAPI } from "./api.js";
import { UI } from "./ui.js";

export async function initHome() {
  console.log("Home Gallery Initializing...");


  // 1. DATA INITIALIZATION
  let butterflies = await ButterflyAPI.getAll();


  // 2. ELEMENT SELECTORS
  const portfolio = document.getElementById("portfolio");
  const checkoutView = document.getElementById("checkoutView");
  const speciesView = document.getElementById("speciesView");
  const searchNavBar = document.getElementById("searchNavBar");

  const viewGalleryBtn = document.getElementById("viewGalleryBtn");
  const viewCheckoutBtn = document.getElementById("viewCheckoutBtn");
  const backBtn = document.getElementById("backToGalleryBtn");

  const searchInput = document.getElementById("searchInput");
  const themeToggle = document.getElementById("toggleTheme");

  const deleteBtn = document.getElementById("deleteButterflyBtn");
  const addForm = document.getElementById("addButterflyForm");

  // 3. VIEW MANAGEMENT HELPERS
  const showView = (view) => {
    // so we can hide all main views
    [portfolio, speciesView, checkoutView].forEach((v) => {
      if (v) v.style.display = "none";
    });
    if (view) view.style.display = "block";
    window.scrollTo(0, 0);
  };

  const showSpeciesView = (b) => {
    showView(speciesView);
    searchNavBar.style.display = "none";

    document.getElementById("speciesName").innerText = b.name;
    document.getElementById("speciesScientific").innerText = b.scientific;
    document.getElementById("speciesSex").innerText = b.sex;
    document.getElementById("speciesLifecycle").innerText = b.lifecycle || "N/A";
    document.getElementById("speciesDescription").innerText = b.description;
    document.getElementById("speciesImage").src = b.image;

    const speciesImagesContainer = document.getElementById("speciesImages");
    speciesImagesContainer.innerHTML = ""; 

    (b.additionalImages || []).forEach((imgUrl) => {
      const img = document.createElement("img");
      img.src = imgUrl;
      img.className = "img-fluid rounded shadow-sm";
      img.style.width = "30%";
      img.style.maxHeight = "150px";
      img.style.objectFit = "cover";
      img.style.cursor = "pointer";

      img.addEventListener("click", () => {
        const modal = new bootstrap.Modal(
          document.getElementById("additionalImageModal")
        );
        document.getElementById("modalImage").src = imgUrl;
        document.getElementById("modalName").innerText = b.name;
        document.getElementById("modalScientific").innerText = b.scientific;
        document.getElementById("modalDescription").innerText = b.description;
        document.getElementById("modalImgSize").innerText = b.imgSize || "Unknown";
        document.getElementById("modalDownloadLink").href = imgUrl;
        modal.show();
      });

       // this is an idea i had, so if u click the additional image 
      // itll replace the main image on the left and maybe the info could change
      // img.addEventListener("click", () => {
      //   document.getElementById("speciesImage").src = imgUrl;
      // });


      speciesImagesContainer.appendChild(img);
    });
  };

  const refreshGallery = (data = butterflies) => {
    UI.renderGrid(data, (b) => {
      showSpeciesView(b);
    });
  };

  // ==========================
  // 4. EVENT LISTENERS
  // ==========================
  //changed the logic here a little bit 

  backBtn?.addEventListener("click", () => {
    showView(portfolio);
    searchNavBar.style.display = "block";
  });

  viewGalleryBtn?.addEventListener("click", () => {
    showView(portfolio);
    searchNavBar.style.display = "block";
    viewGalleryBtn.classList.add("active");
    viewCheckoutBtn.classList.remove("active");
  });

  viewCheckoutBtn?.addEventListener("click", () => {
    showView(checkoutView);
    searchNavBar.style.display = "none";
    viewCheckoutBtn.classList.add("active");
    viewGalleryBtn.classList.remove("active");
  });

  // Search logic
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = butterflies.filter((b) => b.name.toLowerCase().includes(query));
    refreshGallery(filtered);
  });

  // Add new butterfly
  addForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newB = {
      id: Math.floor(Math.random() * 1000).toString(),
      name: document.getElementById("newName").value,
      scientific: document.getElementById("newScientific").value,
      sex: document.getElementById("newSex").value,
      lifecycle: "Unknown",
      description: document.getElementById("newDescription").value,
      tags: document.getElementById("newTags").value,
      image: document.getElementById("newImage").value || "assets/img/noimage.jpg",
      imgSize: "Unknown",
    };
    butterflies.push(newB);
    await ButterflyAPI.saveAll(butterflies);
    refreshGallery();
    e.target.reset();
    bootstrap.Modal.getInstance(document.getElementById("addButterflyModal"))?.hide();
  });

  // Delete butterfly
  deleteBtn?.addEventListener("click", async () => {
    const idx = parseInt(deleteBtn.dataset.index);
    if (isNaN(idx)) return;
    if (confirm(`Delete "${butterflies[idx].name}"?`)) {
      butterflies.splice(idx, 1);
      await ButterflyAPI.saveAll(butterflies);
      refreshGallery();
      bootstrap.Modal.getInstance(document.getElementById("butterflyModal"))?.hide();
    }
  });

  // Theme Toggle (Light/Dark Mode)
  themeToggle?.addEventListener("click", () => {
    const body = document.body;
    const isDark = body.getAttribute("data-bs-theme") === "dark";
    body.setAttribute("data-bs-theme", isDark ? "light" : "dark");
    body.classList.toggle("bg-dark");
    body.classList.toggle("text-white");

    document.querySelectorAll(".modal-content").forEach((m) => m.classList.toggle("bg-dark"));
    document.getElementById("apiContainer")?.classList.toggle("bg-secondary");
    document.getElementById("imgContainer")?.classList.toggle("bg-secondary");
  });


  // 5. INITIAL RENDER
  showView(portfolio);
  refreshGallery();
}