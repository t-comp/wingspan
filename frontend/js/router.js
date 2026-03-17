// js/router.js
import { initHome } from "./homepage.js";
import { ButterflyAPI } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const screens = {
    welcome: document.getElementById("welcome-screen"),
    student: document.getElementById("student-login"),
    admin: document.getElementById("admin-login"),
    create: document.getElementById("create-account-screen"),
    home: document.getElementById("homepage"),
  };

  function toggleLogoutButtons(role) {
    const studentLogout = document.getElementById("studentLogoutLink");
    const adminLogout = document.getElementById("adminLogoutLink");

    if (studentLogout) {
      studentLogout.classList.add("d-none");
    }
    if (adminLogout) {
      adminLogout.classList.add("d-none");
    }

    if (role === "STUDENT" && studentLogout) {
      studentLogout.classList.remove("d-none");
    }
    if (role === "ADMIN" && adminLogout) {
      adminLogout.classList.remove("d-none");
    }
  }

  function showScreen(key) {
    Object.values(screens).forEach((s) => {
      if (s) {
        s.style.display = "none";
        s.classList.remove("d-flex");
      }
    });
    const target = screens[key];
    if (target) {
      if (key === "home") {
        target.style.display = "block";
      } else {
        target.style.display = "flex";
        target.classList.add("d-flex");
      }
    }
    window.scrollTo(0, 0);
  }

  // Navigation
  const studentLoginBtn = document.getElementById("studentLoginBtn");
  if (studentLoginBtn) {
    studentLoginBtn.onclick = () => showScreen("student");
  }

  const adminLoginBtn = document.getElementById("adminLoginBtn");
  if (adminLoginBtn) {
    adminLoginBtn.onclick = () => showScreen("admin");
  }

  const createAccountBtn = document.getElementById("goToCreateAccountBtn");
  if (createAccountBtn) {
    createAccountBtn.onclick = () => showScreen("create");
  }

  const backBtns = document.querySelectorAll("[id$='BackToWelcomeBtn']");
  backBtns.forEach((btn) => {
    btn.onclick = () => showScreen("welcome");
  });

  // Reusable Login Logic
  async function handleLogin(e, emailId, passId, expectedRole) {
    e.preventDefault();

    const emailVal = document.getElementById(emailId).value;
    const passVal = document.getElementById(passId).value;

    // Strict Length Validation for Login
    if (emailVal.length !== 5) {
      return alert("Username must be exactly 5 characters long.");
    }
    if (passVal.length !== 7) {
      return alert("Password must be exactly 7 characters long.");
    }

    try {
      const user = await ButterflyAPI.login(emailVal, passVal);

      console.log("BACKEND LOGIN RESPONSE:", user);
      const role = user.userType || user.utype || user.uType;

      // Role Restriction Check
      if (role !== expectedRole) {
        alert(
          `Access Denied: You are a ${role}. Please use the correct login screen.`
        );
        return;
      }

      if (user && role) {
        showScreen("home");
        initHome(role, user.email);
        toggleLogoutButtons(role);
        localStorage.setItem("butterflyUser", JSON.stringify(user));

        const uploadBtn = document.getElementById("uploadBtn");
        const deleteSpeciesBtn = document.getElementById("deleteSpeciesBtn");

        if (role === "ADMIN") {
          if (uploadBtn) uploadBtn.classList.remove("d-none");
          if (deleteSpeciesBtn) deleteSpeciesBtn.classList.remove("d-none");
        } else {
          if (uploadBtn) uploadBtn.classList.add("d-none");
        }
      } else {
        alert("Login failed: The backend didn't send back the user role!");
      }
    } catch (error) {
      console.error("Login Error:", error);
      // Prompt unregistered users to create an account
      if (
        confirm(
          `Login failed. Account not found or incorrect password.\n\nWould you like to create a new account?`
        )
      ) {
        showScreen("create");
      }
    }
  }

  // Student Login Form (Pass expected role "STUDENT")
  const studentLoginForm = document.getElementById("studentLoginForm");
  if (studentLoginForm) {
    studentLoginForm.onsubmit = (e) =>
      handleLogin(e, "studentEmail", "studentPassword", "STUDENT");
  }

  // Admin Login Form (Pass expected role "ADMIN")
  const adminLoginForm = document.getElementById("adminLoginForm");
  if (adminLoginForm) {
    adminLoginForm.onsubmit = (e) =>
      handleLogin(e, "adminEmail", "adminPassword", "ADMIN");
  }

  // Handle Account Creation Submit
  const createAccountForm = document.getElementById("createAccountForm");
  if (createAccountForm) {
    createAccountForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const usernameVal = document.getElementById("createUsername").value;
      const emailVal = document.getElementById("createEmail").value;
      const passVal = document.getElementById("createPassword").value;

      // Email Format Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        return alert("Please enter a valid email address.");
      }

      // Strict Length Validation for Creation
      if (usernameVal.length !== 5) {
        return alert("Username must be exactly 5 characters long.");
      }
      if (passVal.length !== 7) {
        return alert("Password must be exactly 7 characters long.");
      }

      try {
        // Uniqueness Check: See if username already exists
        const allUsers = await ButterflyAPI.getAllUsers();
        const usernameExists = allUsers.some(
          (u) => u.username.toLowerCase() === usernameVal.toLowerCase()
        );

        if (usernameExists) {
          return alert(
            "This username already exists. Please choose a different one."
          );
        }

        const newUser = {
          username: usernameVal,
          email: emailVal,
          password: passVal,
          utype: "STUDENT",
        };

        await ButterflyAPI.createAccount(newUser);
        alert("Account created successfully! Please log in.");
        e.target.reset();
        showScreen("welcome");
      } catch (error) {
        console.error("Account Creation Error:", error);
        alert(`Could not create account: ${error.message}`);
      }
    });
  }

  // Logout
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("butterflyUser"); // Clear the saved user
    location.reload();
  };

  const studentLogoutLink = document.getElementById("studentLogoutLink");
  if (studentLogoutLink) {
    studentLogoutLink.addEventListener("click", handleLogout);
  }

  const adminLogoutLink = document.getElementById("adminLogoutLink");
  if (adminLogoutLink) {
    adminLogoutLink.addEventListener("click", handleLogout);
  }

  //ADD butterfly
  const addButterflyModal = document.getElementById("addButterflyModal");

  if (addButterflyModal) {
    // Inside your router.js event listener
    // inside your form submission listener in router.js
    addButterflyModal.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const name = document.getElementById("newName").value;
        const scientific = document.getElementById("newScientific").value;
        const description = document.getElementById("newDescription").value;

        // 1. CREATE SPECIES
        // Note: Backend returns a STRING, not an object with an ID
        await ButterflyAPI.create({
          name: name,
          scientificName: scientific,
          description: description,
        });

        // 2. GET THE ID
        // Since the backend only returns a success string, we fetch the list to find the ID
        const allSpecies = await ButterflyAPI.getAll();
        const createdSpecies = allSpecies.find((s) => s.name === name);

        if (!createdSpecies) {
          throw new Error("Could not retrieve ID for the new species.");
        }

        const speciesId = createdSpecies.id;
        console.log("Species ID linked for upload:", speciesId);

        // 3. UPLOAD IMAGE
        const fileInput = document.getElementById("newImageFile");
        const formData = new FormData();

        // Mapped exactly to ImageController @RequestParam names
        formData.append("file", fileInput.files[0]);
        formData.append("species_id", speciesId); // REQUIRED: must be int
        formData.append(
          "life_cycle",
          document.getElementById("lifecycleStage").value || "Adult"
        );
        formData.append("description", description || "No description");
        formData.append(
          "nathansNotes",
          document.getElementById("nathanNotes").value || ""
        );

        const imageResult = await ButterflyAPI.uploadImage(formData);
        console.log("Upload Success! Image Data:", imageResult);

        const newImageId = imageResult.id; // Get the ID from the upload response
        console.log("LINKING SPECIES:", speciesId, "TO IMAGE:", newImageId);
        await ButterflyAPI.setThumbnail(speciesId, newImageId); // Link it to the species
        console.log("Handshake Complete: Image linked to Species!");

        const modalElem = document.getElementById("addButterflyModal"); // Use your actual modal ID
        const modalInstance = bootstrap.Modal.getInstance(modalElem);
        if (modalInstance) modalInstance.hide();

        // 2. Clear the form
        e.target.reset();

        alert("Butterfly and Image successfully created!");
        location.reload();
      } catch (error) {
        console.error("Workflow failed:", error);
        alert(`Error: ${error.message}`);
      }
    });
  }

  // Add these towards the bottom of router.js

// 1. DELETE ENTIRE SPECIES
const deleteSpeciesBtn = document.getElementById("deleteSpeciesFullBtn");
if (deleteSpeciesBtn) {
  deleteSpeciesBtn.onclick = async () => {
    const id = deleteSpeciesBtn.dataset.speciesId;
    if (confirm("Are you sure? This deletes the species and ALL its images!")) {
      try {
        await ButterflyAPI.delete(id); // Make sure this is in api.js
        alert("Species Deleted");
        location.reload(); 
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };
}

// 2. DELETE SINGLE IMAGE (Inside the gallery)
// This will be called via a global function since items are dynamic
window.handleDeleteSingleImage = async (imageId) => {
  if (confirm("Delete this specific photo?")) {
    try {
      await ButterflyAPI.deleteImage(imageId); // Make sure this is in api.js
      alert("Image Deleted");
      // You'd ideally refresh the gallery here
    } catch (err) {
      alert("Error: " + err.message);
    }
  }
};


  //added this 
  const savedUser = localStorage.getItem("butterflyUser");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      const role = user.userType || user.utype || user.uType;
      
      showScreen("home");
      initHome(role, user.email);
      toggleLogoutButtons(role);
      
      // Keep admin buttons visible if applicable
      if (role === "ADMIN") {
        document.getElementById("uploadBtn")?.classList.remove("d-none");
        // document.getElementById("deleteSpeciesBtn")?.classList.remove("d-none");
      }
    } catch (e) {
      console.error("Error loading saved user", e);
      localStorage.removeItem("butterflyUser");
    }
  }
  // til here
});
