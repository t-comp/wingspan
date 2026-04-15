// src/core/auth.ts

/**
 * This file handles the UI adjustments based on user authentication levels.
 * It provides functions to toggle the visibility of specific admin-only elements, like upload
 * and delete buttons, making sure students only see what they have access to.
 */

export const Auth = {
  enableAdminMode() {
    document.getElementById("uploadBtn")?.classList.remove("d-none");
    document.getElementById("deleteButterflyBtn")?.classList.remove("d-none");
  },
  enableStudentMode() {
    document.getElementById("uploadBtn")?.classList.add("d-none");
  },
};
