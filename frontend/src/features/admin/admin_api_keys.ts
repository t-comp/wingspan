// src/features/admin/admin_api_keys.ts

/**
 * This file manages the generation, extension, and deletion of API keys for student teams.
 * It handles the form submissions and modal interactions required to provide and revoke
 * system access for different Senior Design projects.
 */

import { ButterflyAPI } from "../../core/api.js";

// pass refreshAdminData as a callback so the UI updates after making changes
export function initAdminApiKeys(refreshAdminData: () => Promise<void>) {
  const adminGenerateKeyForm = document.getElementById("adminGenerateKeyForm");

  if (adminGenerateKeyForm) {
    adminGenerateKeyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await ButterflyAPI.generateApiKey({
        teamName: (document.getElementById("newTeamName") as HTMLInputElement)
          .value,
        projectName: (
          document.getElementById("newProjectName") as HTMLInputElement
        ).value,
        semester: (document.getElementById("newSemester") as HTMLInputElement)
          .value,
      });
      await refreshAdminData();
      (e.target as HTMLFormElement).reset();
      const modalElem = document.getElementById("adminGenerateKeyModal");
      if (modalElem) bootstrap.Modal.getInstance(modalElem)?.hide();
    });
  }

  const adminExtendKeyForm = document.getElementById("adminExtendKeyForm");
  if (adminExtendKeyForm) {
    adminExtendKeyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const keyId = (document.getElementById("extendKeyId") as HTMLInputElement)
        .value;

      // make this to be a strict positive integer
      const monthsValue = (
        document.getElementById("extendMonths") as HTMLInputElement
      ).value;
      const months = Math.abs(parseInt(monthsValue, 10));

      await ButterflyAPI.extendApiKey(keyId, months);
      await refreshAdminData();
      (e.target as HTMLFormElement).reset();
      const modalElem = document.getElementById("adminExtendKeyModal");
      if (modalElem) bootstrap.Modal.getInstance(modalElem)?.hide();
    });
  }

  // THE TOGGLE (Power Button)
  (window as any).toggleApiKeyStatus = async (
    keyId: string,
    isActive: boolean,
  ) => {
    try {
      if (isActive) {
        await ButterflyAPI.deactivateApiKey(keyId);
      } else {
        await ButterflyAPI.activateApiKey(keyId);
      }
      await refreshAdminData(); // Refresh the UI to show the new badge!
    } catch (error: any) {
      alert("Failed to change key status: " + error.message);
    }
  };

  // THE REGENERATE (Sync Button)
  (window as any).regenerateTeamKey = async (
    teamName: string,
    projectName: string,
    semester: string,
  ) => {
    if (
      confirm("Generate a new key? The old one will be completely destroyed!")
    ) {
      // Wipe out any existing keys for this team first
      try {
        await ButterflyAPI.deleteApiKeyByTeam(teamName);
      } catch (e) {
        console.log("Cleanup before regen failed:", e);
      }

      // Generate the new key
      try {
        await ButterflyAPI.generateApiKey({ teamName, projectName, semester });
        await refreshAdminData(); // Refresh to show the new key characters
      } catch (error: any) {
        alert("Failed to regenerate key: " + error.message);
      }
    }
  };

  // THE DELETE (Trash Can Button)
  (window as any).deleteApiKey = async (keyId: string) => {
    if (confirm("Are you sure you want to permanently delete this API key?")) {
      try {
        await ButterflyAPI.deleteApiKey(keyId);
        await refreshAdminData(); // Refresh the UI to remove the key from the screen
      } catch (error: any) {
        alert("Failed to delete key: " + error.message);
      }
    }
  };

  (window as any).openExtendModal = (keyId: string | number) => {
    const extendInput = document.getElementById("extendKeyId");
    if (extendInput) (extendInput as HTMLInputElement).value = String(keyId);
    const modalElem = document.getElementById("adminExtendKeyModal");
    if (modalElem) new bootstrap.Modal(modalElem).show();
  };
}
