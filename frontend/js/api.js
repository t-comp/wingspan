// js/api.js
export const ButterflyAPI = {
  async getAll() {
    // Future: return await (await fetch('/api/butterflies')).json();
    return JSON.parse(localStorage.getItem("butterflies")) || [];
  },

  async saveAll(data) {
    // Future: await fetch('/api/butterflies', { method: 'POST', body: JSON.stringify(data) });
    localStorage.setItem("butterflies", JSON.stringify(data));
  },
};
