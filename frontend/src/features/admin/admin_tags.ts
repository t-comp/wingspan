import { ButterflyAPI } from "../../core/api";

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
    const containers = document.querySelectorAll(
      "#tagCheckboxContainer, #tagCheckboxList, .tag-container-sync",
    );
    if (containers.length === 0) return;

    try {
      const dbTags = await ButterflyAPI.getAllTags();
      const grouped: { [key: string]: any[] } = {};

      // Use the same grouping logic as above
      dbTags.forEach((t) => {
        let cat = t.tagCategory;
        if (!cat || cat === "Uncategorized") {
          const cleanName = (t.tagName || "").toLowerCase().trim();
          for (const [cName, tNames] of Object.entries(this.tagData)) {
            if (tNames.map((n) => n.toLowerCase().trim()).includes(cleanName)) {
              cat = cName;
              break;
            }
          }
        }
        const finalCat = cat || "Uncategorized";
        if (!grouped[finalCat]) grouped[finalCat] = [];
        grouped[finalCat].push(t);
      });

      let finalHtml = "";
      Object.keys(grouped)
        .sort()
        .forEach((categoryName) => {
          const tagsInCat = grouped[categoryName];
          const tagHtml = tagsInCat
            .map(
              (t) => `
                <div class="form-check" style="width: 180px;">
                    <input class="form-check-input" type="checkbox" name="tagIds" value="${t.tagId}">
                    <label class="form-check-label small text-dark">${t.tagName}</label>
                </div>
            `,
            )
            .join("");

          finalHtml += `
                <div class="tag-category-block mb-3 w-100">
                    <h6 class="fw-bold text-primary mb-1 sticky-top bg-white py-1" style="font-size: 0.85rem; top: -2px; z-index: 10;">
                        ${categoryName}
                    </h6>
                    <div class="d-flex flex-wrap border-bottom pb-2 mb-2">${tagHtml}</div>
                </div>`;
        });

      containers.forEach((c) => (c.innerHTML = finalHtml));
    } catch (err) {
      console.error(err);
    }
  },

  async refreshAdminTagsView() {
    try {
      const dbTags = await ButterflyAPI.getAllTags();
      const grouped: { [key: string]: any[] } = {};

      dbTags.forEach((tag) => {
        // 1. Get the category directly from the backend DTO
        let cat = tag.tagCategory;

        // 2. FALLBACK ONLY: If the backend category is empty/null,
        // check the hardcoded list to try and "guess" where it belongs.
        if (!cat || cat === "Uncategorized" || cat.trim() === "") {
          const cleanName = (tag.tagName || "").toLowerCase().trim();
          for (const [categoryName, tagNames] of Object.entries(
            TagManager.tagData,
          )) {
            if (
              tagNames.map((n) => n.toLowerCase().trim()).includes(cleanName)
            ) {
              cat = categoryName;
              break;
            }
          }
        }

        // 3. Final safety net
        const finalCat = cat || "Uncategorized";

        if (!grouped[finalCat]) grouped[finalCat] = [];
        grouped[finalCat].push(tag);
      });

      const listContainer = document.getElementById("adminTagCategoryList");
      if (!listContainer) return;

      // 4. Render only the categories that actually exist in your database/fallback
      const categories = Object.keys(grouped).sort();
      listContainer.innerHTML = categories
        .map(
          (cat) => `
            <button class="list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center" 
                    onclick="TagManager.renderTagEditor('${cat.replace(
                      /'/g,
                      "\\'",
                    )}', ${JSON.stringify(grouped[cat]).replace(
                      /"/g,
                      "&quot;",
                    )})">
                <span class="fw-bold">${cat}</span>
                <span class="badge bg-primary rounded-pill">${
                  grouped[cat].length
                }</span>
            </button>
        `,
        )
        .join("");
    } catch (err) {
      console.error("Admin Tag Error:", err);
    }
  },

  renderTagEditor(categoryName: string, tags: any[]) {
    const editor = document.getElementById("tagEditorContainer");
    const emptyState = document.getElementById("tagEditorEmptyState");
    const title = document.getElementById("currentEditingCategory");
    const grid = document.getElementById("activeTagsGrid");

    emptyState?.classList.add("d-none");
    editor?.classList.remove("d-none");
    if (title) title.innerText = categoryName;

    if (grid) {
      // MATCHING TagDTO: tagId
      const uniqueTags = Array.from(
        new Map(tags.map((t) => [t.tagId, t])).values(),
      );

      grid.innerHTML = uniqueTags
        .map(
          (tag) => `
                <div class="btn-group shadow-sm m-1">
                    <span class="btn btn-sm btn-white border border-end-0 fw-medium">${
                      tag.tagName
                    }</span>
                    <button class="btn btn-sm btn-white border border-start-0 text-danger" 
        onclick="TagManager.deleteTag(${tag.tagId}, '${categoryName.replace(
          /'/g,
          "\\'",
        )}')">
    <i class="fas fa-times"></i>
</button>
                </div>
            `,
        )
        .join("");
    }

    const addBtn = document.getElementById("adminAddTagSubmit");
    const input = document.getElementById(
      "adminNewTagName",
    ) as HTMLInputElement;

    if (addBtn) {
      addBtn.onclick = async () => {
        const nameValue = input.value.trim();
        if (!nameValue) return;
        try {
          await ButterflyAPI.createTag({
            name: nameValue,
            category: categoryName,
          });
          input.value = "";

          // THE SYNC CALL
          await TagManager.globalRefresh();

          // Re-filter for the current view
          const allTags = await ButterflyAPI.getAllTags();
          const updatedTags = allTags.filter(
            (t) =>
              (t.tagCategory || "").toLowerCase() ===
                categoryName.toLowerCase() ||
              (t.tagName || "").toLowerCase() === nameValue.toLowerCase(),
          );
          TagManager.renderTagEditor(categoryName, updatedTags);
        } catch (err: any) {
          alert(
            "Action completed. If tag doesn't appear, check if it's a duplicate.",
          );
        }
      };
    }
  },

  async deleteTag(tagId: number, currentCategory: string) {
    if (confirm("Delete this tag?")) {
      try {
        await ButterflyAPI.deleteTag(tagId);

        // THE SYNC CALL
        await TagManager.globalRefresh();

        const allTags = await ButterflyAPI.getAllTags();
        const updatedTags = allTags.filter(
          (t) =>
            (t.tagCategory || "").toLowerCase() ===
            currentCategory.toLowerCase(),
        );

        if (updatedTags.length > 0) {
          TagManager.renderTagEditor(currentCategory, updatedTags);
        } else {
          document
            .getElementById("tagEditorContainer")
            ?.classList.add("d-none");
          document
            .getElementById("tagEditorEmptyState")
            ?.classList.remove("d-none");
        }
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete tag.");
      }
    }
  },

  async globalRefresh() {
    console.log("Syncing all tag components...");
    // Refresh the Admin Dashboard sidebar
    await this.refreshAdminTagsView();
    // Refresh the Checkbox containers (Upload Modal & Edit Image Modal)
    await this.initTagContainer();
  },
};

(window as any).TagManager = TagManager;

(window as any).promptNewCategory = async () => {
  const catName = prompt("Enter new category name:");
  if (catName && catName.trim()) {
    try {
      await ButterflyAPI.createTag({
        name: "Category Start",
        category: catName.trim(),
      });
      await TagManager.refreshAdminTagsView();
    } catch (err) {
      console.error(err);
    }
  }
};
