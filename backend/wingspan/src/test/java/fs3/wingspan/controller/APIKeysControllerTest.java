//package fs3.wingspan.controller;
//
//import fs3.wingspan.AbstractIntegrationTest;
//import fs3.wingspan.model.APIKeys;
//import fs3.wingspan.model.Teams;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.springframework.http.MediaType;
//
//import java.time.LocalDateTime;
//
//import static org.hamcrest.Matchers.*;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
//class APIKeysControllerTest extends AbstractIntegrationTest {
//
//    private Teams   team;
//    private APIKeys activeKey;
//    private APIKeys inactiveKey;
//
//    @BeforeEach
//    void setUpKeyData() {
//        team        = createTeam("KeyTeam", "KeyProject", "Fall 2025");
//        activeKey   = createApiKey(team, true,  LocalDateTime.now().plusYears(1));
//        inactiveKey = createApiKey(team, false, LocalDateTime.now().plusYears(1));
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // POST /api-key/keygen  – ADMIN required
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void generateKey_withAdminToken_returns201() throws Exception {
//        String body = """
//                {"teamName":"NewTeam","projectName":"NewProj","semester":"S26"}
//                """;
//        mockMvc.perform(post("/api-key/keygen")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isCreated())
//                .andExpect(jsonPath("$.message", containsString("rgds_")));
//    }
//
//    @Test
//    void generateKey_withoutAuth_returns403() throws Exception {
//        String body = """
//                {"teamName":"NewTeam","projectName":"X","semester":"S26"}
//                """;
//        mockMvc.perform(post("/api-key/keygen")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body))
//                .andExpect(status().isForbidden());
//    }
//
//    @Test
//    void generateKey_missingTeamName_returns400() throws Exception {
//        String body = """
//                {"projectName":"X","semester":"S26"}
//                """;
//        mockMvc.perform(post("/api-key/keygen")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isBadRequest());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // GET /api-key/all  – ADMIN required
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void getAllKeys_withAdminToken_returnsList() throws Exception {
//        mockMvc.perform(get("/api-key/all")
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));
//    }
//
//    @Test
//    void getAllKeys_withoutAuth_returns403() throws Exception {
//        mockMvc.perform(get("/api-key/all"))
//                .andExpect(status().isForbidden());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // GET /api-key/active
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void getActiveKeys_returnsOnlyActive() throws Exception {
//        mockMvc.perform(get("/api-key/active")
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[*].active", everyItem(is(true))));
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // PUT /{keyId}/deactivate
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void deactivateKey_activeKey_becomesInactive() throws Exception {
//        mockMvc.perform(put("/api-key/{id}/deactivate", activeKey.getId())
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("deactivated")));
//
//        // Verify in DB
//        APIKeys updated = apiKeyRepository.findById(activeKey.getId()).orElseThrow();
//        assert !updated.getActive();
//    }
//
//    @Test
//    void deactivateKey_unknownId_returns404() throws Exception {
//        mockMvc.perform(put("/api-key/{id}/deactivate", 999999)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isNotFound());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // PUT /{keyId}/activate
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void activateKey_inactiveKey_becomesActive() throws Exception {
//        mockMvc.perform(put("/api-key/{id}/activate", inactiveKey.getId())
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("reactivated")));
//
//        APIKeys updated = apiKeyRepository.findById(inactiveKey.getId()).orElseThrow();
//        assert updated.getActive();
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // PUT /{keyId}/extra-time
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void extendExpiration_byMonths_expirationUpdated() throws Exception {
//        LocalDateTime before = apiKeyRepository.findById(activeKey.getId())
//                .orElseThrow().getExpiration();
//
//        mockMvc.perform(put("/api-key/{id}/extra-time", activeKey.getId())
//                        .param("months", "6")
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("extended until")));
//
//        LocalDateTime after = apiKeyRepository.findById(activeKey.getId())
//                .orElseThrow().getExpiration();
//
//        assert after.isAfter(before);
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // DELETE /{keyId}
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void deleteKey_byId_removedFromDb() throws Exception {
//        int keyId = activeKey.getId();
//
//        mockMvc.perform(delete("/api-key/{id}", keyId)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("deleted")));
//
//        assert apiKeyRepository.findById(keyId).isEmpty();
//    }
//
//    @Test
//    void deleteKey_unknownId_returns404() throws Exception {
//        mockMvc.perform(delete("/api-key/{id}", 999999)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isNotFound());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // PUT /deactivate/team/{teamName}  – deactivate all keys for a team
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void deactivateByTeam_deactivatesAllActiveKeys() throws Exception {
//        mockMvc.perform(put("/api-key/deactivate/team/{name}", team.getName())
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", matchesPattern(".*\\d+ API key.*deactivated.*")));
//    }
//}
