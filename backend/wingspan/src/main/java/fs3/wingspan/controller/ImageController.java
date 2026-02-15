package fs3.wingspan.controller;

import fs3.wingspan.model.*;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/images")
public class ImageController {

    @Autowired
    ImageRepository imageRepository;
//    @Autowired
//    private UserRepository userRepository;

    /**
     * Upload a new image
     * POST /admin/upload-image
     */
    @PostMapping("/admin/upload-image")
    public String uploadImage(@RequestBody Image newImage){
        if(newImage != null) {
            imageRepository.save(newImage);
            return "Image uploaded successfully";
        }
        return null;
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
