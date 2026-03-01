// js/api.js
const API_BASE_URL = "http://localhost:8080";

export const ButterflyAPI = {
  // --- SPECIES ENDPOINTS ---
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/species/all`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching species. Is the server running?", error);
      return [];
    }
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/species/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        scientific: data.scientific,
        description: data.description,
        type: "BUTTERFLY",
        sex: data.sex,
        tags: data.tags,
        image: data.image,
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
      method: "POST",
      body: formData,
    });
    return await response.json();
  },

  // --- USER/AUTH ENDPOINTS ---
  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }

    return await response.json();
  },

  async createAccount(userData) {
    const response = await fetch(`${API_BASE_URL}/user/create-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return await response.json();
  },

  // --- NEW: USER MANAGEMENT ENDPOINTS ---
  async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/user/all`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  async deleteUser(userId) {
    return await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: "DELETE",
    });
  },

  async updateUsername(userId, newUsername) {
    return await fetch(
      `${API_BASE_URL}/user/${userId}/update-username?newUsername=${newUsername}`,
      {
        method: "PUT",
      },
    );
  },

  async makeAdmin(userId) {
    return await fetch(`${API_BASE_URL}/user/${userId}/make-admin`, {
      method: "PUT",
    });
  },

  async makeStudent(userId) {
    return await fetch(`${API_BASE_URL}/user/${userId}/make-student`, {
      method: "PUT",
    });
  },
};
