package fs3.wingspan.repository;

import fs3.wingspan.model.Image;
import fs3.wingspan.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImageRepository extends JpaRepository<Image, Long> {
    Image findByPath(String path);
    boolean existsByPath(String path);
    Image findImageByTag(String tag);
}
