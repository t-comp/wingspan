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
          // IMPORTANT: Save this to our global state so the image gallery can use it!
          AppState.studentApiKey = myApiKey;
        }
        break;
      }
    }

    const container = document.getElementById("studentTeamDynamicContent");
    if (!container) return;

    if (!myTeam) {
      container.innerHTML = `
        <h2 class="text-muted mb-4">My Team Overview</h2>
        <div class="card shadow-sm border-0 bg-light p-4">
            <div class="card-body text-center py-5">
                <i class="fas fa-users-slash fa-3x text-muted mb-3"></i>
                <h4 class="fw-bold text-secondary">Not Assigned to a Team</h4>
                <p class="text-muted mb-0">You haven't been assigned to a team yet. Check back later!</p>
            </div>
        </div>`;
      return;
    }

    // Format team members as pills
    const members = await ButterflyAPI.getTeamMembers(myTeam.id);
    const membersHtml = members
      .map(
        (m: any) =>
          `<span class="d-inline-flex align-items-center gap-1 me-2 mb-2 px-3 py-1 rounded-pill border small fw-bold shadow-sm"
                 style="background: #ffffff; font-size: 0.85rem; color: #495057;">
              ${m.username}
          </span>`,
      )
      .join("");

    // Format API Key section with Expiration and Badges
    let apiKeyHtml = "";
    if (!teamKeyFull) {
      apiKeyHtml = `<div class="bg-white border rounded p-3 text-muted fst-italic shadow-sm">No active API key found for this team.</div>`;
    } else {
      const isActive =
        teamKeyFull.active !== false && teamKeyFull.status !== "INACTIVE";
      const expiresText = teamKeyFull.expiration
        ? "Expires " + new Date(teamKeyFull.expiration).toLocaleDateString()
        : "No expiry set";

      apiKeyHtml = `
        <div class="bg-white border rounded p-3 shadow-sm">
            <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                <span class="badge rounded-pill px-3 py-1" style="font-size:0.75rem; background: ${isActive ? "#d1fae5" : "#fef3c7"}; color: ${isActive ? "#065f46" : "#92400e"};">
                    ${isActive ? "Active" : "Inactive"}
                </span>
                <span class="text-muted" style="font-size:0.85rem;">${expiresText}</span>
            </div>
            <div class="font-monospace text-break text-primary fw-bold mt-2" style="font-size: 1rem;">
                ${myApiKey}
            </div>
        </div>
      `;
    }

    // Inject the completed layout
    container.innerHTML = `
      <h2 class="text-muted mb-4">My Team Overview</h2>
      <div class="card shadow-sm border-0 bg-light p-4">
          <div class="card-body">
              <h4 class="fw-bold text-primary mb-1">${myTeam.name}</h4>
              <p class="text-muted mb-4">${myTeam.projectName} &nbsp;·&nbsp; ${myTeam.semester}</p>
              
              <div class="mb-4">
                  <h6 class="fw-bold text-dark mb-2">Members</h6>
                  <div class="d-flex flex-wrap">${membersHtml}</div>
              </div>
              
              <div class="mb-2">
                  <h6 class="fw-bold text-dark mb-2">API Key</h6>
                  ${apiKeyHtml}
              </div>
          </div>
      </div>`;
  } catch (error) {
    console.error("Error loading student dashboard:", error);
  }
}
