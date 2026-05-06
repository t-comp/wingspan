package fs3.wingspan.repository;

import fs3.wingspan.model.Tags;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository file for image tags
 */
public interface ImageTagsRepository extends JpaRepository<Tags, Long> {

}
