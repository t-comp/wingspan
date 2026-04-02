const API_BASE_URL: string = "http://159.203.134.226:8080";

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = localStorage.getItem("jwt");
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

function getAuthOnlyHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = localStorage.getItem("jwt");
  if (token) headers["Authorization"] = "Bearer " + token;
  return headers;
}

async function checkResponse(response: Response): Promise<any> {
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
  async getAll(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/species/all`, { headers: getHeaders() });
      return await response.json();
    } catch (error) {
      console.error("Error fetching species. Is the server running?", error);
      return [];
    }
  },

  async getSpeciesById(speciesId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async create(data: Record<string, any>): Promise<any> {
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

  async updateSpecies(speciesId: string | number, data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}/update`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return checkResponse(response);
  },

  async delete(speciesId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async filterSpecies(orderName?: string, family?: string, genus?: string): Promise<any> {
    const params = new URLSearchParams();
    if (orderName) params.append("orderName", orderName);
    if (family) params.append("family", family);
    if (genus) params.append("genus", genus);
    const response = await fetch(`${API_BASE_URL}/species/filter?${params.toString()}`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async getFilterOptions(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/species/filter-options`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async setThumbnail(speciesId: string | number, imageId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}/set-thumbnail?imageId=${imageId}`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async removeThumbnail(speciesId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/species/${speciesId}/remove-thumbnail`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async login(usernameVal: string, passwordVal: string): Promise<any> {
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

  async logout(): Promise<void> {
    localStorage.removeItem("jwt");
  },

  async createAccount(userData: Record<string, any>): Promise<any> {
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

  async adminCreateAccount(userData: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/admin/create-account`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return checkResponse(response);
  },

  async getStudentDashboard(email: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/dashboard?email=${email}`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async getAllUsers(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/all`, { headers: getHeaders() });
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  async deleteUser(userId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async updateUsername(userId: string | number, newUsername: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/update-username?newUsername=${newUsername}`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async updateEmail(userId: string | number, newEmail: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/update-email?newEmail=${newEmail}`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async resetPassword(email: string, newPassword: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/user/reset-password?email=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(newPassword)}`,
      { method: "PUT", headers: getHeaders() }
    );
    return checkResponse(response);
  },

  async makeAdmin(userId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/make-admin`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async makeStudent(userId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/make-student`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async activateUser(userId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/activate`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async deactivateUser(userId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/deactivate`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async getAllApiKeys(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api-key/all`, { headers: getHeaders() });
      return await response.json();
    } catch (error) {
      console.error("Error fetching API keys:", error);
      return [];
    }
  },

  async getActiveApiKeys(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api-key/active`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async generateApiKey(data: Record<string, any>): Promise<any> {
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

  async deactivateApiKey(keyId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}/deactivate`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async activateApiKey(keyId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}/activate`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async extendApiKey(keyId: string | number, months: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}/extra-time?months=${months}`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async deleteApiKey(keyId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api-key/${keyId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async createTeam(data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return checkResponse(response);
  },

  async getAllTeams(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/all`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async getTeamById(teamId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async getUnassignedStudents(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/unassigned-students`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async getTeamMembers(teamId: string | number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async addTeamMember(teamId: string | number, userId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/add-member`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ userId: parseInt(userId.toString()) }),
    });
    return checkResponse(response);
  },

  async removeTeamMember(teamId: string | number, userId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/remove-member`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ userId: parseInt(userId.toString()) }),
    });
    return checkResponse(response);
  },

  async updateTeam(teamId: string | number, data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/update`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return checkResponse(response);
  },

  async deleteTeam(teamId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async uploadImage(formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/images/admin/upload`, {
      method: "POST",
      headers: getAuthOnlyHeaders(),
      body: formData,
    });
    return checkResponse(response);
  },

  async getImagesBySpecies(speciesId: string | number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/images/species/${speciesId}`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async deleteImage(id: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/images/admin/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async updateImageDescription(imageId: string | number, description: string, nathansNotes: string): Promise<any> {
    const params = new URLSearchParams();
    if (description) params.append("description", description);
    if (nathansNotes) params.append("nathansNotes", nathansNotes);
    const response = await fetch(`${API_BASE_URL}/images/admin/${imageId}/description?${params.toString()}`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async updateImageDetails(imageId: string | number, data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/images/admin/${imageId}`, {
      method: "PATCH",
      headers: { ...getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        description: data.description || "",
        nathansNotes: data.nathansNotes || "",
        tagIds: data.tagIds || [],
      }),
    });
    return checkResponse(response);
  },

  async addTagToImage(tagId: string | number, imageId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}/images/${imageId}`, {
      method: "POST",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async removeTagFromImage(tagId: string | number, imageId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}/images/${imageId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async getAllTags(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tags`, { headers: getHeaders() });
    return checkResponse(response);
  },

  async createTag(tagData: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tags/admin`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(tagData),
    });
    return checkResponse(response);
  },

  async deleteTag(tagId: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tags/admin/${tagId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return checkResponse(response);
  },

  async updateTag(tagId: string | number, tagData: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tags/admin/${tagId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(tagData),
    });
    return checkResponse(response);
  },

  async filterImagesByTags(tagIds: (string | number)[]): Promise<any> {
    const queryString = tagIds.map((id) => "tagIds=" + id).join("&");
    const response = await fetch(`${API_BASE_URL}/images/filter?${queryString}`, { headers: getHeaders() });
    return checkResponse(response);
  },
};