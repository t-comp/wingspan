package fs3.wingspan.controller;


import fs3.wingspan.dto.CreateTagRequest;
import fs3.wingspan.dto.TagDTO;
import fs3.wingspan.dto.UpdateTagRequest;
import fs3.wingspan.model.Tags;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.repository.TagRepository;
import fs3.wingspan.services.TagsService;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tags")
@Validated
@Slf4j
public class TagsController {

    @Autowired
    private TagsService tagsService;

    /**
     * Get all tags
     * GET /tags
     */
    @GetMapping
    public ResponseEntity<List<TagDTO>> getAllTags(){
        List<Tags> tags = tagsService.getAllTags();
        List<TagDTO> tagDTOS = tags.stream()
                .map(TagDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tagDTOS);
    }

    /**
     * Get tags by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<TagDTO>> getTagsByCategory(@PathVariable String category){
        List<Tags> tags = tagsService.getTagsByCategory(category);

        if(tags.isEmpty()){
            return ResponseEntity.notFound().build();
        }

        List<TagDTO> tagDTOS = tags.stream()
                .map(TagDTO::from)
                .toList();
        return ResponseEntity.ok(tagDTOS);
    }

    /**
     * Get single tag by ID
     * GET /api/v1/tags/{tagId}
     */
    @GetMapping("/{tagId}")
    public ResponseEntity<TagDTO> getTagById(@PathVariable Integer tagId){
        try{
            Tags tag = tagsService.getTagById(tagId);
            return ResponseEntity.ok(TagDTO.from(tag));
        }catch (RuntimeException e){
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create a New Tag
     */
    @PostMapping("/admin")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createTag(@RequestBody CreateTagRequest request) {
        try{
            Tags tag = tagsService.createTag(request.getName(), request.getCategory());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(TagDTO.from(tag));
        }catch (IllegalArgumentException e){
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Update existing tag
     */
    @PutMapping("/admin/{tagId}")
   // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateTag(
            @PathVariable Integer tagId,
            @RequestBody UpdateTagRequest request) {
        try{
            Tags updatedTag = tagsService.updateTag(tagId, request.getName(), request.getCategory());
            return ResponseEntity.ok(TagDTO.from(updatedTag));
        }catch(RuntimeException e){
            if(e.getMessage().contains("not found")){
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));

        }
    }

    /**
     * Delete tag
     */
    @DeleteMapping("/admin/{tagId}")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTag(@PathVariable Integer tagId){
        try{
            tagsService.deleteTag(tagId);
            return ResponseEntity.ok(Map.of("message", "tag deleted successfully"));
        }catch(RuntimeException e){
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Add tag to image
     */
    @PostMapping("/{tagId}/images/{imageId}")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addTagToImage(
            @PathVariable Integer tagId,
            @PathVariable Integer imageId){
        try{
            tagsService.addTagToImage(tagId, imageId);
            return ResponseEntity.ok(Map.of("message", "tag added to image successfully"));
        }catch(RuntimeException e){
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Remove tag from image
     */
    @DeleteMapping("/{tagId}/images/{imageId}")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeTagFromImage(
            @PathVariable Integer tagId,
            @PathVariable Integer imageId){
        try{
            tagsService.removeTagFromImage(tagId, imageId);
            return ResponseEntity.ok(Map.of("message", "tag removed from image successfully"));
        }catch (RuntimeException e){
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Bulk create tags
     */
    @PostMapping("/admin/bulk")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TagDTO>> bulkCreateTags(
            @RequestBody List<CreateTagRequest> requests){
        List<Tags> createdTags = tagsService.bulkCreateTags(requests);
        List<TagDTO> tagDTOS = createdTags.stream()
                .map(TagDTO::from)
                .toList();

        return ResponseEntity.status(HttpStatus.CREATED).body(tagDTOS);
    }


}
