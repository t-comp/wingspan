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
  const navBtn = document.getElementById("navCoverageBtn");
  const dashboard = document.getElementById("coverageDashboard");
  const checkBtn = document.getElementById("checkCoverageBtn");
  const input = document.getElementById(
    "speciesCoverageInput",
  ) as HTMLTextAreaElement;
  const extraTagsInput = document.getElementById(
    "extraTagsInput",
  ) as HTMLInputElement;
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

  // Helper function to load and render the checkboxes
  async function loadCoverageTags() {
    const container = document.getElementById("coverageTagCategoriesContainer");
    if (!container) return;

    try {
      const tags = await ButterflyAPI.getAllTags();
      const categories: Record<string, any[]> = {};

      tags.forEach((tag: any) => {
        // Skip core tags so they don't appear in the modal options
        if (CORE_TAGS.includes(tag.name.toLowerCase())) return;

        const cat = tag.category || "Uncategorized";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(tag);
      });

      let html = "";
      for (const [category, catTags] of Object.entries(categories)) {
        html += `
          <div class="mb-4">
            <h6 class="fw-bold text-primary border-bottom pb-2 mb-3">${category}</h6>
            <div class="d-flex flex-wrap gap-2">
              ${catTags
                .map(
                  (tag) => `
                <div class="form-check form-check-inline bg-white border rounded px-3 py-2 shadow-sm m-0">
                  <input class="form-check-input coverage-tag-checkbox" type="checkbox" id="covTag_${tag.id}" value="${tag.name}">
                  <label class="form-check-label ms-1" style="cursor:pointer;" for="covTag_${tag.id}">${tag.name}</label>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `;
      }
      container.innerHTML =
        html || "<p class='text-muted'>No additional tags found.</p>";
    } catch (err) {
      container.innerHTML = `<div class="text-danger">Failed to load tags.</div>`;
    }
  }

  // Handle saving the selected tags
  const saveBtn = document.getElementById("saveCoverageTagsBtn");
  const display = document.getElementById("coverageSelectedTagsDisplay");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      selectedExtraTags.clear();
      const checkboxes = document.querySelectorAll(
        ".coverage-tag-checkbox:checked",
      ) as NodeListOf<HTMLInputElement>;

      checkboxes.forEach((cb) => selectedExtraTags.add(cb.value.toLowerCase()));

      // Draw the beautiful pill badges in the UI
      if (display) {
        display.innerHTML = Array.from(selectedExtraTags)
          .map(
            (tag) =>
              `<span class="badge bg-secondary px-3 py-2 rounded-pill"><i class="fas fa-tag me-1"></i>${tag}</span>`,
          )
          .join("");
      }
    });
  }

  // Trigger the load function immediately so it's ready when he clicks
  loadCoverageTags();

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
                  // Check against our newly combined dynamic array!
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

      // Pass the custom tags array to the render function!
      renderTable(coverageData, currentSearchTags);
      if (resultsSection) resultsSection.style.display = "block";
    } catch (error: any) {
      alert("Error fetching coverage data: " + error.message);
    } finally {
      checkBtn.innerHTML = `<i class="fas fa-search me-2"></i>Check Coverage`;
      checkBtn.toggleAttribute("disabled", false);
    }
  });

  // Notice we now accept `tags` as a parameter so it knows how many columns to draw!
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
