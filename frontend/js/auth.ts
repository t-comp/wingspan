const Auth = {
  enableAdminMode() {
    document.getElementById("uploadBtn")?.classList.remove("d-none");
    document.getElementById("deleteButterflyBtn")?.classList.remove("d-none");
  },
  enableStudentMode() {
    document.getElementById("uploadBtn")?.classList.add("d-none");
  },
};

export = Auth;
