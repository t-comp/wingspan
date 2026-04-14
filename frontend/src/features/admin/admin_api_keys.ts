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

  (window as any).toggleApiKeyStatus = async (
    keyId: string,
    currentlyActive: boolean,
  ) => {
    if (currentlyActive) {
      await ButterflyAPI.deactivateApiKey(keyId);
    } else {
      await ButterflyAPI.activateApiKey(keyId);
    }
    await refreshAdminData();
  };

  (window as any).regenerateTeamKey = async (
    teamName: string,
    projectName: string,
    semester: string,
  ) => {
    if (
      confirm(
        "Regenerate the API key for " +
          teamName +
          "? The old key will stop working immediately.",
      )
    ) {
      try {
        await ButterflyAPI.generateApiKey({ teamName, projectName, semester });
        await refreshAdminData();
      } catch (err: any) {
        alert("Failed to regenerate key: " + err.message);
      }
    }
  };

  (window as any).deleteApiKey = async (keyId: string) => {
    if (
      confirm(
        "Delete this API key permanently? Students using it will lose access.",
      )
    ) {
      try {
        await ButterflyAPI.deleteApiKey(keyId);
        await refreshAdminData();
      } catch (err: any) {
        alert("Failed to delete key: " + err.message);
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
