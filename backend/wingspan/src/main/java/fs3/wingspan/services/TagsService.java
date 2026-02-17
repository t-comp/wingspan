package fs3.wingspan.services;

import fs3.wingspan.dto.CreateTagRequest;
import fs3.wingspan.model.Image;
import fs3.wingspan.model.Tags;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.repository.TagRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;


@Service
@Slf4j
public class TagsService {

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private ImageRepository imageRepository;

    /**
     * Get all tags
     */
    public List<Tags> getAllTags(){
        return tagRepository.findAll();
    }

    /**
     * Get all Tags in a category
     * @param category
     * @return
     */
    public List<Tags> getTagsByCategory(String category) {
        return tagRepository.findByCategory(category);
    }

    /**
     * Get Tag by ID
     */
    public Tags getTagById(Integer tagId) {
        return tagRepository.findById(tagId)
                .orElseThrow(() -> new RuntimeException("Tag not found with given id: " + tagId));
    }

    /**
     * Create new tag
     */
    @Transactional
    public Tags createTag(String name, String category){
        if(tagRepository.existsByNameAndCategory(name, category)){
            throw new IllegalArgumentException(
                    "Tag already exists with given name " + name + ", in category: " + category);
        }

        Tags tag = new Tags();
        tag.setName(name);
        tag.setCategory(category);

        Tags savedTag = tagRepository.save(tag);

        log.info("Tag created: id={}, name={}, category={}", savedTag.getId(), savedTag.getName(), savedTag.getCategory());
        return savedTag;
    }

    /**
     * Update tag
     */
    @Transactional
    public Tags updateTag(Integer tagId, String name, String category){
        Tags tag = getTagById(tagId);
        if(tagRepository.existsByNameAndCategory(name, category)){
            Tags existing = tagRepository.findByNameAndCategory(name, category);
            if(existing != null && existing.getId() == tagId){
                throw new IllegalArgumentException("Tag not found with given name " + name + ", in category: " + category);
            }
        }

        tag.setName(name);
        tag.setCategory(category);
        return tagRepository.save(tag);
    }

    /**
     * Delete Tag
     */
    @Transactional
    public void deleteTag(Integer tagId) {
        Tags tag = getTagById(tagId);

        for(Image image : tag.getImages()){
            image.removeTag(tag);
        }

        tagRepository.delete(tag);

        log.info("Tag deleted: id={}, name={}", tagId, tag.getName());
    }

    /**
     * Add tag to image
     */
    @Transactional
    public void addTagToImage(Integer tagId, Integer imageId) {
        Image image = imageRepository.findById(imageId).orElseThrow(() -> new RuntimeException("Image not found"));
        Tags tag = getTagById(tagId);

        image.addTag(tag);
        imageRepository.save(image);

        log.info("Added tag {} to image {}", tagId, imageId);
    }

    /**
     * Remove tag from image
     */
    public void removeTagFromImage(Integer tagId, Integer imageId) {
        Image image = imageRepository.findById(imageId).orElseThrow(() -> new RuntimeException("Image not found"));
        Tags tag = getTagById(tagId);

        image.removeTag(tag);
        imageRepository.save(image);

        log.info("Removed tag {} from image {}", tagId, imageId);
    }

    /**
     * Get all images with a specific tag
     */
    public List<Image> getImagesByTag(Integer tagId) {
        Tags tag = getTagById(tagId);
        return List.copyOf(tag.getImages());
    }

    /**
     * Get all images in a category
     */
    public List<Image> getImagesByCategory(String category) {
        return imageRepository.findByTagCategory(category);
    }

    /**
     * Bulk create tags
     */
    @Transactional
    public List<Tags> bulkCreateTags(List<CreateTagRequest> requests) {
        return requests.stream()
                .map(req -> {
                    try {
                        return createTag(req.getName(), req.getCategory());
                    } catch (IllegalArgumentException e) {
                        log.warn("Skipping duplicate tag: {}", req.getName());
                        return null;
                    }
                })
                .filter(tag -> tag != null)
                .toList();
    }
}

