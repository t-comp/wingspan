package fs3.wingspan.controller;

import fs3.wingspan.model.Image;
import fs3.wingspan.model.Tags;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.repository.ImageTagsRepository;
import fs3.wingspan.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/image-tags")
public class ImageTagsController {
    @Autowired
    ImageTagsRepository imageTagsRepository;

    @Autowired
    TagRepository tagRepository;

    @Autowired
    ImageRepository imageRepository;
    @Autowired
    private ImageController imageController;

    @PutMapping("/add-tag")
    public String addTag(@RequestBody Tags tags, @RequestParam int imageId) {
        String image = imageController.getImageByID(imageId);

    }


}
