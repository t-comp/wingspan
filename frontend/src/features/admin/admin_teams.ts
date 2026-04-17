// src/features/admin/admin_teams.ts

/**
 * This file powers the team management section of the admin dashboard.
 * It handles rendering the team cards, assigning unassigned students to specific teams,
 * and creating or deleting team groups for the semester.
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

  const container = document.getElementById("teamsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (teams.length === 0) {
    container.innerHTML = `<p class="text-muted fst-italic">No teams yet. Click "Create Team" to get started.</p>`;
    return;
  }

  // Generate Checkbox List for the searchable dropdown
  let studentCheckboxesHtml = "";
  if (unassigned.length === 0) {
    studentCheckboxesHtml = `<div class="text-muted small p-2">No unassigned students available.</div>`;
  } else {
    unassigned.forEach((u: any) => {
      studentCheckboxesHtml += `
            <div class="form-check p-2 ms-4 student-item" data-search-term="${u.username.toLowerCase()} ${u.email.toLowerCase()}">
                <input class="form-check-input student-checkbox" type="checkbox" value="${u.userId}" id="chk-${u.userId}" data-username="${u.username}">
                <label class="form-check-label small w-100 cursor-pointer" for="chk-${u.userId}">
                    ${u.username} <span class="text-muted">— ${u.email}</span>
                </label>
            </div>`;
    });
  }

  const membersByTeam = await Promise.all(
    teams.map((t: any) => ButterflyAPI.getTeamMembers(t.id)),
  );

  for (let idx = 0; idx < teams.length; idx++) {
    const team = teams[idx];
    const members = membersByTeam[idx];
    const teamKey = allKeys.find((k: any) => k.teamName === team.name);
    const isActive =
      teamKey && teamKey.active !== false && teamKey.status !== "INACTIVE";

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

    let apiKeyHtml = teamKey
      ? `
        <div class="p-2 rounded" style="background:#f8f9fa; border: 0.5px solid #dee2e6;">
            <div class="d-flex align-items-center justify-content-between mb-1">
                <span class="badge rounded-pill px-2 py-1" style="font-size:0.7rem; background: ${isActive ? "#d1fae5" : "#fef3c7"}; color: ${isActive ? "#065f46" : "#92400e"};">
                    ${isActive ? "Active" : "Inactive"}
                </span>
            </div>
            <div class="font-monospace text-break pt-2 mt-2 border-top" style="font-size:0.72rem; color:#555;">${teamKey.keyVal}</div>
        </div>`
      : `<div class="text-muted small fst-italic p-2 border rounded bg-light">No API key found</div>`;

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
                    <button class="btn-icon-only delete-btn" onclick="window.deleteTeam('${team.id}', '${team.name}')">
                        <i class="fas fa-trash text-danger"></i>
                    </button>
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
  // 1. Live Search Filtering
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

  // 2. NEW: Update Dropdown Button Text when checkboxes change
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

  // 3. Bulk Add Members
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
