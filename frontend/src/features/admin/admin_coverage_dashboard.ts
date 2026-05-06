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
  // =========================================================
  // ✨ DEBUG LOGS: Let's see what the browser is finding! ✨
  // =========================================================
  console.log("--- COVERAGE DASHBOARD INIT CHECK ---");

  const modalElement = document.getElementById("coverageTagModal");
  console.log("1. Did it find the Modal HTML?", modalElement);

  const checkboxContainer = document.getElementById("coverageFullTagGrid");
  console.log("2. Did it find the Checkbox Container?", checkboxContainer);

  const saveModalBtn = document.getElementById("saveCoverageTagsBtn");
  console.log("3. Did it find the Save Button?", saveModalBtn);
  // =========================================================

  // =========================================================
  // ✨ CLICK TRACKER LOGS ✨
  // =========================================================
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
  // =========================================================

  const navBtn = document.getElementById("navCoverageBtn");
  const dashboard = document.getElementById("coverageDashboard");
  const checkBtn = document.getElementById("checkCoverageBtn");
  const input = document.getElementById(
    "speciesCoverageInput",
  ) as HTMLTextAreaElement;
  const resultsSection = document.getElementById("coverageResultsSection");
  const tableHead = document.getElementById("coverageTableHead");
  const tableBody = document.getElementById("coverageTableBody");

  if (!navBtn || !dashboard || !checkBtn) return;

  // Navigation Logic
  navBtn.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelectorAll("section")
      .forEach((sec) => ((sec as HTMLElement).style.display = "none"));
    dashboard.style.display = "block";
  });

  // Keep track of the extra tags Nathan selects from the modal
  let selectedExtraTags = new Set<string>();
  let allFetchedTags: any[] = []; // Store them here so we can search instantly!

  // Helper function to load tags from the database
  async function loadCoverageTags() {
    const grid = document.getElementById("coverageFullTagGrid");
    if (!grid) return;

    try {
      console.log("DEBUG: All tags from API:", allFetchedTags);
      allFetchedTags = await ButterflyAPI.getAllTags();
      renderCoverageTagGrid(""); // Render initially with no search filter
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
      // FIX: Check for tagName too! If neither exists, then we skip.
      const tagName = tag.name || tag.tagName || "";
      if (!tagName) return;

      // Skip core tags so they don't appear in the modal options
      if (CORE_TAGS.includes(tagName.toLowerCase())) return;

      const cat = tag.category || "Uncategorized";

      // Use the new tagName variable for the search filter
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
      <h6 class="fw-bold pb-2 mb-3" style="color: #0399b0; border-bottom: 2px solid #f8f9fa;">
        ${catName}
      </h6>
      <div class="d-flex flex-wrap gap-2 mb-4">
        ${categories[catName]
          .map((t) => {
            // Ensure you use the same tagName fallback here for the label!
            const tName = t.name || t.tagName || "Unknown";
            const isChecked = selectedExtraTags.has(tName.toLowerCase())
              ? "checked"
              : "";
            return `
              <div class="tag-chip-item">
                <input type="checkbox" class="tag-chip-checkbox d-none coverage-tag-checkbox"
                       id="cov-picker-tag-${t.id}" value="${tName}" ${isChecked}>
                <label for="cov-picker-tag-${t.id}" class="tag-chip">
                  ${tName}
                </label>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `,
      )
      .join("");
    grid.innerHTML =
      html ||
      `<div class="text-muted w-100 text-center mt-5">No tags found matching "${searchTerm}".</div>`;

    // Attach listeners to checkboxes so they instantly update our Set when clicked
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

  // Hook up the search bar to filter as Nathan types
  const searchInput = document.getElementById(
    "coverageTagPickerSearch",
  ) as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderCoverageTagGrid((e.target as HTMLInputElement).value);
    });
  }

  // Handle saving the selected tags and drawing the visual badges on the dashboard
  const saveBtn = document.getElementById("saveCoverageTagsBtn");
  const display = document.getElementById("coverageSelectedTagsDisplay");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (display) {
        display.innerHTML = Array.from(selectedExtraTags)
          .map(
            (tag) =>
              `<span class="badge bg-secondary px-3 py-2 rounded-pill shadow-sm"><i class="fas fa-tag me-1"></i>${tag}</span>`,
          )
          .join("");
      }
    });
  }

  // Trigger the load function immediately so it's ready when he clicks
  //loadCoverageTags();

  // Action Logic
  checkBtn.addEventListener("click", async () => {
    const speciesList = input.value
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (speciesList.length === 0) return;

    // Combine CORE_TAGS with whatever is currently in the Set
    const currentSearchTags = Array.from(
      new Set([...CORE_TAGS, ...Array.from(selectedExtraTags)]),
    );

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

        // Initialize ALL search tags to false for this row
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
      checkBtn.innerHTML = `<i class="fas fa-search me-2"></i>Check Coverage`;
      checkBtn.toggleAttribute("disabled", false);
    }
  });

  function renderTable(data: any[], tags: string[]) {
    if (!tableHead || !tableBody) return;

    // Build Header
    let theadHtml = `<tr><th class="text-start">Species</th>`;
    tags.forEach((tag) => {
      const displayTag = tag.replace(/\b\w/g, (l) => l.toUpperCase());
      theadHtml += `<th>${displayTag}</th>`;
    });
    theadHtml += `</tr>`;
    tableHead.innerHTML = theadHtml;

    // Build Body
    let tbodyHtml = "";
    data.forEach((item) => {
      tbodyHtml += `<tr><td class="fw-bold text-start">${item.species}</td>`;

      tags.forEach((tag) => {
        const hasTag = item.coverage[tag];
        const icon = hasTag
          ? `<i class="fas fa-check text-success fs-5"></i>`
          : `<i class="fas fa-times text-danger opacity-25"></i>`;

        tbodyHtml += `<td>${icon}</td>`;
      });
      tbodyHtml += `</tr>`;
    });
    tableBody.innerHTML = tbodyHtml;
  }
}
