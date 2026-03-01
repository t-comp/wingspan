package fs3.wingspan.services;

import fs3.wingspan.model.Image;
import fs3.wingspan.repository.ImageRepository;
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

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * Save image file to disk and metadata to database
     */
    @Transactional
    public Image saveImage(MultipartFile file,
                           String lifecycle_stage, String description, String nathansNotes) throws IOException {
        //generate unique filename to prevent collisions
        String originalFilename = file.getOriginalFilename();
        log.info("Original filename received: {}", originalFilename);

        String extension = getFileExtension(originalFilename);
        log.info("Extension extracted: {}", extension);  // ← Does it get here?

        String safeFilename = getSafeFilename(originalFilename);
        log.info("Extension extracted: {}", extension);  // ← Does it get here?

        String uniqueFilename = UUID.randomUUID().toString()
                + "_" + safeFilename
                + extension;
        log.info("Unique filename: {}", uniqueFilename);

        Path uploadPath = Paths.get(uploadDir);
        log.info("Upload path: {}", uploadPath.toAbsolutePath());

        if(!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        log.info("File saved to: {}", filePath);

        //Create & save entity
        Image image = new Image();
        image.setFilename(uniqueFilename);
        image.setFpath(filePath.toString());
        image.setFisize(BigInteger.valueOf(file.getSize()));
        image.setDescription(description);
        image.setLifecyclestage(lifecycle_stage);
        image.setNathansnotes(nathansNotes);

        //extractImageDimensions(file, image);

        Image savedImage = imageRepository.save(image);

        log.info("Image saved successfully: id={}, filename={}", savedImage.getId(), uniqueFilename);

        return savedImage;
    }

    /**
     * save physical file to disk
     */
    private String savePhysicalFile(MultipartFile file, String uniqueFilename) throws IOException {

        Path uploadPath = Paths.get(uploadDir);

        //create directory if doesn't exit
        if(!Files.exists(uploadPath)){
            Files.createDirectories(uploadPath);
            log.info("Created upload directory: {}", uploadPath);
        }

        //Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return filePath.toString();
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
     * Delete physical file from disk
     */
    public void deletePhysicalFile(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        if(Files.exists(path)) {
            Files.delete(path);
            log.info("Deleted physical file: {}", filePath);
        }else{
            log.warn("File not found for deletion: {}", filePath);
        }
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

        //Delete physical file (first)
        deletePhysicalFile(image.getFpath());

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
