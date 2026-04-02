export {};

declare global {
  interface Window {
    deleteSystemUser: (userId: string | number) => Promise<void>;
    toggleUserRole: (
      userId: string | number,
      currentRole: string,
    ) => Promise<void>;
    deleteTeam: (teamId: string | number) => Promise<void>;
    addStudentToTeam: (teamId: string | number) => Promise<void>;
    removeStudentFromTeam: (
      teamId: string | number,
      userId: string | number,
    ) => Promise<void>;
    toggleApiKeyStatus: (
      keyId: string | number,
      currentlyActive: boolean,
    ) => Promise<void>;
    regenerateTeamKey: (
      teamName: string,
      projectName: string,
      semester: string,
    ) => Promise<void>;
    deleteApiKey: (keyId: string | number) => Promise<void>;
    handleDeleteSingleImage: (imageId: string | number) => Promise<void>;
    openExtendModal: (keyId: string | number) => void;
    openEditUserModal: (
      userId: string,
      currentUsername: string,
      currentEmail: string,
    ) => void;
  }
}
