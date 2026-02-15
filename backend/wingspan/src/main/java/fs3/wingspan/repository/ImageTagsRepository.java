package fs3.wingspan.repository;

import fs3.wingspan.model.Image;
import fs3.wingspan.model.Image_tags;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImageTagsRepository extends JpaRepository<Image_tags, Long> {

}
