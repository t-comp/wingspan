export const Auth = {
  enableAdminMode(): void {
    document.getElementById("uploadBtn")?.classList.remove("d-none");
    document.getElementById("deleteButterflyBtn")?.classList.remove("d-none");
  },
  enableStudentMode(): void {
    document.getElementById("uploadBtn")?.classList.add("d-none");
  },
};
