import { ButterflyAPI } from "./api.js";

export const TagManager = {
  tagData: {
    "Life Stage": [
      "Egg",
      "Larva",
      "Nymph",
      "Pupa",
      "Adult",
      "Multiple Stages",
      "Unknown",
    ],
    Sex: ["Male", "Female", "Both", "Unknown"],
    Behavior: [
      "Feeding",
      "Nectar Feeding",
      "Herbivory",
      "Predation",
      "Scavenging",
      "Movement",
      "Flying",
      "Walking",
      "Resting",
      "Mating Flight",
      "Reproduction",
      "Mating",
      "Oviposition",
      "Courtship",
      "Guarding Mate",
      "Social",
      "Aggregation",
      "Colony Activity",
      "Nest Building",
    ],
    "Ecological Interaction": [
      "Pollination",
      "Parasitoid Interaction",
      "Predation Event",
      "Camouflage",
      "Mimicry",
      "Mutualism",
      "Parasitism",
    ],
    "View / Anatomy": [
      "Dorsal",
      "Lateral",
      "Ventral",
      "Head Close-up",
      "Wing Detail",
      "Genitalia",
      "Whole Organism",
      "Habitat Shot",
      "In Hand / Handling",
    ],
    "Developmental Context": [
      "Emerging (Eclosion)",
      "Molting",
      "Pupating",
      "Newly Emerged Adult",
      "Teneral Adult",
      "Oviposition Site",
    ],
    "Host / Substrate": [
      "On Host Plant",
      "Host Plant Visible",
      "Flower Visit",
      "Soil",
      "Water Surface",
      "Bark",
      "Leaf Underside",
      "Stone",
      "Artificial Structure",
    ],
    "Image Management": [
      "Educational Program",
      "Marketing",
      "Social Media Ready",
      "Scientific Documentation",
      "Exhibit Signage",
      "ID Reference",
      "Needs Review",
    ],
    "Image Quality": [
      "Macro",
      "Focus Stack",
      "Studio",
      "Field Photo",
      "Natural Light",
      "Flash Used",
      "Specimen Photo",
      "Live Animal",
    ],
    Conservation: [
      "Native",
      "Tropical",
      "Invasive",
      "Endangered",
      "Captive Rearing",
      "Wild Individual",
    ],
    "Biological Moments": [
      "Predation Event",
      "Parasitoid Emergence",
      "Deformity",
      "Disease",
      "Injury",
      "Seasonal Morph",
      "Gynandromorph",
    ],
    Layout: ["Vertical", "Horizontal"],
  },

  async initTagContainer() {
    const container = document.getElementById("tagCheckboxContainer");
    if (!container) return;
    try {
      const dbTags = await ButterflyAPI.getAllTags();

      let finalHtml = "";
      for (const [categoryName, tagNames] of Object.entries(this.tagData)) {
        let categoryGroupHtml = "";
        let hasFoundAnyInThisCategory = false;

        tagNames.forEach((name) => {
          const match = dbTags.find(
            (t) =>
              t &&
              t.tagName &&
              t.tagName.toString().trim().toLowerCase() ===
                name.trim().toLowerCase(),
          );

          if (match) {
            hasFoundAnyInThisCategory = true;
            categoryGroupHtml += `
                            <div class="form-check" style="width: 180px; margin-bottom: 5px;">
                                <input class="form-check-input" type="checkbox" name="tagIds"
                                       value="${match.tagId}" id="tag${match.tagId}">
                                <label class="form-check-label small text-dark" for="tag${match.tagId}">
                                    ${match.tagName}
                                </label>
                            </div>`;
          }
        });

        if (hasFoundAnyInThisCategory) {
          finalHtml += `
                        <div class="tag-category-block mb-4 w-100">
                            <div class="d-flex align-items-center mb-2">
                                <h6 class="fw-bold text-primary mb-0 me-2" style="font-size: 0.9rem; white-space: nowrap;">${categoryName}</h6>
                                <div class="flex-grow-1 border-bottom" style="height: 1px; opacity: 0.2;"></div>
                            </div>
                            <div class="d-flex flex-wrap">
                                ${categoryGroupHtml}
                            </div>
                        </div>`;
        }
      }

      container.innerHTML =
        finalHtml || '<p class="text-muted small">No matching tags found.</p>';
    } catch (err) {
      console.error("Tag UI Error:", err);
      container.innerHTML =
        '<p class="text-danger small">Error loading tags.</p>';
    }
  },

  async refreshAdminTagsView() {
    const list = document.getElementById("adminTagCategoryList");
    if (!list) return;

    try {
      // Fetch all tags from the database
      const allTags = await ButterflyAPI.getAllTags();

      // Grab the categories from the top of the file
      const categories = Object.keys(this.tagData);
      list.innerHTML = "";

      // Create a clickable button for each category
      categories.forEach((cat) => {
        const btn = document.createElement("button");
        btn.className =
          "list-group-item list-group-item-action d-flex justify-content-between align-items-center fw-bold text-secondary py-3";
        btn.innerHTML = `${cat} <i class="fas fa-chevron-right small opacity-50"></i>`;

        btn.onclick = (e) => {
          e.preventDefault();

          // Make the clicked button turn blue and active
          document
            .querySelectorAll("#adminTagCategoryList button")
            .forEach((b) => {
              b.classList.remove("active", "text-white");
              b.classList.add("text-secondary");
            });
          btn.classList.add("active", "text-white");
          btn.classList.remove("text-secondary");

          const tagsForCat = allTags.filter(
            (t: any) =>
              (t.tagCategory || "").toLowerCase() === cat.toLowerCase(),
          );
          this.renderTagEditor(cat, tagsForCat);
        };

        list.appendChild(btn);
      });
    } catch (error) {
      console.error("Failed to load tags for sidebar", error);
    }
  },

  // --- THE OTHER MISSING TEAMMATE FUNCTION! ---
  renderTagEditor(categoryName: string, tags: any[]) {
    // 1. Swap the empty state for the actual editor
    document.getElementById("tagEditorEmptyState")?.classList.add("d-none");
    document.getElementById("tagEditorContainer")?.classList.remove("d-none");

    // 2. Update the Title and Badge
    const titleEl = document.getElementById("currentEditingCategory");
    if (titleEl) titleEl.innerText = categoryName;

    const countEl = document.getElementById("categoryTagCount");
    if (countEl) countEl.innerText = `${tags.length} Tags`;

    // 3. Render the tags into the grid
    const grid = document.getElementById("activeTagsGrid");
    if (grid) {
      grid.innerHTML = "";
      if (tags.length === 0) {
        grid.innerHTML = `<span class="text-muted small fst-italic">No tags here yet!</span>`;
      } else {
        tags.forEach((t: any) => {
          const tagBadge = document.createElement("div");
          tagBadge.className =
            "badge bg-light text-dark border p-2 d-flex align-items-center gap-2";
          tagBadge.innerHTML = `
            <span style="font-size: 0.85rem;">${t.tagName}</span>
            <button type="button" class="btn-close" style="font-size: 0.5rem;" aria-label="Delete"></button>
          `;

          // Add Delete Logic to the little X
          const closeBtn = tagBadge.querySelector(".btn-close");
          if (closeBtn) {
            closeBtn.addEventListener("click", async () => {
              if (confirm(`Delete the tag '${t.tagName}'?`)) {
                try {
                  await ButterflyAPI.deleteTag(t.tagId);

                  // Re-fetch and re-render
                  const allTags = await ButterflyAPI.getAllTags();
                  const updatedTags = allTags.filter(
                    (tg: any) =>
                      (tg.tagCategory || "").toLowerCase() ===
                      categoryName.toLowerCase(),
                  );
                  this.renderTagEditor(categoryName, updatedTags);
                } catch (e) {
                  alert("Failed to delete tag.");
                }
              }
            });
          }
          grid.appendChild(tagBadge);
        });
      }
    }

    // 4. Handle the "Add Tag" Button
    const addInput = document.getElementById(
      "adminNewTagName",
    ) as HTMLInputElement | null;
    // 4. Handle the "Add Tag" Button
    const addBtn = document.getElementById("adminAddTagSubmit");

    if (addBtn) {
      // Clone to prevent duplicate listeners stacking up
      const newAddBtn = addBtn.cloneNode(true);
      addBtn.parentNode?.replaceChild(newAddBtn, addBtn);

      newAddBtn.addEventListener("click", async () => {
        // FIX: Grab the input exactly when clicked so it NEVER loses the reference!
        const addInput = document.getElementById(
          "adminNewTagName",
        ) as HTMLInputElement | null;
        if (!addInput) return;

        const newTagName = addInput.value.trim();
        if (!newTagName) return;

        try {
          await ButterflyAPI.createTag({
            name: newTagName,
            category: categoryName,
          });
          addInput.value = ""; // Clear input

          //  await TagManager.globalRefresh();

          // Re-fetch and re-render
          const allTags = await ButterflyAPI.getAllTags();
          const updatedTags = allTags.filter(
            (tg: any) =>
              (tg.tagCategory || "").toLowerCase() ===
              categoryName.toLowerCase(),
          );

          TagManager.renderTagEditor(categoryName, updatedTags);
        } catch (e) {
          console.error(e);
          alert("Failed to add tag.");
        }
      });
    }
  },
  // ---------------------------------------------
};
