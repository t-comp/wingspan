// src/core/state.ts

/**
 * This file acts as the single source of truth for the application's global state.
 * It stores shared data like the loaded butterflies, current user role, and active display modes
 * so that isolated feature modules can access and update the same information without direct coupling.
 */

export const AppState = {
  // user context
  userRole: null as string | null,
  userEmail: null as string | null,
  studentApiKey: "" as string,

  // UI context
  currentDisplayMode: "common" as "common" | "scientific",

  // data context
  butterflies: [] as any[],
  currentFilteredData: [] as any[],
  currentSpeciesId: null as number | string | null,

  // admin context
  allCachedUsers: [] as any[],
  globalUserTeamMap: {} as any,
};
