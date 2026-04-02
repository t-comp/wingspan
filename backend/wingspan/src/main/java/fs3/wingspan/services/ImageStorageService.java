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
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class ImageStorageService {

    // MB size range thresholds in bytes
    private static final long MAX_FILE_SIZE    = 20 * 1024 * 1024;  // 20MB - reject over this
    private static final long LARGE_RANGE_MIN  = 10 * 1024 * 1024;  // 10MB
    private static final long MEDIUM_RANGE_MIN =  2 * 1024 * 1024;  //  2MB
    private static final long SMALL_RANGE_MIN  =      500 * 1024;   // 500kb

    // target widths for each tier in px
    private static final int THUMBNAIL_WIDTH = 300;
    private static final int SMALL_WIDTH     = 800;
    private static final int MEDIUM_WIDTH    = 1024;
    private static final int LARGE_WIDTH     = 2048;

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private S3Template s3Template;

    @Autowired
    private S3Client s3Client;

    @Autowired
    private SpeciesRepository speciesRepository;

    @Autowired
    private TagRepository tagRepository;

    @Value("${digitalocean.bucket.name}")
    private String bucketName;

    @Value("${spring.cloud.aws.endpoint}")
    private String endpoint;

    /**
     * Save image file to disk and metadata to database
     */
    @Transactional
    public Image saveImage(MultipartFile file, int speciesId,
                           String lifecycle_stage, String description, String nathansNotes, List<Integer> tagIds) throws IOException {

        //look up species - throws if not found
        Species species = speciesRepository.findById(speciesId)
                .orElseThrow(() -> new RuntimeException("Species not found with id: " + speciesId));

        long fSize = file.getSize();

        // reject anything over 20MB
        if(fSize > MAX_FILE_SIZE){
            throw new RuntimeException("File is too large. Max allowed size is 20MB.");
        }

        //generate unique filename to prevent collisions
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String safeFilename = getSafeFilename(originalFilename);
        String baseName = UUID.randomUUID() + "_" + safeFilename;

        // og
        String ogKey = baseName + "_original" + extension;
        PutObjectRequest ogReq = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(ogKey)
                .contentType(file.getContentType())
                .acl(ObjectCannedACL.PUBLIC_READ)
                .build();
        s3Client.putObject(ogReq, RequestBody.fromBytes(file.getBytes()));
        String ogURL = endpoint + "/" + bucketName + "/" + ogKey;

        BufferedImage im = ImageIO.read(file.getInputStream());

        int ogWidth = 0;
        int ogHeight = 0;
        if(im != null){
            ogWidth = im.getWidth();
            ogHeight = im.getHeight();
        }

        // mb and px range check
        String thumbURL = null;
        String smallURL = null;
        String fpath    = ogURL;
        String largeURL = null;

        if(fSize >= SMALL_RANGE_MIN && im != null){

            // thumbnail 500kb+
            if(ogWidth > THUMBNAIL_WIDTH){
                thumbURL = uploadResized(im, baseName, "_thumbnail", extension, THUMBNAIL_WIDTH, file.getContentType());
            }

            // small for 500kb+
            if(ogWidth > SMALL_WIDTH){
                smallURL = uploadResized(im, baseName, "_small", extension, SMALL_WIDTH, file.getContentType());
            }

            // medium for 2MB+
            if(fSize >= MEDIUM_RANGE_MIN && ogWidth > MEDIUM_WIDTH){
                fpath = uploadResized(im, baseName, "_medium", extension, MEDIUM_WIDTH, file.getContentType());
            }

            // large for 10MB+
            if(fSize >= LARGE_RANGE_MIN && ogWidth > LARGE_WIDTH){
                largeURL = uploadResized(im, baseName, "_large", extension, LARGE_WIDTH, file.getContentType());
                log.info("Generated large for {}", baseName);
            }
        }

        //Create & save entity
        Image image = new Image();
        image.setSpecies(species);
        image.setFilename(baseName + extension);
        image.setOriginalUrl(ogURL);
        image.setThumbnailUrl(thumbURL);
        image.setSmallUrl(smallURL);
        image.setDisplayUrl(fpath);
        image.setLargeUrl(largeURL);
        image.setFsize(BigInteger.valueOf(fSize));
        image.setWidth(ogWidth);
        image.setHeight(ogHeight);
        image.setLifecyclestage(lifecycle_stage);
        image.setDescription(description);
        image.setNathansnotes(nathansNotes);

        log.info("About to save - lifecycle: {}, nathansNotes: {}, description: {}",
                image.getLifecyclestage(), image.getNathansnotes(), image.getDescription());

        if(tagIds != null && !tagIds.isEmpty()){
            List<Tags> tags = tagRepository.findAllById(tagIds);
            if(tags.size() != tagIds.size()){
                throw new RuntimeException("One or more tag IDs not found.");
            }
            tags.forEach(image::addTag);
        }

        Image savedImage = imageRepository.save(image);
        log.info("Image saved successfully: id={}, filename={}", savedImage.getId(), baseName);

        return savedImage;
    }

    /**
     * Bulk save multiple images to the same species
     */
    @Transactional
    public List<Image> bulkSaveImages(List<MultipartFile> files, int speciesId, String lifecycle_stage, String description, String nathansNotes, List<Integer> tagIds) throws IOException {

        speciesRepository.findById(speciesId).orElseThrow(() -> new RuntimeException("Species not found with id: " + speciesId));

        List<Image> savedImages = new ArrayList<>();

        for(MultipartFile file : files){
            if(file.isEmpty()){
                log.warn("Skipping empty file: {}", file.getOriginalFilename());
                continue;
            }
            Image saved = saveImage(file, speciesId, lifecycle_stage, description, nathansNotes, tagIds);
            savedImages.add(saved);
        }

        return savedImages;
    }

    /**
     * update image metadata
     */
    @Transactional
    public Image updateImage(int imageId, String description, String nathansNotes,
                             String life_cycle, Integer species_id, List<Integer> tagIds) {

        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with id: " + imageId));

        if(description != null){
            image.setDescription(description);
        }
        if(nathansNotes != null){
            image.setNathansnotes(nathansNotes);
        }
        if(life_cycle != null){
            image.setLifecyclestage(life_cycle);
        }
        if(species_id != null){
            Species species = speciesRepository.findById(species_id)
                    .orElseThrow(() -> new RuntimeException("Species not found with id: " + species_id));
            image.setSpecies(species);
        }
        if(tagIds != null && !tagIds.isEmpty()){
            image.getTags().forEach(tag -> tag.getImages().remove(image));
            image.getTags().clear();

            List<Tags> newTags = tagRepository.findAllById(tagIds);
            if(newTags.size() != tagIds.size()){
                throw new RuntimeException("One or more tag IDs not found.");
            }
            newTags.forEach(image::addTag);
        }

        Image updated = imageRepository.save(image);
        log.info("Image updated successfully: id={}", imageId);
        return updated;
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
        imageRepository.delete(image);

        log.info("Image deleted: id={}", imageId);
    }

    public List<Image> filterByAllTags(List<Integer> tagIds){
        if(tagIds == null || tagIds.isEmpty()){
            return imageRepository.findAll();
        }
        return imageRepository.findByAllTags(tagIds, (long) tagIds.size());
    }

    /**
     * Merge attributes onto a single image
     */
    @Transactional
    public Image mergeAttributes(int imageId, Map<String, String> newA) {
        Image image = imageRepository.findById(imageId).orElse(null);
        if(image == null){
            throw new RuntimeException("Image not found with id: " + imageId);
        }

        Map<String, String> existing = image.getAttributes();
        if(existing == null){
            existing = new HashMap<>();
        }
        existing.putAll(newA);
        image.setAttributes(existing);

        Image u = imageRepository.save(image);
        log.info("Attributes merged for image id={}", imageId);
        return u;
    }

    /**
     * Merge same attributes onto a list of images
     */
    @Transactional
    public List<Image> bulkMergeAttributes(List<Integer> imageIds, Map<String, String> newA) {
        List<Image> u = new ArrayList<>();

        for(int imageId : imageIds){
            Image im = imageRepository.findById(imageId).orElse(null);
            if(im == null){
                throw new RuntimeException("Image not found with id: " + imageId);
            }

            Map<String, String> existing = im.getAttributes();
            if(existing == null){
                existing = new HashMap<>();
            }
            existing.putAll(newA);
            im.setAttributes(existing);

            u.add(imageRepository.save(im));
            log.info("Attributes merged for image id={}", imageId);
        }

        return u;
    }

    /**
     * Merge same attributes onto all images of a species
     */
    @Transactional
    public List<Image> bulkMergeAttributesBySpecies(int speciesId, Map<String, String> newA) {
        Species s = speciesRepository.findById(speciesId).orElse(null);
        if(s == null){
            throw new RuntimeException("Species not found with id: " + speciesId);
        }

        List<Image> images = imageRepository.findBySpeciesId(speciesId);
        List<Image> u = new ArrayList<>();

        for(Image im : images){
            Map<String, String> existing = im.getAttributes();
            if(existing == null){
                existing = new HashMap<>();
            }
            existing.putAll(newA);
            im.setAttributes(existing);

            u.add(imageRepository.save(im));
            log.info("Attributes merged for image id={}", im.getId());
        }

        return u;
    }

    /**
     * Remove specific attribute keys from a single image
     */
    @Transactional
    public Image removeAttributes(int imageId, List<String> keys) {
        Image i = imageRepository.findById(imageId).orElse(null);
        if(i == null){
            throw new RuntimeException("Image not found with id: " + imageId);
        }

        Map<String, String> existing = i.getAttributes();
        if(existing != null){
            for(String key : keys){
                existing.remove(key);
            }
            i.setAttributes(existing);
        }

        Image updated = imageRepository.save(i);
        log.info("Attributes removed for image id={}", imageId);
        return updated;
    }

    /**
     * Remove specific attribute keys from a list of images
     */
    @Transactional
    public List<Image> bulkRemoveAttributes(List<Integer> imageIds, List<String> keys) {
        List<Image> u = new ArrayList<>();

        for(int imageId : imageIds){
            Image im = imageRepository.findById(imageId).orElse(null);
            if(im == null){
                throw new RuntimeException("Image not found with id: " + imageId);
            }

            Map<String, String> existing = im.getAttributes();
            if(existing != null){
                for(String key : keys){
                    existing.remove(key);
                }
                im.setAttributes(existing);
            }

            u.add(imageRepository.save(im));
            log.info("Attributes removed for image id={}", imageId);
        }

        return u;
    }

    /**
     * Clear all attributes from a single image
     */
    @Transactional
    public Image clearAttributes(int imageId) {
        Image image = imageRepository.findById(imageId).orElse(null);
        if(image == null){
            throw new RuntimeException("Image not found with id: " + imageId);
        }

        image.setAttributes(null);

        Image updated = imageRepository.save(image);
        log.info("Attributes cleared for image id={}", imageId);
        return updated;
    }

    /**
     * Resize image to target width and upload to DO Spaces, returns the URL
     */
    private String uploadResized(BufferedImage original, String baseName, String suffix, String extension, int targetWidth, String contentType) throws IOException {
        String formatName = extension.replace(".", "");
        if(formatName.equalsIgnoreCase("jpg")) formatName = "jpeg";

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Thumbnails.of(original)
                .width(targetWidth)
                .keepAspectRatio(true)
                .outputFormat(formatName)
                .toOutputStream(baos);

        String key = baseName + suffix + extension;
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .acl(ObjectCannedACL.PUBLIC_READ)
                .build();
        s3Client.putObject(putRequest, RequestBody.fromBytes(baos.toByteArray()));

        return endpoint + "/" + bucketName + "/" + key;
    }

    private int[] getImageDimensions(MultipartFile file){
        try{
            BufferedImage bufferedImage = ImageIO.read(file.getInputStream());
            if(bufferedImage != null){
                return new int[]{bufferedImage.getWidth(), bufferedImage.getHeight()};
            }
        }catch(IOException e){
            log.warn("Could not extract image height and width for file: {}", file.getOriginalFilename());
        }
        return new int[]{0,0};
    }

    private String getSizeRange(long fileSize){
        if(fileSize >= LARGE_RANGE_MIN)  return "large (10MB-20MB)";
        if(fileSize >= MEDIUM_RANGE_MIN) return "medium (2MB-10MB)";
        if(fileSize >= SMALL_RANGE_MIN)  return "small (500kb-2MB)";
        return "tiny (under 500kb)";
    }

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
}