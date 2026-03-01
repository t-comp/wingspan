// js/api.js
const API_BASE_URL = "https://your-api-domain.com";

export const ButterflyAPI = {
  // --- SPECIES ENDPOINTS ---
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/species/all`);
    return await response.json();
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/species/create`, {
      //
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        scientificName: data.scientific,
        description: data.description,
        type: "BUTTERFLY",
      }),
    });
    return await response.json();
  },

  async delete(speciesId) {
    return await fetch(`${API_BASE_URL}/species/${speciesId}`, {
      method: "DELETE",
    });
  },

  // --- IMAGE ENDPOINTS ---
  async uploadImage(formData) {
    const response = await fetch(`${API_BASE_URL}/images/admin/upload`, {
      //
      method: "POST",
      body: formData, // Body contains file, lifecycle_stage, etc.
    });
    return await response.json();
  },

  // --- USER/AUTH ENDPOINTS ---
  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      //
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return await response.json();
  },

  async createAccount(userData) {
    const response = await fetch(`${API_BASE_URL}/user/create-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData), // Needs: username, email, password, uType
    });
    return await response.json();
  },
};
