// js/api.js
const API_BASE_URL = "http://159.203.134.226:8080";

// const API_BASE_URL = "http://localhost:8080";

const jsonHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const ButterflyAPI = {
  // ==========================
  // SPECIES ENDPOINTS
  // ==========================
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/species/all`, {
        headers: { Accept: "application/json" },
      });
      return await response.json();
    } catch (error) {
      console.error("Error fetching species. Is the server running?", error);
      return [];
    }
  },

  async getSpeciesById(speciesId) {
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async getButterflies() {
    const response = await fetch(`${API_BASE_URL}/species/butterflies`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async getInsects() {
    const response = await fetch(`${API_BASE_URL}/species/insects`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/species/create`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        name: data.name,
        scientificName: data.scientific,
        description: data.description,
        type: "BUTTERFLY",
      }),
    });
    return await response.json();
  },

  async updateSpecies(speciesId, data) {
    const response = await fetch(
      `${API_BASE_URL}/species/${speciesId}/update`,
      {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      },
    );
    return await response.json();
  },

  async delete(speciesId) {
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async filterSpecies(orderName, family, genus) {
    const params = new URLSearchParams();
    if (orderName) params.append("orderName", orderName);
    if (family) params.append("family", family);
    if (genus) params.append("genus", genus);

    const response = await fetch(
      `${API_BASE_URL}/species/filter?${params.toString()}`,
      { headers: { Accept: "application/json" } },
    );
    return await response.json();
  },

  async getFilterOptions() {
    const response = await fetch(`${API_BASE_URL}/species/filter-options`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async setThumbnail(speciesId, imageId) {
    const response = await fetch(
      `${API_BASE_URL}/species/${speciesId}/set-thumbnail?imageId=${imageId}`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
    );
    return await response.json();
  },

  async removeThumbnail(speciesId) {
    const response = await fetch(
      `${API_BASE_URL}/species/${speciesId}/remove-thumbnail`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
    );
    return await response.json();
  },

  // ==========================
  // USER / AUTH ENDPOINTS
  // ==========================
  async login(usernameVal, passwordVal) {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        usernameOrEmail: usernameVal,
        password: passwordVal,
      }),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(
        errorMsg || `Server responded with status ${response.status}`,
      );
    }
    return await response.json();
  },

  async createAccount(userData) {
    const response = await fetch(`${API_BASE_URL}/user/create-account`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        utype: "STUDENT",
      }),
    });
    return await response.json();
  },

  async adminCreateAccount(userData) {
    const response = await fetch(`${API_BASE_URL}/user/admin/create-account`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(userData),
    });
    return await response.json();
  },

  async getStudentDashboard(email) {
    const response = await fetch(
      `${API_BASE_URL}/user/dashboard?email=${email}`,
      { headers: { Accept: "application/json" } },
    );
    return await response.json();
  },

  async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/user/all`, {
        headers: { Accept: "application/json" },
      });
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  async deleteUser(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async updateUsername(userId, newUsername) {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/update-username?newUsername=${newUsername}`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
    );
    return await response.json();
  },

  async updateEmail(userId, newEmail) {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/update-email?newEmail=${newEmail}`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
    );
    return await response.json();
  },

  async makeAdmin(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/make-admin`, {
      method: "PUT",
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async makeStudent(userId) {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/make-student`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
    );
    return await response.json();
  },

  async activateUser(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/activate`, {
      method: "PUT",
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async deactivateUser(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/deactivate`, {
      method: "PUT",
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  // ==========================
  // API KEY ENDPOINTS
  // ==========================
  async getAllApiKeys() {
    try {
      const response = await fetch(`${API_BASE_URL}/api-key/all`, {
        headers: { Accept: "application/json" },
      });
      return await response.json();
    } catch (error) {
      console.error("Error fetching API keys:", error);
      return [];
    }
  },

  async getActiveApiKeys() {
    const response = await fetch(`${API_BASE_URL}/api-key/active`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async generateApiKey(data) {
    const response = await fetch(`${API_BASE_URL}/api-key/keygen`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        teamName: data.teamName,
        projectName: data.projectName,
        semester: data.semester,
      }),
    });
    return await response.json();
  },

  async deactivateApiKey(keyId) {
    const response = await fetch(
      `${API_BASE_URL}/api-key/${keyId}/deactivate`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
    );
    return await response.json();
  },

  async activateApiKey(keyId) {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}/activate`, {
      method: "PUT",
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async extendApiKey(keyId, months) {
    const response = await fetch(
      `${API_BASE_URL}/api-key/${keyId}/extra-time?months=${months}`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
    );
    return await response.json();
  },

  async deleteApiKey(keyId) {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  // ==========================
  // TEAM ENDPOINTS
  // ==========================
  async createTeam(data) {
    const response = await fetch(`${API_BASE_URL}/teams/create`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async getAllTeams() {
    const response = await fetch(`${API_BASE_URL}/teams/all`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async getTeamById(teamId) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async getUnassignedStudents() {
    const response = await fetch(`${API_BASE_URL}/teams/unassigned-students`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async getTeamMembers(teamId) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async addTeamMember(teamId, userId) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/add-member`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify({ userId: parseInt(userId) }),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(
        errorMsg || `Server responded with status ${response.status}`,
      );
    }
    return await response.json();
  },

  async removeTeamMember(teamId, userId) {
    const response = await fetch(
      `${API_BASE_URL}/teams/${teamId}/remove-member`,
      {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ userId: parseInt(userId) }),
      },
    );

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(
        errorMsg || `Server responded with status ${response.status}`,
      );
    }
    return await response.json();
  },

  async updateTeam(teamId, data) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/update`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  async deleteTeam(teamId) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  // ==========================
  // TAG / IMAGE ENDPOINTS
  // ==========================
  async uploadImage(formData) {
    // Note: Do not set Content-Type for FormData, the browser sets it to multipart/form-data automatically
    const response = await fetch(`${API_BASE_URL}/images/admin/upload`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    });
    return await response.json();
  },

  async getAllTags() {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async createTag(tagData) {
    const response = await fetch(`${API_BASE_URL}/tags/admin`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(tagData),
    });
    return await response.json();
  },

  async deleteTag(tagId) {
    const response = await fetch(`${API_BASE_URL}/tags/admin/${tagId}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    return await response.json();
  },

  async updateTag(tagId, tagData) {
    const response = await fetch(`${API_BASE_URL}/tags/admin/${tagId}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(tagData),
    });
    return await response.json();
  },

  async filterImagesByTags(tagIds) {
    const queryString = tagIds.map((id) => `tagIds=${id}`).join("&");
    const response = await fetch(
      `${API_BASE_URL}/images/filter?${queryString}`,
      { headers: { Accept: "application/json" } },
    );
    return await response.json();
  },
};
