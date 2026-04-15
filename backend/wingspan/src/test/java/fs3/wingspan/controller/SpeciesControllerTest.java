//package fs3.wingspan.controller;
//
//import fs3.wingspan.AbstractIntegrationTest;
//import fs3.wingspan.model.Image;
//import fs3.wingspan.model.Species;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.springframework.http.MediaType;
//
//import java.math.BigInteger;
//import java.util.Map;
//
//import static org.hamcrest.Matchers.*;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
//class SpeciesControllerTest extends AbstractIntegrationTest {
//
//    private Species butterfly;
//    private Image   sampleImage;
//
//    @BeforeEach
//    void setUpSpeciesData() {
//        butterfly = new Species();
//        butterfly.setName("Monarch Butterfly");
//        butterfly.setScientificName("Danaus plexippus");
//        butterfly.setOrderName("Lepidoptera");
//        butterfly.setFamily("Nymphalidae");
//        butterfly.setGenus("Danaus");
//        butterfly = speciesRepository.save(butterfly);
//
//        sampleImage = new Image();
//        sampleImage.setSpecies(butterfly);
//        sampleImage.setFilename("test.png");
//        sampleImage.setDisplayUrl("http://cdn.test/test.png");
//        sampleImage.setOriginalUrl("http://cdn.test/test_original.png");
//        sampleImage.setFsize(BigInteger.valueOf(512));
//        sampleImage = imageRepository.save(sampleImage);
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // POST /species/create
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void createSpecies_withAdminToken_returns201() throws Exception {
//        String body = """
//                {"name":"Atlas Moth","scientificName":"Attacus atlas",
//                 "orderName":"Lepidoptera","family":"Saturniidae","genus":"Attacus"}
//                """;
//        mockMvc.perform(post("/species/create")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isCreated())
//                .andExpect(jsonPath("$.name").value("Atlas Moth"));
//    }
//
//    @Test
//    void createSpecies_withoutAuth_returns403() throws Exception {
//        String body = """
//                {"name":"SomeMoth"}
//                """;
//        mockMvc.perform(post("/species/create")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body))
//                .andExpect(status().isForbidden());
//    }
//
//    @Test
//    void createSpecies_duplicateName_returns409() throws Exception {
//        String body = """
//                {"name":"Monarch Butterfly"}
//                """;
//        mockMvc.perform(post("/species/create")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isConflict())
//                .andExpect(jsonPath("$.message", containsString("already exists")));
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // GET /species/all
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void getAllSpecies_returnsList() throws Exception {
//        mockMvc.perform(get("/species/all"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
//                .andExpect(jsonPath("$[*].name", hasItem("Monarch Butterfly")));
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // GET /species/{speciesId}
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void getSpeciesById_validId_returns200() throws Exception {
//        mockMvc.perform(get("/species/{id}", butterfly.getId()))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.name").value("Monarch Butterfly"))
//                .andExpect(jsonPath("$.scientificName").value("Danaus plexippus"));
//    }
//
//    @Test
//    void getSpeciesById_unknownId_returns404() throws Exception {
//        mockMvc.perform(get("/species/{id}", 999999))
//                .andExpect(status().isNotFound());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // GET /species/name/{name}
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void getSpeciesByName_exists_returns200() throws Exception {
//        mockMvc.perform(get("/species/name/{name}", "Monarch Butterfly"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.genus").value("Danaus"));
//    }
//
//    @Test
//    void getSpeciesByName_notFound_returns404() throws Exception {
//        mockMvc.perform(get("/species/name/{name}", "Ghost Bug"))
//                .andExpect(status().isNotFound());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // GET /species/filter  – any combination of taxonomy params
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void filterSpecies_byOrder_returnsMatches() throws Exception {
//        mockMvc.perform(get("/species/filter")
//                        .param("orderName", "Lepidoptera"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[*].name", hasItem("Monarch Butterfly")));
//    }
//
//    @Test
//    void filterSpecies_byOrderAndFamily_returnsMatches() throws Exception {
//        mockMvc.perform(get("/species/filter")
//                        .param("orderName", "Lepidoptera")
//                        .param("family",    "Nymphalidae"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[*].name", hasItem("Monarch Butterfly")));
//    }
//
//    @Test
//    void filterSpecies_noParams_returnsAll() throws Exception {
//        mockMvc.perform(get("/species/filter"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
//    }
//
//    @Test
//    void filterSpecies_byGenus_matchesExact() throws Exception {
//        mockMvc.perform(get("/species/filter")
//                        .param("genus", "Danaus"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[*].name", hasItem("Monarch Butterfly")));
//    }
//
//    @Test
//    void filterSpecies_nonMatchingGenus_returnsEmpty() throws Exception {
//        mockMvc.perform(get("/species/filter")
//                        .param("genus", "NonExistentGenus"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$", hasSize(0)));
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // PUT /species/{speciesId}/set-thumbnail
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void setThumbnail_validIds_returns200() throws Exception {
//        mockMvc.perform(put("/species/{id}/set-thumbnail", butterfly.getId())
//                        .param("imageId", String.valueOf(sampleImage.getId()))
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("Thumbnail set")));
//    }
//
//    @Test
//    void setThumbnail_withoutAuth_returns403() throws Exception {
//        mockMvc.perform(put("/species/{id}/set-thumbnail", butterfly.getId())
//                        .param("imageId", String.valueOf(sampleImage.getId())))
//                .andExpect(status().isForbidden());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // PUT /species/{speciesId}/remove-thumbnail – falls back to first image
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void removeThumbnail_clearsThumbnail() throws Exception {
//        // Set thumbnail first
//        butterfly.setThumbnail(sampleImage);
//        speciesRepository.save(butterfly);
//
//        mockMvc.perform(put("/species/{id}/remove-thumbnail", butterfly.getId())
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("removed")));
//
//        // After removal, get species → thumbnailFallback uses first image
//        mockMvc.perform(get("/species/{id}", butterfly.getId()))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.thumbnailUrl").value(sampleImage.getDisplayUrl()));
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // DELETE /species/{speciesId}  – cascades to images
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void deleteSpecies_cascadesToImages() throws Exception {
//        int speciesId = butterfly.getId();
//        int imageId   = sampleImage.getId();
//
//        // Clear thumbnail FK so we can delete
//        mockMvc.perform(delete("/species/{id}", speciesId)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("deleted")));
//
//        assert speciesRepository.findById(speciesId).isEmpty();
//        assert imageRepository.findById(imageId).isEmpty();
//    }
//
//    @Test
//    void deleteSpecies_withoutAuth_returns403() throws Exception {
//        mockMvc.perform(delete("/species/{id}", butterfly.getId()))
//                .andExpect(status().isForbidden());
//    }
//
//    // ══════════════════════════════════════════════════════════════════════════
//    // PUT /species/{speciesId}/attributes  &  GET /species/{speciesId}/attributes
//    // ══════════════════════════════════════════════════════════════════════════
//
//    @Test
//    void setAttributeDefinitions_persisted_retrievable() throws Exception {
//        Map<String, String> defs = Map.of("Wing Span (in)", "number", "Color", "text");
//        String body = objectMapper.writeValueAsString(defs);
//
//        mockMvc.perform(put("/species/{id}/attributes", butterfly.getId())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(body)
//                        .header("Authorization", adminToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.message", containsString("updated")));
//
//        mockMvc.perform(get("/species/{id}/attributes", butterfly.getId()))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$['Wing Span (in)']").value("number"))
//                .andExpect(jsonPath("$.Color").value("text"));
//    }
//
//    @Test
//    void setAttributeDefinitions_withoutAuth_returns403() throws Exception {
//        mockMvc.perform(put("/species/{id}/attributes", butterfly.getId())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{}"))
//                .andExpect(status().isForbidden());
//    }
//}
