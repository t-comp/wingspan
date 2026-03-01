import { ButterflyAPI } from "./api.js";
import { UI } from "./ui.js";

export async function initHome() {
  console.log("Home Gallery Initializing...");

  // 1. DATA INITIALIZATION
  let butterflies = await ButterflyAPI.getAll();

  // 2. ELEMENT SELECTORS
  const deleteBtn = document.getElementById("deleteButterflyBtn");
  const addForm = document.getElementById("addButterflyForm");
  const searchInput = document.getElementById("searchInput");
  const themeToggle = document.getElementById("toggleTheme");

  // View Toggle Selectors
  const viewGalleryBtn = document.getElementById("viewGalleryBtn");
  const viewCheckoutBtn = document.getElementById("viewCheckoutBtn");
  const searchNavBar = document.getElementById("searchNavBar");
  const portfolio = document.getElementById("portfolio");
  const checkoutView = document.getElementById("checkoutView");

  // 3. CORE REFRESH FUNCTION
  const refresh = () => {
    UI.renderGrid(butterflies, (b, idx, tagsHtml) => {
      UI.populateModal(b, idx, tagsHtml);
    });
  };

  /* =========================================
     VIEW TOGGLE LOGIC (Gallery vs Checkout)
     ========================================= */
  if (viewGalleryBtn && viewCheckoutBtn) {
    viewGalleryBtn.addEventListener("click", () => {
      if (searchNavBar) searchNavBar.style.display = "block";
      if (portfolio) portfolio.style.display = "block";
      if (checkoutView) checkoutView.style.display = "none";

      viewGalleryBtn.classList.add("active");
      viewCheckoutBtn.classList.remove("active");
    });

    viewCheckoutBtn.addEventListener("click", () => {
      if (searchNavBar) searchNavBar.style.display = "none";
      if (portfolio) portfolio.style.display = "none";
      if (checkoutView) checkoutView.style.display = "block";

      viewCheckoutBtn.classList.add("active");
      viewGalleryBtn.classList.remove("active");
    });
  }

  /* =========================================
     EVENT LISTENERS 
     ========================================= */

  // Add New Butterfly
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
      image:
        document.getElementById("newImage").value || "assets/img/noimage.jpg",
      imgSize: "Unknown",
      apiEndpoint: "Generated upon save",
    };

    butterflies.push(newB);
    await ButterflyAPI.saveAll(butterflies);
    refresh();

    e.target.reset();
    const modalElem = document.getElementById("addButterflyModal");
    if (modalElem) bootstrap.Modal.getInstance(modalElem).hide();
  });

  // Delete Butterfly
  deleteBtn?.addEventListener("click", async () => {
    const idx = parseInt(deleteBtn.dataset.index);
    if (isNaN(idx)) return;

    if (confirm(`Delete "${butterflies[idx].name}"?`)) {
      butterflies.splice(idx, 1);
      await ButterflyAPI.saveAll(butterflies);
      refresh();

      const modalElem = document.getElementById("butterflyModal");
      if (modalElem) bootstrap.Modal.getInstance(modalElem).hide();
    }
  });

  // Search Logic
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = butterflies.filter((b) =>
      b.name.toLowerCase().includes(query),
    );
    UI.renderGrid(filtered, (b, idx, tagsHtml) =>
      UI.populateModal(b, idx, tagsHtml),
    );
  });

  // Theme Toggle (Light/Dark Mode)
  themeToggle?.addEventListener("click", () => {
    const body = document.body;
    const isDark = body.getAttribute("data-bs-theme") === "dark";
    body.setAttribute("data-bs-theme", isDark ? "light" : "dark");
    body.classList.toggle("bg-dark");
    body.classList.toggle("text-white");

    document
      .querySelectorAll(".modal-content")
      .forEach((m) => m.classList.toggle("bg-dark"));
    document.getElementById("apiContainer")?.classList.toggle("bg-secondary");
    document.getElementById("imgContainer")?.classList.toggle("bg-secondary");
  });

  // 4. INITIAL RENDER
  refresh();
}
