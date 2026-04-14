export const AppState = {
  // User context
  userRole: null as string | null,
  userEmail: null as string | null,
  studentApiKey: "" as string,

  // UI context
  currentDisplayMode: "common" as "common" | "scientific",

  // Data context
  butterflies: [] as any[],
  currentFilteredData: [] as any[],
  currentSpeciesId: null as number | string | null,

  // Admin context
  allCachedUsers: [] as any[],
  globalUserTeamMap: {} as any,
};
