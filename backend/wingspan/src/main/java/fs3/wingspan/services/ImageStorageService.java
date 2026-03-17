package fs3.wingspan.services;

import fs3.wingspan.model.Image;
import fs3.wingspan.model.Species;
import fs3.wingspan.model.Tags;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.repository.SpeciesRepository;
import fs3.wingspan.repository.TagRepository;
import io.awspring.cloud.s3.S3Template;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class ImageStorageService {

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private S3Template s3Template;

    @Value("${digitalocean.bucket.name}")
    private String bucketName;

    @Value("${spring.cloud.aws.endpoint}")
    private String endpoint;
    @Autowired
    private SpeciesRepository speciesRepository;

    @Autowired
    private TagRepository tagRepository;

    /**
     * Save image file to disk and metadata to database
     */
    @Transactional
    public Image saveImage(MultipartFile file, int speciesId,
                           String lifecycle_stage, String description, String nathansNotes, List<Integer> tagIds) throws IOException {
        //look up species - throws if not found
        Species species = speciesRepository.findById(speciesId).orElseThrow(() -> new RuntimeException("Species not found with id: " + speciesId));

        //generate unique filename to prevent collisions
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String safeFilename = getSafeFilename(originalFilename);
        String uniqueFilename = UUID.randomUUID() + "_" + safeFilename + extension;

        s3Template.upload(bucketName, uniqueFilename, file.getInputStream());

        String fileUrl = endpoint + "/" + bucketName + "/" + uniqueFilename;


        //Create & save entity
        Image image = new Image();
        image.setSpecies(species);
        image.setFilename(uniqueFilename);
        image.setFpath(fileUrl);
        image.setFsize(BigInteger.valueOf(file.getSize()));
        image.setLifecyclestage(lifecycle_stage);
        image.setNathansnotes(nathansNotes);
        image.setDescription(description);

        log.info("About to save - lifecycle: {}, nathansNotes: {}, description: {}",
                image.getLifecyclestage(), image.getNathansnotes(), image.getDescription());

        //extractImageDimensions(file, image);
        if(tagIds != null && !tagIds.isEmpty()){
            List<Tags> tags = tagRepository.findAllById(tagIds);
            if(tags.size() != tagIds.size()){
                throw new RuntimeException("One or more tag IDs not found.");
            }
            tags.forEach(image::addTag);
        }

        Image savedImage = imageRepository.save(image);

        log.info("Image saved successfully: id={}, filename={}", savedImage.getId(), uniqueFilename);

        return savedImage;
    }

    /**
     * Generate unique filename using UUID
     */
    private String generateUniqueFilename(String originalFilename) {
        String extension = "";
        if(originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + extension;
    }

    /**
     * update image metadata
     */
    @Transactional
    public Image updateImage(Integer imageId, String description, String nathansNotes) {
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found"));

        image.setDescription(description);
        image.setNathansnotes(nathansNotes);
        return imageRepository.save(image);
    }

    /**
     * Get image by ID
     */
    public Image getImageById(Integer imageId) {
        return imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with id: " + imageId));
    }

    /**
     * Delete image (both file and database record)
     */
    @Transactional
    public void deleteImage(Integer imageId) throws IOException {
        Image image = getImageById(imageId);

        s3Template.deleteObject(bucketName, image.getFilename());


        //delete database record
        imageRepository.delete(image);

        log.info("Image deleted: id={}", imageId);
    }

    /**
     * Possible later (extract image dimensions)
     * private void extractImageDimensions(MulitpartFile file, Image image)
     */
    private String getFileExtension(String filename){
        if(filename == null || filename.isEmpty() || !filename.contains(".")){
            return "";
        }

        return "." + filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Saves the original file name for the photos
     */
    private String getSafeFilename(String originalFilename){
        if(originalFilename == null || originalFilename.isEmpty()){
            return "upload";
        }

        String nameWithoutExtension = originalFilename.substring(0, originalFilename.lastIndexOf("."));
        return nameWithoutExtension.replaceAll("[^a-zA-Z0-9.-]", "_");
    }

    public List<Image> filterByAllTags(List<Integer> tagIds){
        if (tagIds == null || tagIds.isEmpty()) {
            return imageRepository.findAll(); // return everything if no tags specified
        }
        return imageRepository.findByAllTags(tagIds, (long) tagIds.size());
    }
}
