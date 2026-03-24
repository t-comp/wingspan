package fs3.wingspan.controller;

import fs3.wingspan.dto.ImageDTO;
import fs3.wingspan.model.*;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.services.ImageStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/images")
@Validated
public class ImageController {

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private ImageStorageService imageStorageService;


    /**
     * Upload one image
     * POST /images/admin/upload
     */
    @PostMapping(value = "/admin/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file, @RequestParam int species_id, @RequestParam(required = false) String life_cycle,
                                         @RequestParam(required = false) String description,
                                         @RequestParam(required = false) String nathansNotes,
                                         @RequestParam(required = false) List<Integer> tagId) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "File is empty"));
        }

        try {
            Image savedImage = imageStorageService.saveImage(file, species_id, life_cycle, description, nathansNotes, tagId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ImageDTO.fromImage(savedImage));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Upload failed"));
        }
    }

    /**
     * Get image by image id
     * GET /{imageId}
     */
    @GetMapping("/{imageId}")
    public ResponseEntity<ImageDTO> getImageByID(@PathVariable Integer imageId) {
        try {
            Image i = imageStorageService.getImageById(imageId);
            return ResponseEntity.ok(ImageDTO.fromImage(i));
        }catch(RuntimeException e){
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete image by image id
     * DELETE /admin/delete-image
     */
    @DeleteMapping("/admin/{imageId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteImage(@PathVariable Integer imageId) {
        try{
            imageStorageService.deleteImage(imageId);
            return ResponseEntity.ok(Map.of("message", "Image deleted"));
        }catch(RuntimeException e){
            return ResponseEntity.notFound().build();
        }catch (IOException e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Delete failed"));
        }

    }

    /**
     * Edit the image nathans notes
     * POST /admin/edit-nathansnotes
     */
    @PatchMapping("/admin/{imageId}/description")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ImageDTO> updateDescription(@PathVariable int imageId,
                                                      @RequestParam String description,
                                                      @RequestParam(required = false) String nathansNotes) {
        try{
            Image updated = imageStorageService.updateImage(imageId, description, nathansNotes);
            return ResponseEntity.ok(ImageDTO.fromImage(updated));
        }catch(RuntimeException e){
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Filter images by tags (image must have ALL specified tags
     */
    @GetMapping("/filter")
    public ResponseEntity<List<ImageDTO>> filterImagesByTags(
            @RequestParam List<Integer> tagIds
    ){
        List<Image> images = imageStorageService.filterByAllTags(tagIds);
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromImage).toList();

        return ResponseEntity.ok(dtos);
    }

    /**
     * get all images for a species
     * GET /images/species/{speciesId}
     */
    @GetMapping("/species/{speciesId}")
    public ResponseEntity<List<ImageDTO>> getImagesBySpecies(@PathVariable Integer speciesId) {
        List<Image> images = imageRepository.findBySpeciesId(speciesId);
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromImage).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * set attribute values on an image
     * PUT /images/admin/{imageId}/attributes
     */
    @PutMapping("/admin/{imageId}/attributes")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> setImageAttributes(@PathVariable int imageId, @RequestBody Map<String, String> attributes) {
        Image image = imageRepository.findById(imageId).orElse(null);
        if (image == null) {
            return ResponseEntity.notFound().build();
        }
        image.setAttributes(attributes);
        imageRepository.save(image);
        return ResponseEntity.ok(ImageDTO.fromImage(image));
    }

    /**
     * bulk upload multiple images to the same species
     * POST /images/admin/upload-bulk
     * all images get the same species_id, life_cycle, nathansNotes, and tags
     */
    @PostMapping(value = "/admin/upload-bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> uploadBulk(@RequestParam("files") List<MultipartFile> files, @RequestParam int species_id,
                                        @RequestParam(required = false) String life_cycle,
                                        @RequestParam(required = false) String nathansNotes,
                                        @RequestParam(required = false) List<Integer> tagId) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "No files provided"));
        }

        List<ImageDTO> uploaded = new ArrayList<>();
        List<String> failed = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                failed.add(file.getOriginalFilename() + " (empty file)");
                continue;
            }
            try {
                Image saved = imageStorageService.saveImage(file, species_id, life_cycle, null, nathansNotes, tagId);
                uploaded.add(ImageDTO.fromImage(saved));
            } catch (Exception e) {
                failed.add(file.getOriginalFilename() + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("uploaded", uploaded);
        result.put("uploadedCount", uploaded.size());
        result.put("failed", failed);
        result.put("failedCount", failed.size());

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }


}