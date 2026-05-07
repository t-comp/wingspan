// src/features/admin/coverage_dashboard.ts
import { ButterflyAPI } from "../../core/api.js";

// We keep these lowercase for easy matching against the database tags
const CORE_TAGS = [
  "wings open",
  "wings closed",
  "horizontal",
  "vertical",
  "male",
  "female",
  "unknown sex",
  "adult",
  "larva",
  "pupa",
];

export function initCoverageDashboard() {
  console.log("--- COVERAGE DASHBOARD INIT CHECK ---");

  const modalElement = document.getElementById("coverageTagModal");
  console.log("1. Did it find the Modal HTML?", modalElement);

  const checkboxContainer = document.getElementById("coverageFullTagGrid");
  console.log("2. Did it find the Checkbox Container?", checkboxContainer);

  const saveModalBtn = document.getElementById("saveCoverageTagsBtn");
  console.log("3. Did it find the Save Button?", saveModalBtn);

  const triggerBtn = document.querySelector(
    '[data-bs-target="#coverageTagModal"]',
  );
  console.log("4. Did it find the Trigger Button?", triggerBtn);

  if (triggerBtn) {
    triggerBtn.addEventListener("click", async () => {
      await loadCoverageTags();

      console.log("🚨 BUTTON CLICKED!");
      const modalInDom = document.getElementById("coverageTagModal");
      console.log("🚨 Is the modal in the DOM right now?", modalInDom);

      if (!modalInDom) {
        console.error(
          "❌ ERROR: The modal is missing or commented out in the HTML!",
        );
      } else {
        console.log("✅ SUCCESS: Bootstrap should be opening the modal now.");
      }
    });
  }

  const checkBtn = document.getElementById("checkCoverageBtn");
  const input = document.getElementById(
    "speciesCoverageInput",
  ) as HTMLTextAreaElement;
  const resultsSection = document.getElementById("coverageResultsSection");
  const tableHead = document.getElementById("coverageTableHead");
  const tableBody = document.getElementById("coverageTableBody");

  if (!checkBtn) return;

  // Keep track of the extra tags Nathan selects from the modal
  let selectedExtraTags = new Set<string>();
  let allFetchedTags: any[] = [];

  // Helper function to load tags from the database
  async function loadCoverageTags() {
    const grid = document.getElementById("coverageFullTagGrid");
    if (!grid) return;

    try {
      console.log("DEBUG: All tags from API:", allFetchedTags);
      allFetchedTags = await ButterflyAPI.getAllTags();
      renderCoverageTagGrid("");
    } catch (err) {
      console.error("DEBUG: loadCoverageTags failed!", err);
      grid.innerHTML = `<div class="text-danger w-100 text-center">Failed to load tags.</div>`;
    }
  }

  // Helper function to draw the beautiful card grid based on the search term
  function renderCoverageTagGrid(searchTerm: string) {
    const grid = document.getElementById("coverageFullTagGrid");
    if (!grid) return;

    const search = searchTerm.toLowerCase().trim();
    const categories: Record<string, any[]> = {};

    allFetchedTags.forEach((tag: any) => {
      const tagName = tag.name || tag.tagName || "";
      if (!tagName) return;

      // Skip core tags so they don't appear in the modal options
      if (CORE_TAGS.includes(tagName.toLowerCase())) return;

      const cat = tag.category || tag.tagCategory || "Uncategorized";

      if (
        !search ||
        tagName.toLowerCase().includes(search) ||
        cat.toLowerCase().includes(search)
      ) {
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(tag);
      }
    });

    let html = Object.keys(categories)
      .sort()
      .map(
        (catName) => `
    <div class="col">
      <div class="bg-white p-3 rounded border shadow-none h-100">
        <h6 class="fw-bold text-primary border-bottom pb-2 mb-3">
          ${catName}
        </h6>
        <div class="d-flex flex-wrap gap-2">
            ${categories[catName]
              .map((t) => {
                const tName = t.name || t.tagName || "Unknown";
                const isChecked = selectedExtraTags.has(tName.toLowerCase())
                  ? "checked"
                  : "";
                const cleanCat = catName.replace(/[^a-z0-9]/gi, "-");
                const cleanTag = tName.replace(/[^a-z0-9]/gi, "-");
                const uniqueId = `cov-${cleanCat}-${cleanTag}-${t.id}`;

                return `
            <div class="tag-chip-item">
                <input type="checkbox" class="tag-chip-checkbox d-none coverage-tag-checkbox"
                    id="${uniqueId}" value="${tName}" ${isChecked}>
                <label for="${uniqueId}" class="tag-chip">
                ${tName}
                </label>
            </div>
            `;
              })
              .join("")}
        </div>
      </div>
    </div>
  `,
      )
      .join("");

    grid.innerHTML =
      html ||
      `<div class="text-muted w-100 text-center mt-5">No tags found matching "${searchTerm}".</div>`;

    const checkboxes = document.querySelectorAll(
      ".coverage-tag-checkbox",
    ) as NodeListOf<HTMLInputElement>;
    checkboxes.forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        if (target.checked) {
          selectedExtraTags.add(target.value.toLowerCase());
        } else {
          selectedExtraTags.delete(target.value.toLowerCase());
        }
      });
    });
  }

  const searchInput = document.getElementById(
    "coverageTagPickerSearch",
  ) as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderCoverageTagGrid((e.target as HTMLInputElement).value);
    });
  }

  const saveBtn = document.getElementById("saveCoverageTagsBtn");
  const display = document.getElementById("coverageSelectedTagsDisplay");

  // Helper function to draw and manage the selected tags display
  // Helper function to draw and manage the selected tags display
  function renderSelectedCoverageTagsDisplay() {
    if (!display) return;

    if (selectedExtraTags.size === 0) {
      display.innerHTML = `<span class="text-muted small italic">No additional tags selected</span>`;
      return;
    }

    display.innerHTML = Array.from(selectedExtraTags)
      .map(
        (tag) => `
      <span class="badge rounded-pill shadow-sm border d-inline-flex align-items-center" 
            style="background-color: #f8f9fa; 
                   color: #0399b0; 
                   border-color: #0399b0 !important; 
                   font-size: 0.75rem; 
                   padding: 6px 14px;
                   height: fit-content;
                   margin: 2px;
                   white-space: nowrap;">
        <i class="fas fa-tag me-2" style="font-size: 0.65rem;"></i>${tag}
        <span class="coverage-tag-remove ms-2 d-inline-flex align-items-center" data-tag="${tag}" title="Remove tag">
            <i class="fas fa-times"></i>
        </span>
      </span>`,
      )
      .join("");

    // Add click listeners to the PROTECTED span wrappers!
    const removeBtns = display.querySelectorAll(".coverage-tag-remove");
    removeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // e.currentTarget guarantees we get the span, even if they clicked the SVG inside it
        const tagToRemove = (e.currentTarget as HTMLElement).getAttribute(
          "data-tag",
        );

        if (tagToRemove) {
          // 1. Remove from our active Set
          selectedExtraTags.delete(tagToRemove.toLowerCase());

          // 2. Re-render the display to make it instantly disappear
          renderSelectedCoverageTagsDisplay();

          // 3. Silently uncheck it in the modal so it's accurate next time you open it
          const checkboxes = document.querySelectorAll(
            ".coverage-tag-checkbox",
          ) as NodeListOf<HTMLInputElement>;
          checkboxes.forEach((cb) => {
            if (cb.value.toLowerCase() === tagToRemove.toLowerCase()) {
              cb.checked = false;
            }
          });
        }
      });
    });
  }

  // When the modal saves, just call our new drawing function
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      renderSelectedCoverageTagsDisplay();
    });
  }
  renderSelectedCoverageTagsDisplay;

  checkBtn.addEventListener("click", async () => {
    const speciesList = input.value
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (speciesList.length === 0) return;

    const currentSearchTags = Array.from(
      new Set([...CORE_TAGS, ...Array.from(selectedExtraTags)]),
    );

    // ✨ TEXT BUTTON UPDATES HERE
    checkBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Checking...`;
    checkBtn.toggleAttribute("disabled", true);

    try {
      const allSpecies = await ButterflyAPI.getAll();
      const coverageData: any[] = [];

      for (const speciesName of speciesList) {
        const foundSpecies = allSpecies.find(
          (s: any) =>
            s.name.toLowerCase() === speciesName.toLowerCase() ||
            (s.scientificName &&
              s.scientificName.toLowerCase() === speciesName.toLowerCase()),
        );

        let displayTitle = speciesName;
        if (foundSpecies) {
          const sciName = foundSpecies.scientificName
            ? foundSpecies.scientificName
            : "Unknown";
          displayTitle = `${foundSpecies.name}<br><small class="text-muted fst-italic">${sciName}</small>`;
        } else {
          displayTitle = `${speciesName} <br><small class="text-danger fw-bold">(Not Found)</small>`;
        }

        const coverageRow = {
          species: displayTitle,
          coverage: {} as Record<string, boolean>,
        };

        currentSearchTags.forEach((tag) => (coverageRow.coverage[tag] = false));

        if (foundSpecies) {
          const speciesIdentifier =
            foundSpecies.scientificName || foundSpecies.name;
          const images =
            await ButterflyAPI.getImagesBySpecies(speciesIdentifier);

          images.forEach((img: any) => {
            if (img.tags) {
              img.tags.forEach((tag: any) => {
                const tagText =
                  tag.name ||
                  tag.tagName ||
                  (typeof tag === "string" ? tag : null);
                if (tagText) {
                  const tagNameLower = tagText.toLowerCase();
                  if (currentSearchTags.includes(tagNameLower)) {
                    coverageRow.coverage[tagNameLower] = true;
                  }
                }
              });
            }
          });
        }
        coverageData.push(coverageRow);
      }

      renderTable(coverageData, currentSearchTags);
      if (resultsSection) resultsSection.style.display = "block";
    } catch (error: any) {
      alert("Error fetching coverage data: " + error.message);
    } finally {
      // ✨ TEXT BUTTON UPDATES HERE
      checkBtn.innerHTML = `<i class="fas fa-search me-2"></i>Check Coverage`;
      checkBtn.toggleAttribute("disabled", false);
    }
  });

  function renderTable(data: any[], tags: string[]) {
    const fixedHead = document.getElementById("fixedTableHead");
    const fixedBody = document.getElementById("fixedTableBody");
    const scrollHead = document.getElementById("scrollTableHead");
    const scrollBody = document.getElementById("scrollTableBody");

    if (!fixedHead || !scrollHead || !fixedBody || !scrollBody) return;

    fixedHead.innerHTML = `<tr class="coverage-row-sync-head"><th class="text-start ps-3 align-middle">Species</th></tr>`;

    let sHeadHtml = `<tr class="coverage-row-sync-head">`;
    tags.forEach((tag) => {
      const displayTag = tag.replace(/\b\w/g, (l) => l.toUpperCase());
      sHeadHtml += `<th class="px-3 text-center align-middle" style="font-size: 0.85rem;">${displayTag}</th>`;
    });
    sHeadHtml += `</tr>`;
    scrollHead.innerHTML = sHeadHtml;

    let fBodyHtml = "";
    let sBodyHtml = "";

    data.forEach((item) => {
      fBodyHtml += `<tr class="coverage-row-sync"><td class="fw-bold text-start ps-3 align-middle">${item.species}</td></tr>`;

      sBodyHtml += `<tr class="coverage-row-sync">`;
      tags.forEach((tag) => {
        const hasTag = item.coverage[tag];
        const icon = hasTag
          ? `<i class="fas fa-check text-success fs-5"></i>`
          : `<i class="fas fa-times text-danger opacity-25"></i>`;
        sBodyHtml += `<td class="text-center align-middle">${icon}</td>`;
      });
      sBodyHtml += `</tr>`;
    });

    fixedBody.innerHTML = fBodyHtml;
    scrollBody.innerHTML = sBodyHtml;
  }
}
