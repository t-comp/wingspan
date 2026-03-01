// js/api.js
const API_BASE_URL = "http://localhost:8080";

//I added this so we can have data to test while waiting for backend
//change to false whenever we are ready
const USE_MOCK = true;

const mockSpecies = [
  {
    id: 1,
    name: "Monarch",
    scientific: "Danaus plexippus",
    description: "A well-known migratory butterfly species.",
    image: "assets/img/placeholder1.jpg", 
    additionalImages: [
      "assets/img/species-1a.jpg",
      "assets/img/species-1b.jpg",
      "assets/img/species-1c.jpg"
    ],
    lifecycle: "Adult",
    sex: "Female",
    tags: "Orange, Migratory",
    imgSize: "Unknown",
    apiEndpoint: "N/A",
  },
  {
    id: 2,
    name: "Swallowtail",
    scientific: "Papilio machaon",
    description: "Large yellow butterfly with black stripes.",
    image: "assets/img/placeholder2.jpg", 
    additionalImages: [
      "assets/img/placeholder2.jpg",
      "assets/img/placeholder2.jpg"
    ],
    lifecycle: "Adult",
    sex: "Male",
    tags: "Yellow, Large",
    imgSize: "Unknown",
    apiEndpoint: "N/A",
  },
];

export const ButterflyAPI = {
  // --- SPECIES ENDPOINTS ---
  async getAll() {
    if (USE_MOCK) {
      console.log("Using MOCK species data");
      return mockSpecies;
    }

    const response = await fetch(`${API_BASE_URL}/species/all`);
    return await response.json();
  },

  async create(data) {
    if (USE_MOCK) {
      console.log("Mock create:", data);
      return { success: true };
    }

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
    if (USE_MOCK) {
      console.log("Mock delete:", speciesId);
      return { success: true };
    }

    return await fetch(`${API_BASE_URL}/species/${speciesId}`, {
      method: "DELETE",
    });
  },

  // --- IMAGE ENDPOINTS ---
  async uploadImage(formData) {
    if (USE_MOCK) {
      console.log("Mock image upload");
      return { imageUrl: "assets/placeholder1.jpg" };
    }

    const response = await fetch(`${API_BASE_URL}/images/admin/upload`, {
      //
      method: "POST",
      body: formData, // Body contains file, lifecycle_stage, etc.
    });
    return await response.json();
  },

  // --- USER/AUTH ENDPOINTS ---
  async login(credentials) {
    if (USE_MOCK) {
      console.log("Mock login", credentials);
      return {
        username: credentials.usernameOrEmail,
        uType: "STUDENT",
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      //
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return await response.json();
  },

  async createAccount(userData) {
    if (USE_MOCK) {
      console.log("Mock account creation");
      return { success: true };
    }
    
    const response = await fetch(`${API_BASE_URL}/user/create-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData), // Needs: username, email, password, uType
    });
    return await response.json();
  },
};
