package fs3.wingspan.filter;

import fs3.wingspan.AbstractIntegrationTest;
import fs3.wingspan.model.APIKeys;
import fs3.wingspan.model.Species;
import fs3.wingspan.model.Teams;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Exercises APIKeyFilter: valid / invalid / inactive / expired keys,
 * and the read-only (GET-only) constraint.
 */
class APIKeyFilterTest extends AbstractIntegrationTest {

    private APIKeys validKey;
    private Species testSpecies;

    @BeforeEach
    void setUpFilterData() {
        Teams team = createTeam("FilterTeam", "FilterProject", "Fall 2025");
        validKey   = createApiKey(team, true, LocalDateTime.now().plusYears(1));

        testSpecies = createSpecies("Papilio troilus");

        // A persisted image so GET /images/{id} has something to return
        fs3.wingspan.model.Image img = new fs3.wingspan.model.Image();
        img.setSpecies(testSpecies);
        img.setFilename("filter-test.png");
        img.setDisplayUrl("http://cdn.test/filter-test.png");
        img.setOriginalUrl("http://cdn.test/filter-test_original.png");
        img.setFsize(BigInteger.valueOf(512));
        imageRepository.save(img);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Valid key → GET succeeds
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void validKey_getRequest_returns200() throws Exception {
        mockMvc.perform(get("/species/all")
                        .header("X-API-Key", validKey.getKeyVal()))
                .andExpect(status().isOk());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Invalid (non-existent) key → 401
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void invalidKey_returns401() throws Exception {
        mockMvc.perform(get("/species/all")
                        .header("X-API-Key", "rgds_notarealkey"))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Inactive key → 401
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void inactiveKey_returns401() throws Exception {
        Teams t2  = createTeam("InactiveTeam", "X", "S26");
        APIKeys ik = createApiKey(t2, false, LocalDateTime.now().plusYears(1));

        mockMvc.perform(get("/species/all")
                        .header("X-API-Key", ik.getKeyVal()))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Expired key → 401
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void expiredKey_returns401() throws Exception {
        Teams t3   = createTeam("ExpiredTeam", "X", "S26");
        APIKeys ek = createApiKey(t3, true, LocalDateTime.now().minusDays(1));

        mockMvc.perform(get("/species/all")
                        .header("X-API-Key", ek.getKeyVal()))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // API key only allows GET; POST → 403
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void validKey_postRequest_returns403() throws Exception {
        mockMvc.perform(post("/species/create")
                        .header("X-API-Key", validKey.getKeyVal())
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"ShouldFail\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void validKey_putRequest_returns403() throws Exception {
        mockMvc.perform(put("/species/{id}/update", testSpecies.getId())
                        .header("X-API-Key", validKey.getKeyVal())
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"ShouldFail\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void validKey_deleteRequest_returns403() throws Exception {
        mockMvc.perform(delete("/species/{id}", testSpecies.getId())
                        .header("X-API-Key", validKey.getKeyVal()))
                .andExpect(status().isForbidden());
    }
}
