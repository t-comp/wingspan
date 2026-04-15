//package fs3.wingspan.controller;
//
//import fs3.wingspan.AbstractIntegrationTest;
//import fs3.wingspan.model.Teams;
//import fs3.wingspan.model.UType;
//import fs3.wingspan.model.Users;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.springframework.http.MediaType;
//
//import java.util.Map;
//
//import static org.hamcrest.Matchers.*;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
//class TeamsControllerTest extends AbstractIntegrationTest {
//
//    private Teams existingTeam;
//    private Users unassignedStudent;
//
//    @BeforeEach
//    void setUpTeamData() {
//        existingTeam = createTeam("AlphaTeam", "AlphaProject", "Fall 2025");
//        unassignedStudent = createUser("freestudent", "free@test.com", UType.STUDENT);
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // POST /teams/create
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void createTeam_withAdminToken_returns201WithApiKey() throws Exception {
//        String body = """
//                {"name":"BetaTeam","projectName":"BetaProject","semester":"Spring 2026"}
//                """;
//        mockMvc.perform(post("/teams/create")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isCreated())
//                .andExpect(jsonPath("$.apiKey", startsWith("rgds_")))
//                .andExpect(jsonPath("$.team.name").value("BetaTeam"));
//    }
//
//    @Test
//    void createTeam_withoutAuth_returns403() throws Exception {
//        String body = """
//                {"name":"GammaTeam","projectName":"X","semester":"S26"}
//                """;
//        mockMvc.perform(post("/teams/create")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body))
//                .andExpect(status().isForbidden());
//    }
//
//    @Test
//    void createTeam_duplicateName_returns409() throws Exception {
//        // "AlphaTeam" already created in @BeforeEach
//        String body = """
//                {"name":"AlphaTeam","projectName":"Another","semester":"F26"}
//                """;
//        mockMvc.perform(post("/teams/create")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isConflict())
//                .andExpect(jsonPath("$.message", containsString("already exists")));
//    }
//
//    @Test
//    void createTeam_autoGeneratesApiKey() throws Exception {
//        String body = """
//                {"name":"DeltaTeam","projectName":"DeltaProj","semester":"S26"}
//                """;
//        mockMvc.perform(post("/teams/create")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isCreated())
//                .andExpect(jsonPath("$.apiKey", matchesPattern("rgds_[a-f0-9]{32}")));
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // GET /teams/all
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void getAllTeams_withAdminToken_returnsList() throws Exception {
//        mockMvc.perform(get("/teams/all")
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
//    }
//
//    @Test
//    void getAllTeams_withoutAuth_returns403() throws Exception {
//        mockMvc.perform(get("/teams/all"))
//                .andExpect(status().isForbidden());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // PUT /teams/{teamId}/add-member
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void addMember_validIds_assignsUser() throws Exception {
//        String body = objectMapper.writeValueAsString(Map.of("userId", unassignedStudent.getId()));
//
//        mockMvc.perform(put("/teams/{teamId}/add-member", existingTeam.getId())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("added to team")));
//    }
//
//    @Test
//    void addMember_unknownTeam_returns404() throws Exception {
//        String body = objectMapper.writeValueAsString(Map.of("userId", unassignedStudent.getId()));
//
//        mockMvc.perform(put("/teams/{teamId}/add-member", 999999)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isNotFound());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // PUT /teams/{teamId}/remove-member
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void removeMember_assignedUser_unassigns() throws Exception {
//        // Assign first
//        unassignedStudent.setTeamId(existingTeam.getId());
//        userRepository.save(unassignedStudent);
//
//        String body = objectMapper.writeValueAsString(Map.of("userId", unassignedStudent.getId()));
//
//        mockMvc.perform(put("/teams/{teamId}/remove-member", existingTeam.getId())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("removed from team")));
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // DELETE /teams/{teamId}  – unassigns all members
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void deleteTeam_unassignsAllMembers() throws Exception {
//        // Assign student to team
//        savedStudent.setTeamId(existingTeam.getId());
//        userRepository.save(savedStudent);
//
//        mockMvc.perform(delete("/teams/{teamId}", existingTeam.getId())
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("deleted")));
//
//        // Verify member was unassigned
//        Users refreshed = userRepository.findById(savedStudent.getId()).orElseThrow();
//        assert refreshed.getTeamId() == null;
//    }
//
//    @Test
//    void deleteTeam_withoutAuth_returns403() throws Exception {
//        mockMvc.perform(delete("/teams/{teamId}", existingTeam.getId()))
//                .andExpect(status().isForbidden());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // GET /teams/unassigned-students
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void getUnassignedStudents_returnsOnlyUnassigned() throws Exception {
//        // Assign the base student to a team
//        savedStudent.setTeamId(existingTeam.getId());
//        userRepository.save(savedStudent);
//
//        // unassignedStudent has no team
//        mockMvc.perform(get("/teams/unassigned-students")
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[*].username", hasItem("freestudent")))
//                .andExpect(jsonPath("$[*].username", not(hasItem("teststudent"))));
//    }
//
//    @Test
//    void getUnassignedStudents_withoutAuth_returns403() throws Exception {
//        mockMvc.perform(get("/teams/unassigned-students"))
//                .andExpect(status().isForbidden());
//    }
//}
