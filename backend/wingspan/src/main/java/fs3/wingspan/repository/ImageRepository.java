package fs3.wingspan.repository;

import fs3.wingspan.model.Image;
import fs3.wingspan.model.Tags;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImageRepository extends JpaRepository<Image, Long> {
    Image findById(Integer id);
    boolean existsByPath(String path);
    Image findImageByTag(Tags tag);
}
