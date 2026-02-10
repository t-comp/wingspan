package fs3.wingspan.controller;

import fs3.wingspan.model.*;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.repository.TagRepository;
import fs3.wingspan.repository.UserRepository;
import fs3.wingspan.repository.APIKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/images")
public class ImageController {

    @Autowired
    ImageRepository imageRepository;
    @Autowired
    private UserRepository userRepository;
}
