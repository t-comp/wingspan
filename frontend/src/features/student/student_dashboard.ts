// src/features/student/student_dashboard.ts

/**
 * This file renders the specific dashboard view for non-admin users.
 * It fetches and displays the student's current team assignment, their teammates,
 * and the active API key they need to authenticate their project.
 */

import { ButterflyAPI } from "../../core/api.js";
import { AppState } from "../../core/state.js";

export async function loadStudentData(email: string) {
  if (!email) return;
  try {
    let myTeam: any = null;
    let myApiKey = "No active API Key found";
    let teamKeyFull: any = null;

    // Fetch user data from local storage for the unified dashboard
    const currentUserStr = localStorage.getItem("butterflyUser");
    let currentUser: any = {};
    if (currentUserStr) {
      try {
        currentUser = JSON.parse(currentUserStr);
      } catch (e) {}
    }
    const fName = currentUser.firstName || "";
    const lName = currentUser.lastName || "";
    const currentFullName =
      `${fName} ${lName}`.trim() || currentUser.username || email;

    // Manually find the user's team to ensure we get the right data
    const allTeams = await ButterflyAPI.getAllTeams();
    for (const t of allTeams) {
      const members = await ButterflyAPI.getTeamMembers(t.id);
      if (members.some((m: any) => m.email === email)) {
        myTeam = t;

        // Grab all keys and find the active one for this specific team
        const keys: any[] = await ButterflyAPI.getAllApiKeys();
        teamKeyFull = keys.find(
          (k: any) => k.teamName === t.name && k.active !== false,
        );
        if (teamKeyFull) {
          myApiKey = teamKeyFull.keyVal;
          AppState.studentApiKey = myApiKey;
        }
        break;
      }
    }

    const container = document.getElementById("studentTeamDynamicContent");
    if (!container) return;

    // We use if/else instead of returning early, so the code always reaches the button logic! ✨
    if (!myTeam) {
      container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-muted fw-bold mb-0">Student Dashboard</h2>
        </div>
        <div class="card shadow-sm border-0 bg-white overflow-hidden" style="border-radius: 15px;">
            <div class="row g-0">
<div class="col-md-4 p-4 d-flex flex-column align-items-center justify-content-center text-center position-relative student-sidebar bg-light border-end">    <div class="profile-circle shadow-sm mb-3" style="width: 80px; height: 80px; font-size: 2rem; background-color: #0399b0; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <i class="fas fa-user"></i>
    </div>
  <h4 class="fw-bold text-dark mb-1">${currentFullName}</h4>
    <p class="text-muted small mb-2">
        <span class="text-secondary fw-bold">@${currentUser.username}</span> 
        <span class="mx-2 text-opacity-25">|</span> 
        ${email}
    </p>
    
    <span class="badge rounded-pill px-4 py-1 mt-2 shadow-sm fw-bold" style="background-color: #0399b0; color: white;">STUDENT</span>
    
   <div class="action-tooltip-container position-absolute" style="bottom: 15px; left: 15px;">
        <button id="openStudentEditBtn" class="btn-icon-only" style="color: #0399b0; width: 35px; height: 35px; font-size: 1.1rem;">
            <i class="fas fa-pencil-alt"></i>
        </button>
        <span class="action-tooltip" style="bottom: 100%; left: 0; transform: none; margin-bottom: 8px; white-space: nowrap;">Edit Profile</span>
    </div>
</div>
                <div class="col-md-8 p-5 d-flex flex-column align-items-center justify-content-center text-center">
                    <i class="fas fa-users-slash fa-3x text-muted mb-3"></i>
                    <h4 class="fw-bold text-secondary">Not Assigned to a Team</h4>
                    <p class="text-muted mb-0">You haven't been assigned to a team yet. Check back later!</p>
                </div>
            </div>
        </div>`;
    } else {
      // Format team members using First/Last Name with Email fallback
      const members = await ButterflyAPI.getTeamMembers(myTeam.id);
      const membersHtml = members
        .map((m: any) => {
          const mFName = m.firstName || "";
          const mLName = m.lastName || "";
          const mFullName = `${mFName} ${mLName}`.trim() || m.email; // Fallback to email
          return `<span class="team-member-pill d-inline-flex align-items-center gap-1 me-2 mb-2 px-3 py-1 rounded-pill border small fw-bold shadow-sm"
             style="font-size: 0.85rem;">
              ${mFullName}
          </span>`;
        })
        .join("");

      // Format API Key section
      let apiKeyHtml = "";
      if (!teamKeyFull) {
        apiKeyHtml = `<div class="bg-light border rounded p-3 text-muted fst-italic shadow-sm">No active API key found for this team.</div>`;
      } else {
        const isActive =
          teamKeyFull.active !== false && teamKeyFull.status !== "INACTIVE";
        const expiresText = teamKeyFull.expiration
          ? "Expires " + new Date(teamKeyFull.expiration).toLocaleDateString()
          : "No expiry set";

        apiKeyHtml = `
          <div class="api-key-box bg-light border rounded p-3 shadow-sm">
              <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                  <span class="badge rounded-pill px-3 py-1" style="font-size:0.75rem; background: ${isActive ? "#d1fae5" : "#fef3c7"}; color: ${isActive ? "#065f46" : "#92400e"};">
                      ${isActive ? "Active" : "Inactive"}
                  </span>
                  <span class="text-muted" style="font-size:0.85rem;">${expiresText}</span>
              </div>
        <div class="api-key-text font-monospace text-break fw-bold mt-2" style="font-size: 1rem;">
                  ${myApiKey}
              </div>
          </div>
        `;
      }

      // Inject the completely merged layout
      container.innerHTML = `

        
  <div class="card border-0 bg-white overflow-hidden" style="border-radius: 15px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);">          <div class="row g-0">
<div class="col-md-4 p-4 d-flex flex-column align-items-center justify-content-center text-center position-relative student-sidebar bg-light border-end">      <div class="profile-circle shadow-sm mb-3" style="width: 80px; height: 80px; font-size: 2rem; background-color: #0399b0; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <i class="fas fa-user"></i>
      </div>
    <h4 class="fw-bold text-dark mb-1">${currentFullName}</h4>
      <p class="text-muted small mb-2">
          <span class="text-secondary fw-bold">@${currentUser.username}</span> 
          <span class="mx-2 text-opacity-25">|</span> 
          ${email}
      </p>
      <span class="badge rounded-pill px-4 py-1 mt-2 shadow-sm fw-bold" style="background-color: #0399b0; color: white;">STUDENT</span>
      
    <div class="action-tooltip-container position-absolute" style="bottom: 15px; left: 15px;">
          <button id="openStudentEditBtn" class="btn-icon-only" style="color: #0399b0; width: 35px; height: 35px; font-size: 1.1rem;">
              <i class="fas fa-pencil-alt"></i>
          </button>
          <span class="action-tooltip" style="bottom: 100%; left: 0; transform: none; margin-bottom: 8px; white-space: nowrap;">Edit Profile</span>
      </div>
  </div>
                
                <div class="col-md-8 p-5">
                    <h6 class="fw-bold text-dark mb-2 border-bottom pb-2">Team Information</h6>
                    <h4 class="fw-bold mb-1" style="color: #0399b0;">${myTeam.name}</h4>
                    <p class="text-muted mb-4">${myTeam.projectName} &nbsp;·&nbsp; ${myTeam.semester}</p>
                    
                    <div class="mb-4">
                        <h6 class="fw-bold text-dark mb-2 border-bottom pb-2">Team Members</h6>
                        <div class="d-flex flex-wrap mt-3">${membersHtml}</div>
                    </div>
                    
                    <div class="mb-2">
                        <h6 class="fw-bold text-dark mb-2 border-bottom pb-2">API Key</h6>
                        <div class="mt-3">
                            ${apiKeyHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // --- STUDENT EDIT PROFILE LOGIC ---
    const editBtn = document.getElementById("openStudentEditBtn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        (
          document.getElementById("studentEditFirstName") as HTMLInputElement
        ).value = fName;
        (
          document.getElementById("studentEditLastName") as HTMLInputElement
        ).value = lName;
        (
          document.getElementById("studentEditUsername") as HTMLInputElement
        ).value = currentUser.username || "";
        (
          document.getElementById("studentEditEmail") as HTMLInputElement
        ).value = email;
        (
          document.getElementById("studentEditPassword") as HTMLInputElement
        ).value = "";
        (
          document.getElementById(
            "studentEditConfirmPassword",
          ) as HTMLInputElement
        ).value = "";

        const modalEl = document.getElementById("studentEditProfileModal");
        if (modalEl) {
          new bootstrap.Modal(modalEl).show();
        }
      });
    }

    const editForm = document.getElementById(
      "studentEditProfileForm",
    ) as HTMLFormElement;
    if (editForm) {
      editForm.onsubmit = async (e) => {
        e.preventDefault();
        const newFName = (
          document.getElementById("studentEditFirstName") as HTMLInputElement
        ).value.trim();
        const newLName = (
          document.getElementById("studentEditLastName") as HTMLInputElement
        ).value.trim();
        const newUsername = (
          document.getElementById("studentEditUsername") as HTMLInputElement
        ).value.trim();
        const newEmail = (
          document.getElementById("studentEditEmail") as HTMLInputElement
        ).value.trim();
        const newPass = (
          document.getElementById("studentEditPassword") as HTMLInputElement
        ).value;
        const confirmPass = (
          document.getElementById(
            "studentEditConfirmPassword",
          ) as HTMLInputElement
        ).value;

        // Validation Checks
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

        if (newPass !== "" || confirmPass !== "") {
          if (newPass !== confirmPass)
            return alert("Passwords do not match! Please try again.");
          if (newPass.length < 7)
            return alert("Password must be at least 7 characters long.");
        }

        try {
          const userId = currentUser.userId || currentUser.id;

          // Process API Updates
          await ButterflyAPI.updateUsername(userId, newUsername);
          await ButterflyAPI.updateEmail(userId, newEmail);
          await ButterflyAPI.updateName(userId, newFName, newLName);

          if (newPass !== "") {
            await ButterflyAPI.resetPassword(newEmail, newPass);
          }

          // Update Local Storage so the navbar stays in sync
          currentUser.firstName = newFName;
          currentUser.lastName = newLName;
          currentUser.username = newUsername;
          currentUser.email = newEmail;
          localStorage.setItem("butterflyUser", JSON.stringify(currentUser));

          alert("Profile successfully updated!");

          const modal = document.getElementById("studentEditProfileModal");
          if (modal) {
            bootstrap.Modal.getInstance(modal)?.hide();
          }

          // Refresh the dashboard with the new email
          loadStudentData(newEmail);
        } catch (error: any) {
          alert("Failed to update profile: " + error.message);
        }
      };
    }
  } catch (error) {
    console.error("Error loading student dashboard:", error);
  }
}
