package fs3.wingspan.controller;


import fs3.wingspan.model.Tags;
import fs3.wingspan.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tags")
public class TagsController {

    @Autowired
    TagRepository tagRepository;

    @GetMapping("/tag-categories")
    public String GetTagByCategory(@RequestParam String category) {
        Tags tag = tagRepository.findByCategory(category);
        if(tag != null) {
            return "Found tag: " + tag.toString();
        }
        return "Tag not found";
    }

    @PostMapping("/admin/create-tag")
    public String CreateTag(@RequestBody Tags tag) {
        if(tag.getName() == null || tag.getName().isEmpty()) {
            return "The tag requires a name";
        }else if(tag.getCategory() == null || tag.getCategory().isEmpty()) {
            return "The tag requires a category";
        }
        tagRepository.save(tag);
        return "Tag created";
    }
}
