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

  // --- UI FIX: Push the footer up ---
  const teamView = document.getElementById("teamView");
  if (teamView) {
    (teamView as HTMLElement).style.minHeight = "auto";
  }

  // --- The "Floating Card" Design---
  const tableWrapper = tbody.closest(".table-responsive");
  if (tableWrapper) {
    (tableWrapper as HTMLElement).style.maxHeight = "calc(100vh - 180px)";
    (tableWrapper as HTMLElement).style.overflow = "auto";
    (tableWrapper as HTMLElement).style.borderRadius = "10px";
    // We drop the hard border completely...
    (tableWrapper as HTMLElement).style.border = "none";
    // ...and use a soft, elegant shadow to define the scrollable area
    (tableWrapper as HTMLElement).style.boxShadow =
      "0 4px 15px rgba(0, 0, 0, 0.05)";
  }

  // --- Standard rows inside ---
  const table = tbody.closest("table");
  if (table) {
    table.classList.remove("table-borderless"); // Bring back the normal thin lines between users
    (table as HTMLElement).style.minWidth = "850px";
    (table as HTMLElement).style.margin = "0";
    (table as HTMLElement).style.border = "none";
    (table as HTMLElement).style.borderColor = "#f1f1f1";
  }

  // --- header ---
  const thead = tbody.closest("table")?.querySelector("thead");
  if (thead) {
    thead.querySelectorAll("th").forEach((th) => {
      (th as HTMLElement).style.position = "sticky";
      (th as HTMLElement).style.top = "0";
      (th as HTMLElement).style.zIndex = "10";
      (th as HTMLElement).style.backgroundColor = "#ffffff";

      // Strip ALL standard borders because they glitch when scrolling
      (th as HTMLElement).style.border = "none";

      // Use an inset box-shadow to fake the bottom line so it sticks!
      (th as HTMLElement).style.boxShadow = "inset 0 -2px 0 #dee2e6";
      (th as HTMLElement).style.borderRadius = "0";
    });
  }

  usersList.forEach((u) => {
    const tr = document.createElement("tr");
    const currentRole = u.uType || u.userType || u.utype;
    const badgeClass = currentRole === "ADMIN" ? "bg-danger" : "bg-primary";
    const teamName =
      AppState.globalUserTeamMap[u.userId] ||
      '<span class="text-muted fst-italic">Unassigned</span>';

    // Safely grab the username, fallback to email if it doesn't exist
    const safeUsername =
      u.username && u.username !== "undefined"
        ? u.username
        : u.email || "this user";

    tr.innerHTML = `
        <td style="white-space: nowrap;"><span class="fw-bold" style="font-size: 0.9rem;">${safeUsername}</span></td>
        <td class="text-muted text-truncate" style="font-size: 0.85rem; max-width: 200px;" title="${u.email}">${u.email}</td>
        <td style="white-space: nowrap;"><span class="badge ${badgeClass}" style="font-size: 0.65rem;">${currentRole}</span></td>
        <td class="text-truncate" style="max-width: 150px;"><span class="fw-bold text-secondary d-inline-block" style="font-size: 0.85rem;" title="${teamName.replace(/<[^>]*>?/gm, "")}">${teamName}</span></td>
        <td class="text-end" style="white-space: nowrap; min-width: 160px;">
            <div class="d-flex justify-content-end gap-1 flex-nowrap">
                <div class="action-tooltip-container">
                    <button class="btn-icon-only" onclick="window.openEditUserModal('${u.userId}', '${safeUsername}', '${u.email}')">
                        <i class="fas fa-edit text-secondary"></i>
                    </button>
                    <span class="action-tooltip" style="right: 100%; top: 50%; bottom: auto; left: auto; transform: translateY(-50%); margin-right: 8px; white-space: nowrap;">Edit User</span>
                </div>
                <div class="action-tooltip-container">
                    <button class="btn-icon-only" onclick="window.toggleUserRole('${u.userId}', '${currentRole}')">
                        <i class="fas fa-user-cog text-secondary"></i>
                    </button>
                    <span class="action-tooltip" style="right: 100%; top: 50%; bottom: auto; left: auto; transform: translateY(-50%); margin-right: 8px; white-space: nowrap;">Toggle Role</span>
                </div>
                <div class="action-tooltip-container">
                    <button class="btn-icon-only delete-btn" onclick="window.deleteUser('${u.userId}', '${safeUsername}')">
                        <i class="fas fa-trash text-danger"></i>
                    </button>
                    <span class="action-tooltip" style="right: 100%; top: 50%; bottom: auto; left: auto; transform: translateY(-50%); margin-right: 8px; white-space: nowrap;">Delete User</span>
                </div>
            </div>
        </td>`;

    tbody.appendChild(tr);
  });
}

export function initAdminUsers(refreshAdminData: () => Promise<void>) {
  // --- DELETE USER LOGIC ---
  (window as any).deleteUser = async (userId: string, username: string) => {
    if (confirm(`Delete '${username}' permanently?`)) {
      try {
        await ButterflyAPI.deleteUser(userId);
        await refreshAdminData();
        // The requested success alert!
        alert(`The user "${username}" has been successfully deleted!`);
      } catch (error: any) {
        alert("Failed to delete user: " + error.message);
      }
    }
  };

  // --- TOGGLE USER ROLE LOGIC ---
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

  // --- OPEN EDIT USER MODAL ---
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

    const modal = document.getElementById("adminEditUserModal");
    if (modal) {
      // @ts-ignore
      new bootstrap.Modal(modal).show();
    }
  };

  // --- ADD USER FORM LOGIC (STRICT) ---
  const adminAddUserForm = document.getElementById("adminAddUserForm");
  if (adminAddUserForm) {
    adminAddUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameVal = (
        document.getElementById("adminNewUsername") as HTMLInputElement
      ).value.trim();
      const emailVal = (
        document.getElementById("adminNewEmail") as HTMLInputElement
      ).value.trim();
      const passVal = (
        document.getElementById("adminNewPassword") as HTMLInputElement
      ).value;
      const roleVal = (
        document.getElementById("adminNewRole") as HTMLSelectElement
      ).value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9_]+$/;

      if (!emailRegex.test(emailVal))
        return alert("Please enter a valid email address.");
      if (usernameVal.length < 5)
        return alert("Username must be at least 5 characters long.");
      if (!usernameRegex.test(usernameVal))
        return alert(
          "Username can only contain letters, numbers, and underscores (no spaces allowed).",
        );
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

        const modal = document.getElementById("adminAddUserModal");
        if (modal) {
          (document.activeElement as HTMLElement)?.blur();
          // @ts-ignore
          bootstrap.Modal.getInstance(modal)?.hide();
        }
        alert("User successfully created!");
      } catch (error: any) {
        alert("Could not create user: " + error.message);
      }
    });
  }

  // --- EDIT USER FORM LOGIC (STRICT) ---
  const adminEditUserForm = document.getElementById("adminEditUserForm");
  if (adminEditUserForm) {
    adminEditUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = (document.getElementById("editUserId") as HTMLInputElement)
        .value;
      const newUsername = (
        document.getElementById("editUsername") as HTMLInputElement
      ).value.trim();
      const newEmail = (
        document.getElementById("editEmail") as HTMLInputElement
      ).value.trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9_]+$/;

      if (!emailRegex.test(newEmail))
        return alert("Please enter a valid email address.");
      if (newUsername.length < 5)
        return alert("Username must be at least 5 characters long.");
      if (!usernameRegex.test(newUsername))
        return alert(
          "Username can only contain letters, numbers, and underscores (no spaces allowed).",
        );

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

        const modal = document.getElementById("adminEditUserModal");
        if (modal) {
          (document.activeElement as HTMLElement)?.blur();
          // @ts-ignore
          bootstrap.Modal.getInstance(modal)?.hide();
        }
        alert("User successfully updated!");
      } catch (error) {
        alert("Failed to update user.");
      }
    });
  }

  // --- SEARCH LOGIC ---
  const adminUserSearchEl = document.getElementById(
    "adminUserSearch",
  ) as HTMLInputElement | null;
  if (adminUserSearchEl) {
    const newSearchBtn = adminUserSearchEl.cloneNode(true) as HTMLInputElement;
    adminUserSearchEl.parentNode?.replaceChild(newSearchBtn, adminUserSearchEl);

    newSearchBtn.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      if (AppState.allCachedUsers) {
        const filtered = AppState.allCachedUsers.filter(
          (u: any) =>
            (u.username && u.username.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query)),
        );
        renderAllUsersTable(filtered);
      }
    });
  }
}
