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
    <input type="text" class="form-control custom-species-input" 
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

      let currentDescValue =
        (document.getElementById("editSpeciesDescription") as HTMLInputElement)
          .value || "";
      let cleanBaseDescription = currentDescValue
        .replace(/\[\[.*?\]\]/g, "")
        .trim();

      const customInputs = document.querySelectorAll(".custom-species-input");
      let extraString = "";

      customInputs.forEach((input) => {
        const label = input.getAttribute("data-label");
        const value = (input as HTMLInputElement).value;
        if (label && value && value.trim() !== "") {
          extraString += ` [[${label}: ${value.trim()}]]`;
        }
      });
      const finalDescription = (cleanBaseDescription + extraString).trim();

      const data = {
        name: (document.getElementById("editSpeciesName") as HTMLInputElement)
          .value,
        scientificName:
          (document.getElementById("editSpeciesScientific") as HTMLInputElement)
            .value || "",
        description: finalDescription,
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
        const editModal = document.getElementById("editSpeciesModal");
        const modalInstance = bootstrap.Modal.getInstance(editModal);
        if (modalInstance) modalInstance.hide();

        AppState.butterflies = await ButterflyAPI.getAll();

        const freshSpecies = await ButterflyAPI.getSpeciesById(speciesId);
        await reloadSpeciesCallback(freshSpecies);

        // Refresh the main grid so the updated name/data shows there too
        reloadGalleryCallback();

        alert("Species updated successfully!");
      } catch (err: any) {
        console.error("Update failed:", err);
        alert("Update failed: " + err.message);
      }
    });
  }

  // Logic for adding a custom attribute field in the Edit Species modal
  const addFieldBtn = document.getElementById(
    "addNewSpeciesFieldBtn",
  ) as HTMLElement | null;
  if (addFieldBtn) {
    addFieldBtn.onclick = () => {
      const fieldName = prompt(
        "What is the name of the new category? (e.g. Host Plant, Habitat)",
      );
      if (fieldName && fieldName.trim() !== "") {
        addDynamicField(fieldName.trim(), "");
      }
    };
  }
}
