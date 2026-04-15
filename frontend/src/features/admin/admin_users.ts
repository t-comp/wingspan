// src/features/admin/admin_users.ts

/**
 * This module is responsible for the user management table in the admin dashboard.
 * It includes the functionality to search for users, toggle their roles between student and admin,
 * and edit their account details or reset passwords.
 */

import { ButterflyAPI } from "../../core/api.js";
import { AppState } from "../../core/state.js";

export function renderAllUsersTable(usersList: any[]) {
  const tbody = document.getElementById("allUsersTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  usersList.forEach((u) => {
    const tr = document.createElement("tr");
    const currentRole = u.uType || u.userType || u.utype;
    const badgeClass = currentRole === "ADMIN" ? "bg-danger" : "bg-primary";
    const teamName =
      AppState.globalUserTeamMap[u.userId] ||
      '<span class="text-muted fst-italic">Unassigned</span>';

    tr.innerHTML = `
        <td><span class="fw-bold" style="font-size: 0.9rem;">${u.username}</span></td>
        <td class="text-muted text-truncate" style="font-size: 0.85rem; max-width: 200px;" title="${u.email}">${u.email}</td>
        <td><span class="badge ${badgeClass}" style="font-size: 0.65rem;">${currentRole}</span></td>
        <td><span class="fw-bold text-secondary text-truncate d-inline-block" style="font-size: 0.85rem; max-width: 150px;" title="${teamName.replace(/<[^>]*>?/gm, "")}">${teamName}</span></td>
        <td class="text-end">
            <div class="d-flex justify-content-end gap-1">
                <div class="action-tooltip-container">
                    <button class="btn-icon-only" onclick="window.openEditUserModal('${u.userId}', '${u.username}', '${u.email}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <span class="action-tooltip">Edit User</span>
                </div>
                <div class="action-tooltip-container">
                    <button class="btn-icon-only" onclick="window.toggleUserRole('${u.userId}', '${currentRole}')">
                        <i class="fas fa-user-cog"></i>
                    </button>
                    <span class="action-tooltip">Toggle Role</span>
                </div>
                <div class="action-tooltip-container">
                    <button class="btn-icon-only delete-btn" onclick="window.deleteSystemUser('${u.userId}')">
                        <i class="fas fa-trash text-danger"></i>
                    </button>
                    <span class="action-tooltip">Delete User</span>
                </div>
            </div>
        </td>`;

    tbody.appendChild(tr);
  });
}

export function initAdminUsers(refreshAdminData: () => Promise<void>) {
  (window as any).deleteSystemUser = async (userId: string) => {
    if (confirm("Delete this user permanently?")) {
      await ButterflyAPI.deleteUser(userId);
      await refreshAdminData();
    }
  };

  (window as any).toggleUserRole = async (
    userId: string,
    currentRole: string,
  ) => {
    const targetUser = AppState.allCachedUsers.find(
      (u: any) => u.userId.toString() === userId.toString(),
    ) as any;

    if (currentRole === "ADMIN") {
      const adminCount = AppState.allCachedUsers.filter(
        (u: any) => (u.uType || u.userType || u.utype) === "ADMIN",
      ).length;

      if (adminCount <= 1) {
        return alert(
          "Action Denied: The system must always have at least one administrator.",
        );
      }

      if (targetUser && targetUser.email === AppState.userEmail) {
        const proceed = confirm(
          "WARNING: You are about to remove your own admin privileges! You will be logged out immediately if you proceed. Do you want to continue?",
        );
        if (!proceed) return;
        try {
          await ButterflyAPI.makeStudent(userId);
          alert("Your admin privileges have been revoked. Logging out...");
          location.reload();
          return;
        } catch (error) {
          return alert("Failed to change role.");
        }
      }
      await ButterflyAPI.makeStudent(userId);
    } else {
      await ButterflyAPI.makeAdmin(userId);
    }
    await refreshAdminData();
  };

  (window as any).openEditUserModal = (
    userId: string,
    currentUsername: string,
    currentEmail: string,
  ) => {
    (document.getElementById("editUserId") as HTMLInputElement).value = userId;
    (document.getElementById("editUsername") as HTMLInputElement).value =
      currentUsername;
    (document.getElementById("editEmail") as HTMLInputElement).value =
      currentEmail;
    (document.getElementById("editPassword") as HTMLInputElement).value = "";
    new bootstrap.Modal(document.getElementById("adminEditUserModal")).show();
  };

  const adminUserSearchEl = document.getElementById(
    "adminUserSearch",
  ) as HTMLInputElement | null;
  if (adminUserSearchEl) {
    const newSearchBtn = adminUserSearchEl.cloneNode(true) as HTMLInputElement;
    adminUserSearchEl.parentNode?.replaceChild(newSearchBtn, adminUserSearchEl);

    newSearchBtn.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      if (AppState.allCachedUsers) {
        const filtered = AppState.allCachedUsers.filter((u: any) =>
          u.username.toLowerCase().includes(query),
        );
        renderAllUsersTable(filtered);
      }
    });
  }

  const adminAddUserForm = document.getElementById("adminAddUserForm");
  if (adminAddUserForm) {
    adminAddUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameVal = (
        document.getElementById("adminNewUsername") as HTMLInputElement
      ).value;
      const emailVal = (
        document.getElementById("adminNewEmail") as HTMLInputElement
      ).value;
      const passVal = (
        document.getElementById("adminNewPassword") as HTMLInputElement
      ).value;
      const roleVal = (
        document.getElementById("adminNewRole") as HTMLInputElement
      ).value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal))
        return alert("Please enter a valid email address.");
      if (usernameVal.length < 5)
        return alert("Username must be at least 5 characters long.");
      if (passVal.length < 7)
        return alert("Password must be at least 7 characters long.");

      try {
        const allUsers = await ButterflyAPI.getAllUsers();
        if (
          allUsers.some(
            (u: any) => u.username.toLowerCase() === usernameVal.toLowerCase(),
          )
        ) {
          return alert("This username already exists.");
        }
        await ButterflyAPI.adminCreateAccount({
          username: usernameVal,
          email: emailVal,
          password: passVal,
          utype: roleVal,
        });
        await refreshAdminData();
        (e.target as HTMLFormElement).reset();
        bootstrap.Modal.getInstance(
          document.getElementById("adminAddUserModal"),
        )?.hide();
        alert("User successfully created!");
      } catch (error: any) {
        alert("Could not create user: " + error.message);
      }
    });
  }

  const adminEditUserForm = document.getElementById("adminEditUserForm");
  if (adminEditUserForm) {
    adminEditUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = (document.getElementById("editUserId") as HTMLInputElement)
        .value;
      const newUsername = (
        document.getElementById("editUsername") as HTMLInputElement
      ).value;
      const newEmail = (
        document.getElementById("editEmail") as HTMLInputElement
      ).value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail))
        return alert("Please enter a valid email address.");
      if (newUsername.length < 5)
        return alert("Username must be at least 5 characters long.");

      try {
        const allUsers = await ButterflyAPI.getAllUsers();
        if (
          allUsers.some(
            (u: any) =>
              u.username.toLowerCase() === newUsername.toLowerCase() &&
              u.userId.toString() !== userId.toString(),
          )
        ) {
          return alert("This username already exists.");
        }
        await ButterflyAPI.updateUsername(userId, newUsername);
        await ButterflyAPI.updateEmail(userId, newEmail);

        const newPassword = (
          document.getElementById("editPassword") as HTMLInputElement
        ).value.trim();
        if (newPassword !== "") {
          if (newPassword.length < 7)
            return alert("Password must be at least 7 characters long.");
          await ButterflyAPI.resetPassword(newEmail, newPassword);
        }
        await refreshAdminData();
        bootstrap.Modal.getInstance(
          document.getElementById("adminEditUserModal"),
        )?.hide();
        alert("User successfully updated!");
      } catch (error) {
        alert("Failed to update user.");
      }
    });
  }
}
