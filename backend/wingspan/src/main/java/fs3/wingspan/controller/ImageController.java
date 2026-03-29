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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/images")
@Validated
public class ImageController {

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private ImageStorageService imageStorageService;  //-> something for later: Separate service layer

    /**
     * Upload a new image
     * POST /admin/upload-image
     */
    @PostMapping(value = "/admin/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file,
                                         @RequestParam(required = true) int species_id,
                                         @RequestParam(required = false) String life_cycle,
                                         @RequestParam(required = false) String description,
                                         @RequestParam(required = false) String nathansNotes,
                                         @RequestParam(required = false) List<Integer> tagId){
        // Validation
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "File is empty"));
        }

        try {
            //let service handle all business logic
            Image savedImage = imageStorageService.saveImage(file, species_id, life_cycle, description, nathansNotes, tagId);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ImageDTO.fromImage(savedImage));
        }catch(RuntimeException e) {
            //Catches species not found
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
    public ResponseEntity<?> editImage(@PathVariable int imageId,
                                       @RequestParam(required = false) String description,
                                       @RequestParam(required = false) String nathansNotes,
                                       @RequestParam(required = false) String life_cycle,
                                       @RequestParam(required = false) Integer species_id,
                                       @RequestParam(required = false) List<Integer> tagIds) {
        try{
            Image updated = imageStorageService.updateImage(imageId, description, nathansNotes, life_cycle, species_id, tagIds);

            return ResponseEntity.ok(ImageDTO.fromImage(updated));
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
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

}