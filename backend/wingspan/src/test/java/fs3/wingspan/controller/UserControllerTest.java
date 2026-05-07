package fs3.wingspan.controller;

import fs3.wingspan.AbstractIntegrationTest;
import fs3.wingspan.model.APIKeys;
import fs3.wingspan.model.Teams;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;


import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** NOTE: test cases were developed with the assistance of Anthropic's LLM using Claude Sonnet 4.6 and have been validated for correctness **/
class UserControllerTest extends AbstractIntegrationTest {

    @Test
    void createAccount_validData_returns201() throws Exception {
        String body = """
                {"username":"newuser","email":"new@test.com","password":"secret99"}
                """;
        mockMvc.perform(post("/user/create-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(jsonPath("$.userType").value("STUDENT"));
    }

    @Test
    void createAccount_usernameTooShort_returns400() throws Exception {
        String body = """
                {"username":"abc","email":"x@test.com","password":"password1"}
                """;
        mockMvc.perform(post("/user/create-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("5 characters")));
    }

    @Test
    void createAccount_invalidEmail_returns400() throws Exception {
        String body = """
                {"username":"validuser","email":"not-an-email","password":"password1"}
                """;
        mockMvc.perform(post("/user/create-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("not valid")));
    }

    @Test
    void createAccount_passwordTooShort_returns400() throws Exception {
        String body = """
                {"username":"validuser","email":"v@test.com","password":"short"}
                """;
        mockMvc.perform(post("/user/create-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("7 characters")));
    }

    @Test
    void createAccount_duplicateUsername_returns409() throws Exception {
        String body = """
                {"username":"candy","email":"","password":"password1"}
                """;
        mockMvc.perform(post("/user/create-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("username already exists")));
    }

    @Test
    void createAccount_duplicateEmail_returns409() throws Exception {
        String body = """
                {"username":"brandnew","email":"admin@test.com","password":"password1"}
                """;
        mockMvc.perform(post("/user/create-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("email already exists")));
    }

    @Test
    void login_withUsername_returnsJwt() throws Exception {
        String body = """
                {"usernameOrEmail":"testadmin","password":"password123"}
                """;
        mockMvc.perform(post("/user/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("testadmin"));
    }

    @Test
    void login_withEmail_returnsJwt() throws Exception {
        String body = """
                {"usernameOrEmail":"admin@test.com","password":"password123"}
                """;
        mockMvc.perform(post("/user/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        String body = """
                {"usernameOrEmail":"testadmin","password":"wrongpassword"}
                """;
        mockMvc.perform(post("/user/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void makeAdmin_withAdminToken_promotes() throws Exception {
        mockMvc.perform(put("/user/{id}/make-admin", savedStudent.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("cool kids")));
    }

    @Test
    void makeAdmin_withoutAuth_returns403() throws Exception {
        mockMvc.perform(put("/user/{id}/make-admin", savedStudent.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    void makeAdmin_withStudentToken_returns403() throws Exception {
        mockMvc.perform(put("/user/{id}/make-admin", savedAdmin.getId())
                        .header("Authorization", studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void resetPassword_validRequest_returns200() throws Exception {
        mockMvc.perform(put("/user/reset-password")
                        .param("email", "admin@test.com")
                        .param("newPassword", "newpassword1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("reset")));
    }

    @Test
    void resetPassword_unknownEmail_returns404() throws Exception {
        mockMvc.perform(put("/user/reset-password")
                        .param("email", "nobody@test.com")
                        .param("newPassword", "newpassword1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateUsername_valid_returns200() throws Exception {
        mockMvc.perform(put("/user/{id}/update-username", savedAdmin.getId())
                        .param("newUsername", "renamedadmin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("renamedadmin")));
    }

    @Test
    void updateUsername_tooShort_returns400() throws Exception {
        mockMvc.perform(put("/user/{id}/update-username", savedAdmin.getId())
                        .param("newUsername", "ab"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateEmail_valid_returns200() throws Exception {
        mockMvc.perform(put("/user/{id}/update-email", savedAdmin.getId())
                        .param("newEmail", "newemail@test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("newemail@test.com")));
    }

    @Test
    void updateEmail_invalidFormat_returns400() throws Exception {
        mockMvc.perform(put("/user/{id}/update-email", savedAdmin.getId())
                        .param("newEmail", "bad-email"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteUser_withAdminToken_returns200() throws Exception {
        mockMvc.perform(delete("/user/{id}", savedStudent.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("deleted")));
    }

    @Test
    void deleteUser_withoutAuth_returns403() throws Exception {
        mockMvc.perform(delete("/user/{id}", savedStudent.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    void dashboard_userWithoutTeam_hasTeamFalse() throws Exception {
        mockMvc.perform(get("/user/dashboard")
                        .param("email", "student@test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasTeam").value(false))
                .andExpect(jsonPath("$.message", containsString("not currently")));
    }

    @Test
    void dashboard_userWithTeam_hasTeamTrue() throws Exception {
        Teams team = createTeam("DashTeam", "DashProject", "Spring 2025");
        APIKeys key = createApiKey(team, true, java.time.LocalDateTime.now().plusYears(1));

        savedStudent.setTeamId(team.getId());
        userRepository.save(savedStudent);

        mockMvc.perform(get("/user/dashboard")
                        .param("email", "student@test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasTeam").value(true))
                .andExpect(jsonPath("$.teamName").value("DashTeam"))
                .andExpect(jsonPath("$.apiKey").isNotEmpty());
    }

    @Test
    void dashboard_unknownEmail_returns404() throws Exception {
        mockMvc.perform(get("/user/dashboard")
                        .param("email", "ghost@test.com"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getAllUsers_withAdminToken_returnsList() throws Exception {
        mockMvc.perform(get("/user/all")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    void getAllUsers_withoutAuth_returns403() throws Exception {
        mockMvc.perform(get("/user/all"))
                .andExpect(status().isForbidden());
    }
}
