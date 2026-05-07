package fs3.wingspan.controller;

import fs3.wingspan.AbstractIntegrationTest;
import fs3.wingspan.model.Image;
import fs3.wingspan.model.Species;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** NOTE: test cases were developed with the assistance of Anthropic's LLM using Claude Sonnet 4.6 and have been validated for correctness **/
class ImageControllerTest extends AbstractIntegrationTest {


    private Species testSpecies;
    private Image testImage;

    @BeforeEach
    void setUpImageData() throws Exception {
        testSpecies = createSpecies("Danaus plexippus");
        testImage   = createPersistedImage(testSpecies, "lifecycle-a");
    }

    @Test
    void upload_withAdminToken_returns201() throws Exception {
        MockMultipartFile file = smallImageFile("photo.png");

        mockMvc.perform(multipart("/images/admin/upload")
                        .file(file)
                        .param("species_id", String.valueOf(testSpecies.getId()))
                        .header("Authorization", adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    void upload_withoutAuth_returns403() throws Exception {
        MockMultipartFile file = smallImageFile("photo.png");

        mockMvc.perform(multipart("/images/admin/upload")
                        .file(file)
                        .param("species_id", String.valueOf(testSpecies.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void upload_withStudentToken_returns403() throws Exception {
        MockMultipartFile file = smallImageFile("photo.png");

        mockMvc.perform(multipart("/images/admin/upload")
                        .file(file)
                        .param("species_id", String.valueOf(testSpecies.getId()))
                        .header("Authorization", studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void upload_over20MB_returns400() throws Exception {
        // 21 MB of zeros — service rejects before any S3 call
        byte[] bigBytes = new byte[21 * 1024 * 1024];
        MockMultipartFile file = new MockMultipartFile("file", "big.png", "image/png", bigBytes);

        mockMvc.perform(multipart("/images/admin/upload")
                        .file(file)
                        .param("species_id", String.valueOf(testSpecies.getId()))
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsStringIgnoringCase("20MB")));
    }

    @Test
    void uploadBulk_twoValidFiles_returnsCorrectCounts() throws Exception {
        MockMultipartFile f1 = smallImageFile("a.png");
        MockMultipartFile f2 = smallImageFile("b.png");

        mockMvc.perform(multipart("/images/admin/upload-bulk")
                        .file(f1)
                        .file(f2)
                        .param("species_id", String.valueOf(testSpecies.getId()))
                        .header("Authorization", adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.uploadedCount").value(2))
                .andExpect(jsonPath("$.failedCount").value(0))
                .andExpect(jsonPath("$.uploaded", hasSize(2)));
    }

    @Test
    void uploadBulk_oneEmptyFile_countsAsFailed() throws Exception {
        MockMultipartFile good  = smallImageFile("good.png");
        MockMultipartFile empty = new MockMultipartFile("files", "empty.png", "image/png", new byte[0]);

        mockMvc.perform(multipart("/images/admin/upload-bulk")
                        .file(good)
                        .file(empty)
                        .param("species_id", String.valueOf(testSpecies.getId()))
                        .header("Authorization", adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.uploadedCount").value(1))
                .andExpect(jsonPath("$.failedCount").value(1));
    }

    @Test
    void getById_withAdminJwt_returns200() throws Exception {
        mockMvc.perform(get("/images/{id}", testImage.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testImage.getId()));
    }

    @Test
    void getById_withApiKey_returns200() throws Exception {
        var team   = createTeam("ApiKeyTeam", "Project", "F25");
        var apiKey = createApiKey(team, true, java.time.LocalDateTime.now().plusYears(1));

        mockMvc.perform(get("/images/{id}", testImage.getId())
                        .header("X-API-Key", apiKey.getKeyVal()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testImage.getId()));
    }

    @Test
    void getById_noAuth_returns200() throws Exception {
        // GET endpoints are open (anyRequest().permitAll())
        mockMvc.perform(get("/images/{id}", testImage.getId()))
                .andExpect(status().isOk());
    }

    @Test
    void getBySpecies_returnsImagesForSpecies() throws Exception {
        mockMvc.perform(get("/images/species/{speciesId}", testSpecies.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void editImage_withAdminToken_updatesDescription() throws Exception {
        mockMvc.perform(patch("/images/admin/{id}", testImage.getId())
                        .param("description", "Updated description")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Updated description"));
    }

    @Test
    void editImage_withoutAuth_returns403() throws Exception {
        mockMvc.perform(patch("/images/admin/{id}", testImage.getId())
                        .param("description", "Sneaky"))
                .andExpect(status().isForbidden());
    }

    @Test
    void mergeAttributes_singleImage_attributesSaved() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("color", "orange", "pattern", "spotted"));

        mockMvc.perform(put("/images/admin/{id}/attributes", testImage.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attributes.color").value("orange"))
                .andExpect(jsonPath("$.attributes.pattern").value("spotted"));
    }

    @Test
    void mergeAttributes_secondCall_mergesWithExisting() throws Exception {
        mockMvc.perform(put("/images/admin/{id}/attributes", testImage.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("color", "orange")))
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(put("/images/admin/{id}/attributes", testImage.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("pattern", "solid")))
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attributes.color").value("orange"))
                .andExpect(jsonPath("$.attributes.pattern").value("solid"));
    }

    @Test
    void bulkMergeAttributes_twoImages_bothUpdated() throws Exception {
        Image second = createPersistedImage(testSpecies, "lifecycle-b");

        Map<String, Object> body = Map.of(
                "imageIds",   List.of(testImage.getId(), second.getId()),
                "attributes", Map.of("source", "bulk-test")
        );

        mockMvc.perform(put("/images/admin/bulk-attributes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].attributes.source").value("bulk-test"));
    }

    @Test
    void bulkMergeAttributes_missingIds_returns400() throws Exception {
        Map<String, Object> body = Map.of("attributes", Map.of("x", "y"));

        mockMvc.perform(put("/images/admin/bulk-attributes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsStringIgnoringCase("imageIds")));
    }

    @Test
    void removeAttributes_existingKey_removedFromImage() throws Exception {
        mockMvc.perform(put("/images/admin/{id}/attributes", testImage.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("toRemove", "yes", "keep", "me")))
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());

        String body = objectMapper.writeValueAsString(Map.of("keys", List.of("toRemove")));

        mockMvc.perform(delete("/images/admin/{id}/attributes", testImage.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attributes.toRemove").doesNotExist())
                .andExpect(jsonPath("$.attributes.keep").value("me"));
    }

    @Test
    void clearAttributes_allRemoved() throws Exception {
        // Seed attributes
        mockMvc.perform(put("/images/admin/{id}/attributes", testImage.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("a", "1", "b", "2")))
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/images/admin/{id}/attributes/all", testImage.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attributes").isEmpty());
    }


    @Test
    void deleteImage_withAdminToken_returns200() throws Exception {
        mockMvc.perform(delete("/images/admin/{id}", testImage.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("deleted")));
    }

    @Test
    void deleteImage_withoutAuth_returns403() throws Exception {
        mockMvc.perform(delete("/images/admin/{id}", testImage.getId()))
                .andExpect(status().isForbidden());
    }


    private MockMultipartFile smallImageFile(String filename) throws Exception {
        BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return new MockMultipartFile("files", filename, "image/png", baos.toByteArray());
    }

    private Image createPersistedImage(Species species, String lifecycle) {
        Image img = new Image();
        img.setSpecies(species);
        img.setFilename(java.util.UUID.randomUUID() + ".png");
        img.setDisplayUrl("http://cdn.test/" + img.getFilename());
        img.setOriginalUrl("http://cdn.test/" + img.getFilename() + "_original");
        img.setLifecyclestage(lifecycle);
        img.setFsize(BigInteger.valueOf(1024));
        return imageRepository.save(img);
    }
}
