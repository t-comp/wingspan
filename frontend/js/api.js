// js/api.js
const API_BASE_URL = "http://159.203.134.226:8080";

// const API_BASE_URL = "http://localhost:8080";

// builds headers for every request, attaching the JWT token if one is stored
function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = localStorage.getItem("jwt");
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

<<<<<<< Updated upstream
=======
// same as getHeaders() but without Content-Type, used for multipart/form-data uploads
function getAuthOnlyHeaders() {
  const headers = { Accept: "application/json" };
  const token = localStorage.getItem("jwt");
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

// reads body once, parses error message, throws if not ok
async function checkResponse(response) {
  const text = await response.text();
  if (!response.ok) {
    let msg = text;
    try { msg = JSON.parse(text).message || text; } catch {}
    throw new Error(msg || "Request failed with status " + response.status);
  }
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

>>>>>>> Stashed changes
export const ButterflyAPI = {
  // ==========================
  // SPECIES ENDPOINTS
  // ==========================
  async getAll() {
    try {
<<<<<<< Updated upstream
      const response = await fetch(`${API_BASE_URL}/species/all`, {
        headers: { Accept: "application/json" },
      });
=======
      const response = await fetch(`${API_BASE_URL}/species/all`, { headers: getHeaders() });
>>>>>>> Stashed changes
      return await response.json();
    } catch (error) {
      console.error("Error fetching species. Is the server running?", error);
      return [];
    }
  },

  async getSpeciesById(speciesId) {
<<<<<<< Updated upstream
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
=======
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}`, { headers: getHeaders() });
    return checkResponse(response);
>>>>>>> Stashed changes
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/species/create`, {
      method: "POST",
<<<<<<< Updated upstream
      headers: jsonHeaders,
=======
      headers: getHeaders(),
>>>>>>> Stashed changes
      body: JSON.stringify({
        name: data.name,
        scientificName: data.scientificName,
        description: data.description,
        type: "BUTTERFLY",
      }),
    });
    return checkResponse(response);
  },

  async updateSpecies(speciesId, data) {
<<<<<<< Updated upstream
    const response = await fetch(
      `${API_BASE_URL}/species/${speciesId}/update`,
      {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      },
    );
    return await response.json();
=======
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}/update`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return checkResponse(response);
>>>>>>> Stashed changes
  },

  async delete(speciesId) {
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async filterSpecies(orderName, family, genus) {
    const params = new URLSearchParams();
    if (orderName) params.append("orderName", orderName);
    if (family) params.append("family", family);
    if (genus) params.append("genus", genus);
<<<<<<< Updated upstream

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
=======
    const response = await fetch(`${API_BASE_URL}/species/filter?${params.toString()}`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async getFilterOptions() {
    const response = await fetch(`${API_BASE_URL}/species/filter-options`, { headers: getHeaders() });
    return checkResponse(response);
>>>>>>> Stashed changes
  },

  async setThumbnail(speciesId, imageId) {
    const response = await fetch(
      `${API_BASE_URL}/species/${speciesId}/set-thumbnail?imageId=${imageId}`,
<<<<<<< Updated upstream
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
=======
      { method: "PUT", headers: getHeaders() }
>>>>>>> Stashed changes
    );
    return checkResponse(response);
  },

  async removeThumbnail(speciesId) {
<<<<<<< Updated upstream
    const response = await fetch(
      `${API_BASE_URL}/species/${speciesId}/remove-thumbnail`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
    );
    return await response.json();
=======
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}/remove-thumbnail`, {
      method: "PUT", headers: getHeaders(),
    });
    return checkResponse(response);
>>>>>>> Stashed changes
  },

  // ==========================
  // USER / AUTH ENDPOINTS
  // ==========================
  async login(usernameVal, passwordVal) {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ usernameOrEmail: usernameVal, password: passwordVal }),
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || "Login failed");
    }
    const data = await response.json();
    localStorage.setItem("jwt", data.token);
    return data.user;
  },

<<<<<<< Updated upstream
=======
  async logout() {
    localStorage.removeItem("jwt");
  },

>>>>>>> Stashed changes
  async createAccount(userData) {
    const response = await fetch(`${API_BASE_URL}/user/create-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        utype: "STUDENT",
      }),
    });
    return checkResponse(response);
  },

  async adminCreateAccount(userData) {
    const response = await fetch(`${API_BASE_URL}/user/admin/create-account`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return checkResponse(response);
  },

  async getStudentDashboard(email) {
<<<<<<< Updated upstream
    const response = await fetch(
      `${API_BASE_URL}/user/dashboard?email=${email}`,
      { headers: { Accept: "application/json" } },
    );
    return await response.json();
=======
    const response = await fetch(`${API_BASE_URL}/user/dashboard?email=${email}`, { headers: getHeaders() });
    return checkResponse(response);
>>>>>>> Stashed changes
  },

  async getAllUsers() {
    try {
<<<<<<< Updated upstream
      const response = await fetch(`${API_BASE_URL}/user/all`, {
        headers: { Accept: "application/json" },
      });
=======
      const response = await fetch(`${API_BASE_URL}/user/all`, { headers: getHeaders() });
>>>>>>> Stashed changes
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  async deleteUser(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
<<<<<<< Updated upstream
      method: "DELETE",
      headers: { Accept: "application/json" },
=======
      method: "DELETE", headers: getHeaders(),
>>>>>>> Stashed changes
    });
    return checkResponse(response);
  },

  async updateUsername(userId, newUsername) {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/update-username?newUsername=${newUsername}`,
<<<<<<< Updated upstream
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
=======
      { method: "PUT", headers: getHeaders() }
>>>>>>> Stashed changes
    );
    return checkResponse(response);
  },

  async updateEmail(userId, newEmail) {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/update-email?newEmail=${newEmail}`,
<<<<<<< Updated upstream
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
=======
      { method: "PUT", headers: getHeaders() }
>>>>>>> Stashed changes
    );
    return checkResponse(response);
  },

  async makeAdmin(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/make-admin`, {
<<<<<<< Updated upstream
      method: "PUT",
      headers: { Accept: "application/json" },
=======
      method: "PUT", headers: getHeaders(),
>>>>>>> Stashed changes
    });
    return checkResponse(response);
  },

  async makeStudent(userId) {
<<<<<<< Updated upstream
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/make-student`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
    );
    return await response.json();
=======
    const response = await fetch(`${API_BASE_URL}/user/${userId}/make-student`, {
      method: "PUT", headers: getHeaders(),
    });
    return checkResponse(response);
>>>>>>> Stashed changes
  },

  async activateUser(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/activate`, {
<<<<<<< Updated upstream
      method: "PUT",
      headers: { Accept: "application/json" },
=======
      method: "PUT", headers: getHeaders(),
>>>>>>> Stashed changes
    });
    return checkResponse(response);
  },

  async deactivateUser(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/deactivate`, {
<<<<<<< Updated upstream
      method: "PUT",
      headers: { Accept: "application/json" },
=======
      method: "PUT", headers: getHeaders(),
>>>>>>> Stashed changes
    });
    return checkResponse(response);
  },

  // ==========================
  // API KEY ENDPOINTS
  // ==========================
  async getAllApiKeys() {
    try {
<<<<<<< Updated upstream
      const response = await fetch(`${API_BASE_URL}/api-key/all`, {
        headers: { Accept: "application/json" },
      });
=======
      const response = await fetch(`${API_BASE_URL}/api-key/all`, { headers: getHeaders() });
>>>>>>> Stashed changes
      return await response.json();
    } catch (error) {
      console.error("Error fetching API keys:", error);
      return [];
    }
  },

  async getActiveApiKeys() {
<<<<<<< Updated upstream
    const response = await fetch(`${API_BASE_URL}/api-key/active`, {
      headers: { Accept: "application/json" },
    });
    return await response.json();
=======
    const response = await fetch(`${API_BASE_URL}/api-key/active`, { headers: getHeaders() });
    return checkResponse(response);
>>>>>>> Stashed changes
  },

  async generateApiKey(data) {
    const response = await fetch(`${API_BASE_URL}/api-key/keygen`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        teamName: data.teamName,
        projectName: data.projectName,
        semester: data.semester,
      }),
    });
    return checkResponse(response);
  },

  async deactivateApiKey(keyId) {
<<<<<<< Updated upstream
    const response = await fetch(
      `${API_BASE_URL}/api-key/${keyId}/deactivate`,
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
    );
    return await response.json();
=======
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}/deactivate`, {
      method: "PUT", headers: getHeaders(),
    });
    return checkResponse(response);
>>>>>>> Stashed changes
  },

  async activateApiKey(keyId) {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}/activate`, {
<<<<<<< Updated upstream
      method: "PUT",
      headers: { Accept: "application/json" },
=======
      method: "PUT", headers: getHeaders(),
>>>>>>> Stashed changes
    });
    return checkResponse(response);
  },

  async extendApiKey(keyId, months) {
    const response = await fetch(
      `${API_BASE_URL}/api-key/${keyId}/extra-time?months=${months}`,
<<<<<<< Updated upstream
      {
        method: "PUT",
        headers: { Accept: "application/json" },
      },
=======
      { method: "PUT", headers: getHeaders() }
>>>>>>> Stashed changes
    );
    return checkResponse(response);
  },

  async deleteApiKey(keyId) {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}`, {
<<<<<<< Updated upstream
      method: "DELETE",
      headers: { Accept: "application/json" },
=======
      method: "DELETE", headers: getHeaders(),
>>>>>>> Stashed changes
    });
    return checkResponse(response);
  },

  // ==========================
  // TEAM ENDPOINTS
  // ==========================
  async createTeam(data) {
    const response = await fetch(`${API_BASE_URL}/teams/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return checkResponse(response);
  },

  async getAllTeams() {
<<<<<<< Updated upstream
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
=======
    const response = await fetch(`${API_BASE_URL}/teams/all`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async getTeamById(teamId) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async getUnassignedStudents() {
    const response = await fetch(`${API_BASE_URL}/teams/unassigned-students`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async getTeamMembers(teamId) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, { headers: getHeaders() });
    return checkResponse(response);
>>>>>>> Stashed changes
  },

  async addTeamMember(teamId, userId) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/add-member`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ userId: parseInt(userId) }),
    });
    return checkResponse(response);
  },

  async removeTeamMember(teamId, userId) {
<<<<<<< Updated upstream
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
=======
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/remove-member`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ userId: parseInt(userId) }),
    });
    return checkResponse(response);
>>>>>>> Stashed changes
  },

  async updateTeam(teamId, data) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/update`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return checkResponse(response);
  },

  async deleteTeam(teamId) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
<<<<<<< Updated upstream
      method: "DELETE",
      headers: { Accept: "application/json" },
=======
      method: "DELETE", headers: getHeaders(),
>>>>>>> Stashed changes
    });
    return checkResponse(response);
  },

  // ==========================
  // IMAGE ENDPOINTS
  // ==========================
  async uploadImage(formData) {
    // Note: Do not set Content-Type for FormData, the browser sets it to multipart/form-data automatically
    const response = await fetch(`${API_BASE_URL}/images/admin/upload`, {
      method: "POST",
      headers: getAuthOnlyHeaders(),
      body: formData,
    });
    return checkResponse(response);
  },

<<<<<<< Updated upstream
  async getAllTags() {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      headers: { Accept: "application/json" },
=======
  async getImagesBySpecies(speciesId) {
    const response = await fetch(`${API_BASE_URL}/images/species/${speciesId}`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async deleteImage(id) {
    const response = await fetch(`${API_BASE_URL}/images/admin/${id}`, {
      method: "DELETE", headers: getHeaders(),
>>>>>>> Stashed changes
    });
    return checkResponse(response);
  },

  async updateImageDescription(imageId, description, nathansNotes) {
    const params = new URLSearchParams();
    if (description) params.append("description", description);
    if (nathansNotes) params.append("nathansNotes", nathansNotes);
    const response = await fetch(
      `${API_BASE_URL}/images/admin/${imageId}/description?${params.toString()}`,
      { method: "PATCH", headers: getHeaders() }
    );
    return checkResponse(response);
  },

  async addTagToImage(tagId, imageId) {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}/images/${imageId}`, {
      method: "POST", headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async removeTagFromImage(tagId, imageId) {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}/images/${imageId}`, {
      method: "DELETE", headers: getHeaders(),
    });
    return checkResponse(response);
  },

  // ==========================
  // TAG ENDPOINTS
  // ==========================
  async getAllTags() {
    const response = await fetch(`${API_BASE_URL}/tags`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async createTag(tagData) {
    const response = await fetch(`${API_BASE_URL}/tags/admin`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(tagData),
    });
    return checkResponse(response);
  },

  async deleteTag(tagId) {
    const response = await fetch(`${API_BASE_URL}/tags/admin/${tagId}`, {
<<<<<<< Updated upstream
      method: "DELETE",
      headers: { Accept: "application/json" },
=======
      method: "DELETE", headers: getHeaders(),
>>>>>>> Stashed changes
    });
    return checkResponse(response);
  },

  async updateTag(tagId, tagData) {
    const response = await fetch(`${API_BASE_URL}/tags/admin/${tagId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(tagData),
    });
    return checkResponse(response);
  },

  async filterImagesByTags(tagIds) {
<<<<<<< Updated upstream
    const queryString = tagIds.map((id) => `tagIds=${id}`).join("&");
    const response = await fetch(
      `${API_BASE_URL}/images/filter?${queryString}`,
      { headers: { Accept: "application/json" } },
    );
    return await response.json();
=======
    const queryString = tagIds.map((id) => "tagIds=" + id).join("&");
    const response = await fetch(`${API_BASE_URL}/images/filter?${queryString}`, { headers: getHeaders() });
    return checkResponse(response);
>>>>>>> Stashed changes
  },
};
