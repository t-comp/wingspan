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
    public Image saveImage(MultipartFile file, String description, String nathansNotes) throws IOException {
        //generate unique filename to prevent collisions
        String originalFilename = file.getOriginalFilename();
        String uniqueFilename = generateUniqueFilename(originalFilename);

        //save physical file
        String filePath = savePhysicalFile(file, uniqueFilename);

        //Create & save entity
        Image image = new Image();
        image.setFilename(uniqueFilename);
        image.setFpath(filePath);
        image.setFisize(BigInteger.valueOf(file.getSize()));
        image.setDescription(description);
        image.setNathans_notes(nathansNotes);

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
        image.setNathans_notes(nathansNotes);
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
}
