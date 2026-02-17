package fs3.wingspan.repository;

import fs3.wingspan.model.Tags;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.RequestParam;

@Repository
public interface ImageTagsRepository extends JpaRepository<Tags, Long> {

}
