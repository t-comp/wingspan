// src/features/admin/admin_teams.ts

/**
 * This file powers the team management section of the admin dashboard.
 * It handles rendering the team cards with a searchable, multi-select student
 * dropdown that dynamically updates its label based on selected students.
 */

import { ButterflyAPI } from "../../core/api.js";

export async function loadTeams() {
  const [teams, unassigned, allKeys] = await Promise.all([
    ButterflyAPI.getAllTeams(),
    ButterflyAPI.getUnassignedStudents(),
    ButterflyAPI.getAllApiKeys(),
  ]);

  // --- DYNAMIC YEAR LOGIC ---
  const teamYearFilter = document.getElementById(
    "teamYearFilter",
  ) as HTMLSelectElement;
  if (teamYearFilter) {
    const currentSelection = teamYearFilter.value;
    const uniqueYears = new Set<string>();
    teams.forEach((t: any) => {
      const match = t.semester.match(/\d{4}/);
      if (match) uniqueYears.add(match[0]);
    });
    teamYearFilter.innerHTML = '<option value="All">All Years</option>';
    const sortedYears = Array.from(uniqueYears).sort().reverse();
    sortedYears.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.innerText = year;
      teamYearFilter.appendChild(option);
    });
    const currentYearStr = new Date().getFullYear().toString();
    if (currentSelection && uniqueYears.has(currentSelection)) {
      teamYearFilter.value = currentSelection;
    } else if (uniqueYears.has(currentYearStr)) {
      teamYearFilter.value = currentYearStr;
    } else {
      teamYearFilter.value = "All";
    }
  }

  teams.sort((a: any, b: any) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );

  // fetch ALL the data FIRST before touching the screen
  const membersByTeam = await Promise.all(
    teams.map((t: any) => ButterflyAPI.getTeamMembers(t.id)),
  );

  // grab the container and clear it
  const container = document.getElementById("teamsContainer");
  if (!container) return;

  container.innerHTML = "";

  // handle the empty state
  if (teams.length === 0) {
    container.innerHTML = `<p class="text-muted fst-italic">No teams yet. Click "Create Team" to get started.</p>`;
    return;
  }

  for (let idx = 0; idx < teams.length; idx++) {
    const team = teams[idx];
    const members = membersByTeam[idx];
    const teamKey = allKeys.find((k: any) => k.teamName === team.name);
    const isActive =
      teamKey && teamKey.active !== false && teamKey.status !== "INACTIVE";

    // Generate Checkbox List for the searchable dropdown with unique IDs per card
    let studentCheckboxesHtml = "";
    if (unassigned.length === 0) {
      studentCheckboxesHtml = `<div class="text-muted small p-2">No unassigned students available.</div>`;
    } else {
      unassigned.forEach((u: any) => {
        const uniqueId = `chk-${team.id}-${u.userId}`;
        studentCheckboxesHtml += `
              <div class="form-check p-2 ms-4 student-item" data-search-term="${u.username.toLowerCase()} ${u.email.toLowerCase()}">
                  <input class="form-check-input student-checkbox" type="checkbox" value="${u.userId}" id="${uniqueId}" data-username="${u.username}">
                  <label class="form-check-label small w-100 cursor-pointer" for="${uniqueId}">
                      ${u.username} <span class="text-muted">— ${u.email}</span>
                  </label>
              </div>`;
      });
    }

    let membersHtml =
      members.length === 0
        ? `<span class="text-muted fst-italic small">No members yet</span>`
        : members
            .map(
              (m: any) => `
            <span class="d-inline-flex align-items-center gap-1 me-1 mb-1 px-3 py-1 rounded-pill border small fw-bold"
                  style="background: #f8f9fa; font-size: 0.75rem; color: #495057;">
                ${m.username}
                <span style="cursor:pointer; font-size:11px; color:#adb5bd; margin-left:6px; padding: 2px;"
                      onclick="window.removeStudentFromTeam('${team.id}', '${m.userId}')"><i class="fas fa-times"></i></span>
            </span>`,
            )
            .join("");

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
      let expiresHtml = `<span class="text-muted" style="font-size:0.7rem;">No expiry set</span>`;
      if (teamKey.expiration) {
        const expDate = new Date(teamKey.expiration);
        const now = new Date();
        const diffDays = Math.ceil(
          (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        const formattedDate = expDate.toLocaleDateString();

        if (diffDays <= 0)
          expiresHtml = `<span class="text-danger fw-bold" style="font-size:0.7rem;">Expired!</span>`;
        else if (diffDays <= 7)
          expiresHtml = `<span class="text-danger fw-bold" style="font-size:0.7rem;">${diffDays} days left!</span>`;
        else if (diffDays <= 30)
          expiresHtml = `<span class="fw-bold" style="font-size:0.7rem; color: #d97706;">${Math.floor(diffDays / 7) || 1} weeks left!</span>`;
        else
          expiresHtml = `<span class="text-muted" style="font-size:0.7rem;">Expires ${formattedDate}</span>`;
      }

      apiKeyHtml = `
        <div class="p-2 rounded" style="background:#f8f9fa; border: 0.5px solid #dee2e6;">
            <div class="d-flex align-items-center justify-content-between mb-1">
                <span class="badge rounded-pill px-2 py-1" style="font-size:0.7rem; background: ${isActive ? "#d1fae5" : "#fef3c7"}; color: ${isActive ? "#065f46" : "#92400e"};">
                    ${isActive ? "Active" : "Inactive"}
                </span>
                ${expiresHtml}
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
    col.className = "col-lg-6 team-card-wrapper";
    col.innerHTML = `
        <div class="card shadow-sm border-0 h-100 d-flex flex-column">
            <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <div>
                        <h5 class="fw-bold mb-0" style="color: #0399b0;">${team.name}</h5>
                        <div class="text-muted small">${team.projectName} &nbsp;·&nbsp; ${team.semester}</div>
                    </div>
                    <div class="d-flex gap-2">
                        <div class="action-tooltip-container">
                          <button class="btn-icon-only" onclick="window.openEditTeamModal('${team.id}', '${team.name}', '${team.projectName}', '${team.semester}')">
                              <i class="fas fa-pencil-alt text-secondary"></i>
                          </button>
                          <span class="action-tooltip" style="right: 0; left: auto; transform: none;">Edit Team</span>
                        </div>
                        <div class="action-tooltip-container">
                          <button class="btn-icon-only delete-btn" onclick="window.deleteTeam('${team.id}', '${team.name}')">
                              <i class="fas fa-trash text-danger"></i>
                          </button>
                          <span class="action-tooltip" style="right: 0; left: auto; transform: none;">Delete Team</span>
                        </div>
                    </div>
                </div>
                <hr class="my-2">
                
                <div class="flex-grow-1">
                    <div class="mb-1 small fw-bold text-dark">Members</div>
                    <div class="mb-2 d-flex flex-wrap">${membersHtml}</div>
                    
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <div class="dropdown flex-grow-1">
                            <button class="form-select form-select-sm text-start shadow-none" 
                                    type="button" 
                                    data-bs-toggle="dropdown" 
                                    data-bs-auto-close="outside"
                                    id="studentDropdownBtn-${team.id}"
                                    style="font-size:0.8rem; border-radius: 6px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                Select a student...
                            </button>
                            <div class="dropdown-menu p-2 shadow border w-100" style="max-height: 350px; overflow: hidden; z-index: 1060;">
                                <input type="text" class="form-control form-control-sm mb-2 student-search-input" 
                                       placeholder="Search students..." data-team-id="${team.id}">
                                <div class="student-list-scrollable" style="max-height: 200px; overflow-y: auto;" id="studentList-${team.id}">
                                    ${studentCheckboxesHtml}
                                </div>
                            </div>
                        </div>
                        <div class="action-tooltip-container flex-shrink-0">
                            <button class="btn-icon-only" onclick="window.addMultipleStudentsToTeam('${team.id}')">
                                <i class="fas fa-user-plus text-secondary"></i>
                            </button>
                            <span class="action-tooltip" style="right: 0; left: auto; transform: none;">Add Students</span>
                        </div>
                    </div>
                </div>

                <div class="mt-auto">
                    <div class="mb-1 small fw-bold text-dark">API Key</div>
                    ${apiKeyHtml}
                </div>
            </div>
        </div>`;
    container.appendChild(col);
  }

  if (typeof (window as any).applyTeamFilters === "function")
    (window as any).applyTeamFilters();
}

export function initAdminTeams(refreshAdminData: () => Promise<void>) {
  // Live Search Filtering
  document.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.classList.contains("student-search-input")) {
      const teamId = target.getAttribute("data-team-id");
      const query = target.value.toLowerCase();
      const listContainer = document.getElementById(`studentList-${teamId}`);
      if (listContainer) {
        listContainer.querySelectorAll(".student-item").forEach((item) => {
          const text =
            (item as HTMLElement).getAttribute("data-search-term") || "";
          (item as HTMLElement).style.display = text.includes(query)
            ? "block"
            : "none";
        });
      }
    }
  });

  // Update Dropdown Button Text dynamically
  document.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.classList.contains("student-checkbox")) {
      const listContainer = target.closest(".student-list-scrollable");
      const teamId = listContainer?.id.replace("studentList-", "");
      const btn = document.getElementById(`studentDropdownBtn-${teamId}`);
      if (listContainer && btn) {
        const checkedBoxes = listContainer.querySelectorAll(
          ".student-checkbox:checked",
        ) as NodeListOf<HTMLInputElement>;
        const names = Array.from(checkedBoxes).map((cb) =>
          cb.getAttribute("data-username"),
        );
        btn.innerText =
          names.length === 0 ? "Select a student..." : names.join(", ");
      }
    }
  });

  // Bulk Add Members
  (window as any).addMultipleStudentsToTeam = async (teamId: string) => {
    const listContainer = document.getElementById(`studentList-${teamId}`);
    if (!listContainer) return;
    const checkedBoxes = listContainer.querySelectorAll(
      ".student-checkbox:checked",
    ) as NodeListOf<HTMLInputElement>;
    const userIds = Array.from(checkedBoxes).map((cb) => cb.value);

    if (userIds.length === 0)
      return alert("Please select at least one student.");
    try {
      await Promise.all(
        userIds.map((userId) => ButterflyAPI.addTeamMember(teamId, userId)),
      );
      await refreshAdminData();
      alert(`Successfully added ${userIds.length} students!`);
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  // Edit Team Modal & Form Logic
  (window as any).openEditTeamModal = (
    teamId: string,
    name: string,
    projectName: string,
    semester: string,
  ) => {
    (document.getElementById("editTeamId") as HTMLInputElement).value = teamId;
    (document.getElementById("editTeamName") as HTMLInputElement).value = name;
    (document.getElementById("editProjectName") as HTMLInputElement).value =
      projectName;

    const parts = semester.split(" ");
    if (parts.length === 2) {
      (
        document.getElementById("editSemesterSeason") as HTMLSelectElement
      ).value = parts[0];
      (document.getElementById("editSemesterYear") as HTMLInputElement).value =
        parts[1];
    }

    const modalEl = document.getElementById("adminEditTeamModal");
    if (modalEl) {
      // @ts-ignore
      new bootstrap.Modal(modalEl).show();
    }
  };

  const adminEditTeamForm = document.getElementById("adminEditTeamForm");
  if (adminEditTeamForm) {
    adminEditTeamForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const teamId = (document.getElementById("editTeamId") as HTMLInputElement)
        .value;
      const season = (
        document.getElementById("editSemesterSeason") as HTMLSelectElement
      ).value;
      const year = (
        document.getElementById("editSemesterYear") as HTMLInputElement
      ).value;

      const teamData = {
        name: (document.getElementById("editTeamName") as HTMLInputElement)
          .value,
        projectName: (
          document.getElementById("editProjectName") as HTMLInputElement
        ).value,
        semester: `${season} ${year}`,
      };

      try {
        await ButterflyAPI.updateTeam(teamId, teamData);
        await refreshAdminData();
        alert("Team Updated Successfully!");

        const modal = document.getElementById("adminEditTeamModal");
        if (modal) {
          // @ts-ignore
          bootstrap.Modal.getInstance(modal)?.hide();
        }
      } catch (error: any) {
        alert("Update failed: " + error.message);
      }
    });
  }

  (window as any).deleteTeam = async (teamId: string, teamName: string) => {
    if (confirm("Delete this team entirely?")) {
      try {
        if (teamName) await ButterflyAPI.deleteApiKeyByTeam(teamName);
      } catch (e) {}
      await ButterflyAPI.deleteTeam(teamId);
      await refreshAdminData();
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
        alert("Student Removed Successfully!");
      } catch (error: any) {
        alert("Error: " + error.message);
      }
    }
  };

  (window as any).applyTeamFilters = () => {
    const query =
      (
        document.getElementById("adminTeamSearch") as HTMLInputElement
      )?.value.toLowerCase() || "";
    const year =
      (document.getElementById("teamYearFilter") as HTMLSelectElement)?.value ||
      "All";
    document
      .querySelectorAll("#teamsContainer .team-card-wrapper")
      .forEach((wrapper) => {
        const teamName =
          wrapper.querySelector("h5")?.innerText.toLowerCase() || "";
        const detailsText =
          wrapper.querySelector(".text-muted.small")?.innerHTML || "";
        const matchesSearch = teamName.includes(query);
        const matchesYear = year === "All" || detailsText.includes(year);
        (wrapper as HTMLElement).style.display =
          matchesSearch && matchesYear ? "block" : "none";
      });
  };

  document
    .getElementById("adminTeamSearch")
    ?.addEventListener("input", (window as any).applyTeamFilters);
  document
    .getElementById("teamYearFilter")
    ?.addEventListener("change", (window as any).applyTeamFilters);

  const adminCreateTeamForm = document.getElementById("adminCreateTeamForm");
  if (adminCreateTeamForm) {
    adminCreateTeamForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const season = (
        document.getElementById("newCreateSemesterSeason") as HTMLSelectElement
      ).value;
      const year = (
        document.getElementById("newCreateSemesterYear") as HTMLInputElement
      ).value;
      const teamData = {
        name: (document.getElementById("newCreateTeamName") as HTMLInputElement)
          .value,
        projectName: (
          document.getElementById("newCreateProjectName") as HTMLInputElement
        ).value,
        semester: `${season} ${year}`,
      };
      await ButterflyAPI.createTeam(teamData);
      await refreshAdminData();
      alert("Team Created Successfully!");
      (e.target as HTMLFormElement).reset();
      const modal = document.getElementById("adminCreateTeamModal");
      if (modal) bootstrap.Modal.getInstance(modal)?.hide();
    });
  }
}
