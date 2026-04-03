// js/api.js
const API_BASE_URL = "http://159.203.134.226:8080";

// const API_BASE_URL = "http://localhost:8080";

function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = localStorage.getItem("jwt");
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

function getAuthOnlyHeaders() {
  const headers = { Accept: "application/json" };
  const token = localStorage.getItem("jwt");
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

async function checkResponse(response) {
  const text = await response.text();
  if (!response.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text).message || text;
    } catch {}
    throw new Error(msg || "Request failed with status " + response.status);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const ButterflyAPI = {
  // ==========================
  // SPECIES ENDPOINTS
  // ==========================
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/species/all`, {
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error("Error fetching species. Is the server running?", error);
      return [];
    }
  },

  async getSpeciesById(speciesId) {
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}`, {
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/species/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: data.name,
        scientificName: data.scientificName,
        description: data.description,
        orderName: data.orderName,
        family: data.family,
        genus: data.genus,
      }),
    });
    return checkResponse(response);
  },

  async updateSpecies(speciesId, data) {
    const response = await fetch(
      `${API_BASE_URL}/species/${speciesId}/update`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    return checkResponse(response);
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
    const response = await fetch(
      `${API_BASE_URL}/species/filter?${params.toString()}`,
      { headers: getHeaders() },
    );
    return checkResponse(response);
  },

  async getFilterOptions() {
    const response = await fetch(`${API_BASE_URL}/species/filter-options`, {
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async setThumbnail(speciesId, imageId) {
    const response = await fetch(
      `${API_BASE_URL}/species/${speciesId}/set-thumbnail?imageId=${imageId}`,
      { method: "PUT", headers: getHeaders() },
    );
    return checkResponse(response);
  },

  async removeThumbnail(speciesId) {
    const response = await fetch(
      `${API_BASE_URL}/species/${speciesId}/remove-thumbnail`,
      {
        method: "PUT",
        headers: getHeaders(),
      },
    );
    return checkResponse(response);
  },

  // ==========================
  // USER / AUTH ENDPOINTS
  // ==========================
  async login(usernameVal, passwordVal) {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        usernameOrEmail: usernameVal,
        password: passwordVal,
      }),
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || "Login failed");
    }
    const data = await response.json();
    localStorage.setItem("jwt", data.token);
    return data.user;
  },

  async logout() {
    localStorage.removeItem("jwt");
  },

  async createAccount(userData) {
    const response = await fetch(`${API_BASE_URL}/user/create-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
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
    const response = await fetch(
      `${API_BASE_URL}/user/dashboard?email=${email}`,
      { headers: getHeaders() },
    );
    return checkResponse(response);
  },

  async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/user/all`, {
        headers: getHeaders(),
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
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async updateUsername(userId, newUsername) {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/update-username?newUsername=${newUsername}`,
      { method: "PUT", headers: getHeaders() },
    );
    return checkResponse(response);
  },

  async updateEmail(userId, newEmail) {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/update-email?newEmail=${newEmail}`,
      { method: "PUT", headers: getHeaders() },
    );
    return checkResponse(response);
  },

  async resetPassword(email, newPassword) {
    const response = await fetch(
      `${API_BASE_URL}/user/reset-password?email=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(newPassword)}`,
      { method: "PUT", headers: getHeaders() },
    );
    return checkResponse(response);
  },

  async makeAdmin(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/make-admin`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async makeStudent(userId) {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/make-student`,
      {
        method: "PUT",
        headers: getHeaders(),
      },
    );
    return checkResponse(response);
  },

  async activateUser(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/activate`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async deactivateUser(userId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/deactivate`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  // ==========================
  // API KEY ENDPOINTS
  // ==========================
  async getAllApiKeys() {
    try {
      const response = await fetch(`${API_BASE_URL}/api-key/all`, {
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error("Error fetching API keys:", error);
      return [];
    }
  },

  async getActiveApiKeys() {
    const response = await fetch(`${API_BASE_URL}/api-key/active`, {
      headers: getHeaders(),
    });
    return checkResponse(response);
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
    const response = await fetch(
      `${API_BASE_URL}/api-key/${keyId}/deactivate`,
      {
        method: "PUT",
        headers: getHeaders(),
      },
    );
    return checkResponse(response);
  },

  async activateApiKey(keyId) {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}/activate`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async extendApiKey(keyId, months) {
    const response = await fetch(
      `${API_BASE_URL}/api-key/${keyId}/extra-time?months=${months}`,
      { method: "PUT", headers: getHeaders() },
    );
    return checkResponse(response);
  },

  async deleteApiKey(keyId) {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}`, {
      method: "DELETE",
      headers: getHeaders(),
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
    const response = await fetch(`${API_BASE_URL}/teams/all`, {
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async getTeamById(teamId) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async getUnassignedStudents() {
    const response = await fetch(`${API_BASE_URL}/teams/unassigned-students`, {
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async getTeamMembers(teamId) {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
      headers: getHeaders(),
    });
    return checkResponse(response);
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
    const response = await fetch(
      `${API_BASE_URL}/teams/${teamId}/remove-member`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ userId: parseInt(userId) }),
      },
    );
    return checkResponse(response);
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
      method: "DELETE",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  // ==========================
  // IMAGE ENDPOINTS
  // ==========================
  async uploadImage(formData) {
    const response = await fetch(`${API_BASE_URL}/images/admin/upload`, {
      method: "POST",
      headers: getAuthOnlyHeaders(),
      body: formData,
    });
    return checkResponse(response);
  },

  async getImagesBySpecies(speciesId) {
    const response = await fetch(
      `${API_BASE_URL}/images/species/${speciesId}`,
      { headers: getHeaders() },
    );
    return checkResponse(response);
  },

  async deleteImage(id) {
    const response = await fetch(`${API_BASE_URL}/images/admin/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async updateImageDescription(imageId, description, nathansNotes) {
    const params = new URLSearchParams();
    if (description) params.append("description", description);
    if (nathansNotes) params.append("nathansNotes", nathansNotes);
    const response = await fetch(
      `${API_BASE_URL}/images/admin/${imageId}/description?${params.toString()}`,
      { method: "PATCH", headers: getHeaders() },
    );
    return checkResponse(response);
  },

  async updateImageDetails(imageId, data) {
    const response = await fetch(`${API_BASE_URL}/images/admin/${imageId}`, {
        method: "PATCH",
        headers: {
            ...getHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            description: data.description || "",
            nathansNotes: data.nathansNotes || "",
            //life_cycle: data.life_cycle || "",
            tagIds: data.tagIds || [] 
        })
    });
    return checkResponse(response);
},

  async addTagToImage(tagId, imageId) {
    const response = await fetch(
      `${API_BASE_URL}/tags/${tagId}/images/${imageId}`,
      {
        method: "POST",
        headers: getHeaders(),
      },
    );
    return checkResponse(response);
  },

  async removeTagFromImage(tagId, imageId) {
    const response = await fetch(
      `${API_BASE_URL}/tags/${tagId}/images/${imageId}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      },
    );
    return checkResponse(response);
  },

  // ==========================
  // TAG ENDPOINTS
  // ==========================
  async getAllTags() {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      headers: getHeaders(),
    });
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
      method: "DELETE",
      headers: getHeaders(),
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
    const queryString = tagIds.map((id) => "tagIds=" + id).join("&");
    const response = await fetch(
      `${API_BASE_URL}/images/filter?${queryString}`,
      { headers: getHeaders() },
    );
    return checkResponse(response);
  },
};
