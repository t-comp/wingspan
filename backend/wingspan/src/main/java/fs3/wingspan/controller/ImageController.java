package fs3.wingspan.controller;

import fs3.wingspan.dto.ImageDTO;
import fs3.wingspan.dto.MessageResponse;
import fs3.wingspan.model.Image;
import fs3.wingspan.model.Species;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.repository.SpeciesRepository;
import fs3.wingspan.services.ImageStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/images")
@Validated
public class ImageController {

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private ImageStorageService imageStorageService;

    @Autowired
    private SpeciesRepository speciesRepository;

    /**
     * Upload a single image
     * POST /images/admin/upload
     */
    @PostMapping(value = "/admin/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file,
                                         @RequestParam int species_id,
                                         @RequestParam(required = false) String life_cycle,
                                         @RequestParam(required = false) String description,
                                         @RequestParam(required = false) String nathansNotes,
                                         @RequestParam(required = false) List<Integer> tagId){
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "File is empty"));
        }

        try {
            Image savedImage = imageStorageService.saveImage(file, species_id, life_cycle, description, nathansNotes, tagId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ImageDTO.fromImage(savedImage));
        }catch(RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Upload failed"));
        }
    }

    /**
     * Bulk upload multiple images to the same species
     * POST /images/admin/upload-bulk
     */
    @PostMapping(value = "/admin/upload-bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> uploadBulk(@RequestParam("files") List<MultipartFile> files, @RequestParam int species_id, @RequestParam(required = false) String life_cycle,
                                        @RequestParam(required = false) String description, @RequestParam(required = false) String nathansNotes, @RequestParam(required = false) List<Integer> tagId) {
        if(files == null || files.isEmpty()){
            return ResponseEntity.badRequest().body(Map.of("message", "No files provided"));
        }

        List<ImageDTO> u = new ArrayList<>();
        List<String> fail = new ArrayList<>();

        for(MultipartFile file : files){
            if(file.isEmpty()){
                fail.add(file.getOriginalFilename() + " (empty file)");
                continue;
            }
            try{
                Image saved = imageStorageService.saveImage(file, species_id, life_cycle, description, nathansNotes, tagId);
                u.add(ImageDTO.fromImage(saved));
            }catch(Exception e){
                fail.add(file.getOriginalFilename() + ": " + e.getMessage());
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("uploaded", u);
        res.put("uploadedCount", u.size());
        res.put("failed", fail);
        res.put("failedCount", fail.size());

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    /**
     * Get image by ID
     * GET /images/{imageId}
     */
    @GetMapping("/{imageId}")
    public ResponseEntity<ImageDTO> getImageByID(@PathVariable Integer imageId) {
        try{
            Image i = imageStorageService.getImageById(imageId);
            return ResponseEntity.ok(ImageDTO.fromImage(i));
        }catch(RuntimeException e){
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all images for a species by ID
     * GET /images/species/{speciesId}
     */
    @GetMapping("/species/{speciesId}")
    public ResponseEntity<List<ImageDTO>> getImagesBySpecies(@PathVariable Integer speciesId) {
        List<Image> images = imageRepository.findBySpeciesId(speciesId);
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromImage).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get all images for a species by common name or scientific name
     * GET /images/species/name/{name}
     */
    @GetMapping("/species/name/{name}")
    public ResponseEntity<?> getImagesBySpeciesName(@PathVariable String name,
                                                    @RequestParam(required = false) String lifecyclestage) {
        Species species = speciesRepository.findByNameOrScientificName(name, name);
        if(species == null){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Species not found"));
        }
        List<Image> images = lifecyclestage != null
                ? imageRepository.findBySpeciesIdAndLifecyclestage(species.getId(), lifecyclestage)
                : imageRepository.findBySpeciesId(species.getId());

        if(images.isEmpty()){
            return ResponseEntity.notFound().build();
        }

        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromImage).toList();
        return ResponseEntity.ok(dtos);
    }


    /**
     * Filter images within a species by tag IDs
     * GET /images/species/{speciesId}/filter?tagIds=1,2,3
     */
    @GetMapping("/species/{speciesId}/filter")
    public ResponseEntity<List<ImageDTO>> filterImagesBySpeciesAndTags(
            @PathVariable Integer speciesId,
            @RequestParam(required = false) List<Integer> tagIds,
            @RequestParam(required = false) String tagNames,
            @RequestParam(required = false, defaultValue = "false") boolean featured) {

        List<Image> images;

        if(tagNames != null && !tagNames.isEmpty()){
            List<String> nameList = Arrays.stream(tagNames.split(","))
                    .map(String::trim)
                    .collect(Collectors.toList());
            images = imageStorageService.filterBySpeciesAndTagNames(speciesId, nameList, featured);
        } else if(tagIds != null && !tagIds.isEmpty()){
            images = imageStorageService.filterBySpeciesAndTagIds(speciesId, tagIds);
        } else {
            images = imageRepository.findBySpeciesId(speciesId);
        }

        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromImage).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Filter images within a species by name + tag names + optional featured
     * GET /images/species/name/{name}/filter?tagNames=wings-open,male&featured=true
     */
    @GetMapping("/species/name/{name}/filter")
    public ResponseEntity<?> filterImagesBySpeciesNameAndTags(
            @PathVariable String name,
            @RequestParam(required = false) String tagNames,
            @RequestParam(required = false, defaultValue = "false") boolean featured) {

        Species species = speciesRepository.findByNameOrScientificName(name, name);
        if(species == null){
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Species not found"));
        }

        List<Image> images;
        if(tagNames != null && !tagNames.isEmpty()){
            List<String> nameList = Arrays.stream(tagNames.split(","))
                    .map(String::trim)
                    .collect(Collectors.toList());
            images = imageStorageService.filterBySpeciesAndTagNames(species.getId(), nameList, featured);
        } else {
            images = imageRepository.findBySpeciesId(species.getId());
        }

        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromImage).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Filter images by tags (image must have ALL specified tags)
     * GET /images/filter?tagIds=
     */
    @GetMapping("/filter")
    public ResponseEntity<List<ImageDTO>> filterImagesByTags(@RequestParam List<Integer> tagIds) {
        List<Image> images = imageStorageService.filterByAllTags(tagIds);
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromImage).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Set an image as featured for its species + tag combination
     * auto unmarks any previously featured image for the same combo
     * PUT /images/admin/{imageId}/featured
     */
    @PutMapping("/admin/{imageId}/featured")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> setFeatured(@PathVariable int imageId) {
        try{
            Image updated = imageStorageService.setFeatured(imageId);
            return ResponseEntity.ok(ImageDTO.fromImage(updated));
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Unset featured on an image
     * DELETE /images/admin/{imageId}/featured
     */
    @DeleteMapping("/admin/{imageId}/featured")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> unsetFeatured(@PathVariable int imageId) {
        try{
            Image updated = imageStorageService.unsetFeatured(imageId);
            return ResponseEntity.ok(ImageDTO.fromImage(updated));
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Edit any attribute of an existing image
     * PATCH /images/admin/{imageId}
     */
    @PatchMapping("/admin/{imageId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> editImage(@PathVariable int imageId, @RequestParam(required = false) String description, @RequestParam(required = false) String nathansNotes,
                                       @RequestParam(required = false) String life_cycle, @RequestParam(required = false) Integer species_id, @RequestParam(required = false) List<Integer> tagIds) {
        try{
            Image u = imageStorageService.updateImage(imageId, description, nathansNotes, life_cycle, species_id, tagIds);
            return ResponseEntity.ok(ImageDTO.fromImage(u));
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Merge attributes onto a single image
     * PUT /images/admin/{imageId}/attributes
     */
    @PutMapping("/admin/{imageId}/attributes")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> mergeImageAttributes(@PathVariable int imageId, @RequestBody Map<String, String> attributes) {
        try{
            Image u = imageStorageService.mergeAttributes(imageId, attributes);
            return ResponseEntity.ok(ImageDTO.fromImage(u));
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Merge same attributes onto a list of images
     * PUT /images/admin/bulk-attributes
     */
    @PutMapping("/admin/bulk-attributes")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> bulkMergeAttributes(@RequestBody Map<String, Object> request) {
        try{
            List<Integer> imageIds = (List<Integer>) request.get("imageIds");
            Map<String, String> ats = (Map<String, String>) request.get("attributes");

            if(imageIds == null || imageIds.isEmpty()){
                return ResponseEntity.badRequest().body(Map.of("message", "imageIds are required"));
            }
            if(ats == null || ats.isEmpty()){
                return ResponseEntity.badRequest().body(Map.of("message", "attributes are required"));
            }

            List<Image> u = imageStorageService.bulkMergeAttributes(imageIds, ats);
            List<ImageDTO> dtos = u.stream().map(ImageDTO::fromImage).toList();
            return ResponseEntity.ok(dtos);
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Merge same attributes onto all images of a species
     * PUT /images/admin/species/{speciesId}/attributes
     */
    @PutMapping("/admin/species/{speciesId}/attributes")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> bulkMergeAttributesBySpecies(@PathVariable int speciesId, @RequestBody Map<String, String> attributes) {
        try{
            List<Image> u = imageStorageService.bulkMergeAttributesBySpecies(speciesId, attributes);
            List<ImageDTO> dtos = u.stream().map(ImageDTO::fromImage).toList();
            return ResponseEntity.ok(dtos);
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Remove specific attribute keys from a single image
     * DELETE /images/admin/{imageId}/attributes
     */
    @DeleteMapping("/admin/{imageId}/attributes")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> removeImageAttributes(@PathVariable int imageId, @RequestBody Map<String, List<String>> request) {
        try{
            List<String> keys = request.get("keys");
            if(keys == null || keys.isEmpty()){
                return ResponseEntity.badRequest().body(Map.of("message", "keys are required"));
            }
            Image u = imageStorageService.removeAttributes(imageId, keys);
            return ResponseEntity.ok(ImageDTO.fromImage(u));
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Remove specific attribute keys from a list of images
     * DELETE /images/admin/bulk-attributes
     */
    @DeleteMapping("/admin/bulk-attributes")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> bulkRemoveAttributes(@RequestBody Map<String, Object> request) {
        try{
            List<Integer> imageIds = (List<Integer>) request.get("imageIds");
            List<String> ks = (List<String>) request.get("keys");

            if(imageIds == null || imageIds.isEmpty()){
                return ResponseEntity.badRequest().body(Map.of("message", "imageIds are required"));
            }
            if(ks == null || ks.isEmpty()){
                return ResponseEntity.badRequest().body(Map.of("message", "keys are required"));
            }

            List<Image> u = imageStorageService.bulkRemoveAttributes(imageIds, ks);
            List<ImageDTO> dtos = u.stream().map(ImageDTO::fromImage).toList();
            return ResponseEntity.ok(dtos);
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Clear all attributes from a single image
     * DELETE /images/admin/{imageId}/attributes/all
     */
    @DeleteMapping("/admin/{imageId}/attributes/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> clearImageAttributes(@PathVariable int imageId) {
        try{
            Image u = imageStorageService.clearAttributes(imageId);
            return ResponseEntity.ok(ImageDTO.fromImage(u));
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Delete image from database and storage
     * DELETE /images/admin/{imageId}
     */
    @DeleteMapping("/admin/{imageId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteImage(@PathVariable Integer imageId) {
        try{
            imageStorageService.deleteImage(imageId);
            return ResponseEntity.ok(Map.of("message", "Image deleted"));
        }catch(RuntimeException e){
            return ResponseEntity.notFound().build();
        }catch(IOException e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Delete failed"));
        }
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of("message", "File too large. Maximum size is 20MB."));
    }
}