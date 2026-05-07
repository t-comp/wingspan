// src/features/species/species_editor.ts

/**
 * This module manages the "Edit Species" page, allowing admins to update a
 * butterfly's taxonomic info. It handles parsing and saving dynamic, custom
 * attributes (like habitat or diet) using a specialized bracket formatting
 * system before sending updates to the API.
 */

import { ButterflyAPI } from "../../core/api.js";
import { AppState } from "../../core/state.js";

// Exporting this so homepage.ts can use it when first opening the modal
export function addDynamicField(label = "", value = "") {
  const container = document.getElementById("dynamicSpeciesFields");
  if (!container) return;

  const div = document.createElement("div");
  div.className = "mb-3 dynamic-field-wrapper";
  div.innerHTML = `
    <label class="form-label fw-bold d-flex justify-content-between small text-muted">
        ${label}
        <button type="button" class="btn-close" style="font-size: 0.5rem;" 
                onclick="this.closest('.dynamic-field-wrapper').remove()"></button>
    </label>
    <input type="text" class="form-control custom-species-input attribute-input" 
           data-label="${label}" value="${value}">
  `;
  container.appendChild(div);
}

export function initSpeciesEditor(
  reloadSpeciesCallback: (species: any) => Promise<void>,
  reloadGalleryCallback: () => void,
) {
  const editSpeciesForm = document.getElementById("editSpeciesForm");

  if (editSpeciesForm) {
    editSpeciesForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const speciesId = (
        document.getElementById("editSpeciesId") as HTMLInputElement
      ).value;

      // Collect Dynamic Attributes into a Map (Object)
      const customInputs = document.querySelectorAll(".custom-species-input");
      const attributeMap: Record<string, string> = {};

      customInputs.forEach((input) => {
        const label = input.getAttribute("data-label");
        const val = (input as HTMLInputElement).value;
        if (label && val.trim() !== "") {
          attributeMap[label] = val.trim();
        }
      });

      // Prepare Standard Data (Description is now just pure text)
      const data = {
        name: (document.getElementById("editSpeciesName") as HTMLInputElement)
          .value,
        scientificName:
          (document.getElementById("editSpeciesScientific") as HTMLInputElement)
            .value || "",
        description:
          (
            document.getElementById(
              "editSpeciesDescription",
            ) as HTMLInputElement
          ).value || "",
        orderName:
          (document.getElementById("editSpeciesOrder") as HTMLInputElement)
            .value || "",
        family:
          (document.getElementById("editSpeciesFamily") as HTMLInputElement)
            .value || "",
        genus:
          (document.getElementById("editSpeciesGenus") as HTMLInputElement)
            .value || "",
      };

      try {
        await ButterflyAPI.updateSpecies(speciesId, data);

        await ButterflyAPI.updateSpeciesAttributes(speciesId, attributeMap);

        const editModal = document.getElementById("editSpeciesModal");
        const modalInstance = bootstrap.Modal.getInstance(editModal);
        if (modalInstance) modalInstance.hide();

        AppState.butterflies = await ButterflyAPI.getAll();
        const freshSpecies = await ButterflyAPI.getSpeciesById(speciesId);

        await reloadSpeciesCallback(freshSpecies);
        reloadGalleryCallback();

        alert("Species and Attributes updated successfully!");
      } catch (err: any) {
        console.error("Update failed:", err);
        alert("Update failed: " + err.message);
      }
    });
  }

  // Handle adding new custom fields via the prompt
  const addFieldBtn = document.getElementById(
    "addNewSpeciesFieldBtn",
  ) as HTMLElement | null;
  if (addFieldBtn) {
    addFieldBtn.onclick = () => {
      const fieldName = prompt("Enter new attribute name (e.g., Host Plant):");
      if (fieldName && fieldName.trim() !== "") {
        const cleanName = fieldName.trim();

        // 1. Add to the Global Master List so it exists for all other species
        AppState.allAttributeKeys.add(cleanName);

        // 2. Immediately add the input field to the CURRENT modal
        addDynamicField(cleanName, "");
      }
    };
  }
}
