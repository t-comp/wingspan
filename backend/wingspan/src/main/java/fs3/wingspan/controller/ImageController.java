package fs3.wingspan.controller;

import fs3.wingspan.model.*;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.repository.UserRepository;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigInteger;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@RestController
@RequestMapping("/images")
public class ImageController {

    @Autowired
    ImageRepository imageRepository;
//    @Autowired
//    private UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * Upload a new image
     * POST /admin/upload-image
     */
    @PostMapping("/admin/upload-image")
    public String uploadImage(@RequestParam("file") MultipartFile file, @RequestBody Image newImage){
        try {
            String filePath = saveImage(file);
            String filename = file.getOriginalFilename();
            BigInteger fsize = BigInteger.valueOf(file.getSize());
            newImage.setFilename(filename);
            newImage.setFpath(filePath);
            newImage.setFisize(fsize);
            imageRepository.save(newImage);
            return "New Image Saved!";
        }catch(IOException e){
            return "Internal Server Error";
        }
    }

    /**
     * Extracts file path and returns it as a string
     *
     */
    private String saveImage(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if(!Files.exists(uploadPath)){
            Files.createDirectories(uploadPath);
        }

        String filename = file.getOriginalFilename();
        //in case filename is null
        assert filename != null;
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return filePath.toString();
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename){
        try{
            Path filePath = Paths.get(uploadDir).resolve(filename);
            Resource resource = (Resource) new UrlResource(filePath.toUri());

            if(resource != null){
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(resource);
            }else{
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
           return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get image by image id
     * GET /{imageId}
     */
    @GetMapping("/{imageId}")
    public String getImageByID(@PathVariable("imageId") Integer imageId) {
        Image i = imageRepository.findById(imageId);
        if(i != null) {
            return i.getFpath();
        }
        return null;
    }

    /**
     * Delete image by image id
     * DELETE /admin/delete-image
     */
    @DeleteMapping("/admin/delete-image")
    public String deleteImage(@RequestParam("id") int id) {
        Image i = imageRepository.findById(id);
        if(i == null) {
            return "Image not found";
        }

        int imageId = i.getId();
        imageRepository.delete(i);
        return "Image: " + imageId + " deleted successfully";


    }


    /**
     * Delete all images
     * DELETE /admin/delete-all-images
     */
    @DeleteMapping("/admin/delete-all-images")
    public String deleteAllImages() {
        imageRepository.deleteAll();
        return "All images deleted";
    }

    /**
     * Edit the image description
     * POST /admin/edit-description
     */
    @PutMapping("/admin/edit-description")
    public String editImage(@RequestParam int id, @RequestParam String newDescription) {
        Image i = imageRepository.findById(id);
        if(i != null) {
            i.setDescription(newDescription);
            return "Image updated successfully";
        }
        return "Image not found";
    }

    /**
     * Edit the image nathans notes
     * POST /admin/edit-nathans_notes
     */
    @PutMapping("/admin/edit-nathans_notes")
    public String editNotes(@RequestParam int id, @RequestParam String newNotes) {
        Image i = imageRepository.findById(id);
        if(i != null) {
            i.setNathans_notes(newNotes);
            return "Image updated successfully";
        }
        return "Image not found";
    }

}
