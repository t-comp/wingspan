// src/features/admin/admin_teams.ts

import { ButterflyAPI } from "../../core/api.js";

export async function loadTeams() {
  const [teams, unassigned, allKeys] = await Promise.all([
    ButterflyAPI.getAllTeams(),
    ButterflyAPI.getUnassignedStudents(),
    ButterflyAPI.getAllApiKeys(),
  ]);
  const container = document.getElementById("teamsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (teams.length === 0) {
    container.innerHTML = `<p class="text-muted fst-italic">No teams yet. Click "Create Team" to get started.</p>`;
    return;
  }

  let studentOptions = `<option value="">Select a student...</option>`;
  unassigned.forEach((u: any) => {
    studentOptions += `<option value="${u.userId}">${u.username} — ${u.email}</option>`;
  });

  const membersByTeam = await Promise.all(
    teams.map((t: any) => ButterflyAPI.getTeamMembers(t.id)),
  );

  for (let idx = 0; idx < teams.length; idx++) {
    const team = teams[idx];
    const members = membersByTeam[idx];
    const teamKey = allKeys.find((k: any) => k.teamName === team.name);
    const isActive =
      teamKey && teamKey.active !== false && teamKey.status !== "INACTIVE";

    let membersHtml = "";
    if (members.length === 0) {
      membersHtml = `<span class="text-muted fst-italic small">No members yet</span>`;
    } else {
      membersHtml = members
        .map((m: any) => {
          return `
            <span class="d-inline-flex align-items-center gap-1 me-1 mb-1 px-3 py-1 rounded-pill border small fw-bold"
                  style="background: #f8f9fa; font-size: 0.75rem; color: #495057;">
                ${m.username}
                <span style="cursor:pointer; font-size:11px; color:#adb5bd; margin-left:6px; padding: 2px;"
                      onclick="window.removeStudentFromTeam('${team.id}', '${m.userId}')"><i class="fas fa-times"></i></span>
            </span>`;
        })
        .join("");
    }

    let apiKeyHtml = "";
    if (!teamKey) {
      apiKeyHtml = `
        <div class="d-flex align-items-center justify-content-between p-2 rounded" style="background:#f8f9fa; border: 0.5px solid #dee2e6;">
            <span class="text-muted small fst-italic">No API key found</span>
            <div class="action-tooltip-container">
                <button class="btn-icon-only" onclick="window.regenerateTeamKey('${team.name}', '${team.projectName}', '${team.semester}')">
                    <i class="fas fa-key"></i>
                </button>
                <span class="action-tooltip" style="right: 0; left: auto; transform: none;">Generate Key</span>
            </div>
        </div>`;
    } else {
      const expiresText = teamKey.expiration
        ? "Expires " + new Date(teamKey.expiration).toLocaleDateString()
        : "No expiry set";

      apiKeyHtml = `
        <div class="p-2 rounded" style="background:#f8f9fa; border: 0.5px solid #dee2e6;">
            <div class="d-flex align-items-center justify-content-between mb-1">
                <span class="badge rounded-pill px-2 py-1" style="font-size:0.7rem; background: ${isActive ? "#d1fae5" : "#fef3c7"}; color: ${isActive ? "#065f46" : "#92400e"};">
                    ${isActive ? "Active" : "Inactive"}
                </span>
                <span class="text-muted" style="font-size:0.7rem;">${expiresText}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                <div class="font-monospace text-break mb-0" style="font-size:0.72rem; color:#555; word-break:break-all;">
                    ${teamKey.keyVal}
                </div>
                <div class="d-flex flex-wrap gap-1 flex-shrink-0 ms-3">
                    <div class="action-tooltip-container">
                        <button class="btn-icon-only" onclick="window.toggleApiKeyStatus('${teamKey.id}', ${isActive})">
                            <i class="fas fa-power-off text-${isActive ? "secondary" : "success"}"></i>
                        </button>
                        <span class="action-tooltip" style="right: 0; left: auto; transform: none;">${isActive ? "Deactivate" : "Activate"}</span>
                    </div>
                    <div class="action-tooltip-container">
                        <button class="btn-icon-only" onclick="window.openExtendModal('${teamKey.id}')">
                            <i class="fas fa-calendar-plus text-secondary"></i>
                        </button>
                        <span class="action-tooltip" style="right: 0; left: auto; transform: none;">Extend Time</span>
                    </div>
                    <div class="action-tooltip-container">
                        <button class="btn-icon-only" onclick="window.regenerateTeamKey('${team.name}', '${team.projectName}', '${team.semester}')">
                            <i class="fas fa-sync-alt text-secondary"></i>
                        </button>
                        <span class="action-tooltip" style="right: 0; left: auto; transform: none;">Regenerate</span>
                    </div>
                    <div class="action-tooltip-container">
                        <button class="btn-icon-only delete-btn" onclick="window.deleteApiKey('${teamKey.id}')">
                            <i class="fas fa-trash-alt text-danger"></i>
                        </button>
                        <span class="action-tooltip" style="right: 0; left: auto; transform: none;">Delete Key</span>
                    </div>
                </div>
            </div>
        </div>`;
    }

    const col = document.createElement("div");
    col.className = "col-lg-6 team-card-wrapper"; // class for search logic
    const card = document.createElement("div");
    card.className = "card shadow-sm border-0 h-100 d-flex flex-column";
    card.innerHTML = `
        <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-1">
                <div>
                    <h5 class="fw-bold mb-0" style="color: #0399b0;">${team.name}</h5>
                    <div class="text-muted small">${team.projectName} &nbsp;·&nbsp; ${team.semester}</div>
                </div>
                <div class="action-tooltip-container">
                    <button class="btn-icon-only delete-btn" onclick="window.deleteTeam('${team.id}')">
                        <i class="fas fa-trash text-danger"></i>
                    </button>
                    <span class="action-tooltip" style="right: 0; left: auto; transform: none;">Delete Team</span>
                </div>
            </div>
            <hr class="my-2">
            
            <div class="flex-grow-1">
                <div class="mb-1 small fw-bold text-dark">Members</div>
                <div class="mb-2 d-flex flex-wrap">${membersHtml}</div>
                
                <div class="d-flex align-items-center gap-2 mb-3">
                    <select class="form-select form-select-sm" id="assignStudentSelect-${team.id}" style="font-size:0.8rem; border-radius: 6px;">
                        ${studentOptions}
                    </select>
                    <div class="action-tooltip-container flex-shrink-0">
                        <button class="btn-icon-only" onclick="window.addStudentToTeam('${team.id}')">
                            <i class="fas fa-user-plus text-secondary"></i>
                        </button>
                        <span class="action-tooltip" style="right: 0; left: auto; transform: none;">Add Student</span>
                    </div>
                </div>
            </div>

            <div class="mt-auto">
                <div class="mb-1 small fw-bold text-dark">API Key</div>
                ${apiKeyHtml}
            </div>
        </div>`;
    col.appendChild(card);
    container.appendChild(col);
  }
}

export function initAdminTeams(refreshAdminData: () => Promise<void>) {
  (window as any).deleteTeam = async (teamId: string) => {
    if (confirm("Delete this team entirely?")) {
      await ButterflyAPI.deleteTeam(teamId);
      await refreshAdminData();
    }
  };

  (window as any).addStudentToTeam = async (teamId: string) => {
    const select = document.getElementById(
      `assignStudentSelect-${teamId}`,
    ) as HTMLSelectElement;
    const userId = select.value;
    if (!userId) return alert("Please select a student first.");
    try {
      await ButterflyAPI.addTeamMember(teamId, userId);
      await refreshAdminData();
    } catch (error: any) {
      alert("Could not add student: " + error.message);
    }
  };

  (window as any).removeStudentFromTeam = async (
    teamId: string,
    userId: string,
  ) => {
    if (confirm("Remove this student from the team?")) {
      try {
        await ButterflyAPI.removeTeamMember(teamId, userId);
        await refreshAdminData();
      } catch (error: any) {
        alert("Could not remove student: " + error.message);
      }
    }
  };

  const adminTeamSearch = document.getElementById("adminTeamSearch");
  if (adminTeamSearch) {
    adminTeamSearch.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      const wrappers = document.querySelectorAll(
        "#teamsContainer .team-card-wrapper",
      );

      wrappers.forEach((wrapper) => {
        const teamName =
          wrapper.querySelector("h5")?.innerText.toLowerCase() || "";
        if (teamName.includes(query)) {
          (wrapper as HTMLElement).style.display = "block";
        } else {
          (wrapper as HTMLElement).style.display = "none";
        }
      });
    });
  }

  const adminCreateTeamForm = document.getElementById("adminCreateTeamForm");
  if (adminCreateTeamForm) {
    adminCreateTeamForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const teamData = {
        name: (document.getElementById("newCreateTeamName") as HTMLInputElement)
          .value,
        projectName: (
          document.getElementById("newCreateProjectName") as HTMLInputElement
        ).value,
        semester: (
          document.getElementById("newCreateSemester") as HTMLInputElement
        ).value,
      };
      await ButterflyAPI.createTeam(teamData);
      await refreshAdminData();
      (e.target as HTMLFormElement).reset();
      const modal = document.getElementById("adminCreateTeamModal");

      if (modal) bootstrap.Modal.getInstance(modal)?.hide();
    });
  }
}
