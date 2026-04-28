import { AppState } from "../../core/state.js";

export const AttributeManager = {
  renderAttributesGrid() {
    const container = document.getElementById("adminAttributesGrid"); // Corrected ID
    if (!container) return;

    container.innerHTML = "";
    const keys = Array.from(AppState.allAttributeKeys).sort();

    if (keys.length === 0) {
      container.innerHTML = `<div class="col-12 text-center py-5 text-muted">No custom attributes created yet.</div>`;
      return;
    }

    keys.forEach(key => {
      const col = document.createElement("div");
      col.className = "col-md-4 col-sm-6"; 
      col.innerHTML = `
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body d-flex justify-content-between align-items-center p-3">
            <span class="fw-bold">${key}</span>
            <button class="btn btn-sm btn-outline-danger border-0 remove-attr-btn" data-key="${key}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      `;

      col.querySelector(".remove-attr-btn")?.addEventListener("click", () => {
        this.handleDeleteAttribute(key);
      });

      container.appendChild(col);
    });
  },

  handleDeleteAttribute(key: string) {
    if (confirm(`Remove "${key}"? (This change will be reflected on all species)`)) {
      AppState.allAttributeKeys.delete(key);
      this.renderAttributesGrid();
    }
  },

  init() {
    const addBtn = document.getElementById("adminAddAttributeSubmit"); 
    const input = document.getElementById("adminNewAttributeName") as HTMLInputElement;

    addBtn?.addEventListener("click", () => {
      const name = input.value.trim();
      if (name) {
        AppState.allAttributeKeys.add(name);
        input.value = "";
        this.renderAttributesGrid();
      }
    });
  }
};