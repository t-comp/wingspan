import { ButterflyAPI } from "./api.js";
export const TagManager = {
    tagData: {
        "Life Stage": ["Egg", "Larva", "Nymph", "Pupa", "Adult", "Multiple Stages", "Unknown"],
        "Sex": ["Male", "Female", "Both", "Unknown"],
        "Behavior": ["Feeding", "Nectar Feeding", "Herbivory", "Predation", "Scavenging", "Movement", "Flying", "Walking", "Resting", "Mating Flight", "Reproduction", "Mating", "Oviposition", "Courtship", "Guarding Mate", "Social", "Aggregation", "Colony Activity", "Nest Building"],
        "Ecological Interaction": ["Pollination", "Parasitoid Interaction", "Predation Event", "Camouflage", "Mimicry", "Mutualism", "Parasitism"],
        "View / Anatomy": ["Dorsal", "Lateral", "Ventral", "Head Close-up", "Wing Detail", "Genitalia", "Whole Organism", "Habitat Shot", "In Hand / Handling"],
        "Developmental Context": ["Emerging (Eclosion)", "Molting", "Pupating", "Newly Emerged Adult", "Teneral Adult", "Oviposition Site"],
        "Host / Substrate": ["On Host Plant", "Host Plant Visible", "Flower Visit", "Soil", "Water Surface", "Bark", "Leaf Underside", "Stone", "Artificial Structure"],
        "Image Management": ["Educational Program", "Marketing", "Social Media Ready", "Scientific Documentation", "Exhibit Signage", "ID Reference", "Needs Review"],
        "Image Quality": ["Macro", "Focus Stack", "Studio", "Field Photo", "Natural Light", "Flash Used", "Specimen Photo", "Live Animal"],
        "Conservation": ["Native", "Tropical", "Invasive", "Endangered", "Captive Rearing", "Wild Individual"],
        "Biological Moments": ["Predation Event", "Parasitoid Emergence", "Deformity", "Disease", "Injury", "Seasonal Morph", "Gynandromorph"],
        "Layout": ["Vertical", "Horizontal"]
    },
    async initTagContainer() {
        const container = document.getElementById("tagCheckboxContainer");
        if (!container)
            return;
        try {
            const dbTags = await ButterflyAPI.getAllTags();
            let finalHtml = '';
            for (const [categoryName, tagNames] of Object.entries(this.tagData)) {
                let categoryGroupHtml = '';
                let hasFoundAnyInThisCategory = false;
                tagNames.forEach(name => {
                    const match = dbTags.find(t => t && t.tagName && t.tagName.toString().trim().toLowerCase() === name.trim().toLowerCase());
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
            container.innerHTML = finalHtml || '<p class="text-muted small">No matching tags found.</p>';
        }
        catch (err) {
            console.error("Tag UI Error:", err);
            container.innerHTML = '<p class="text-danger small">Error loading tags.</p>';
        }
    }
};
