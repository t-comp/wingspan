package fs3.wingspan.repository;

import fs3.wingspan.model.Image;
import fs3.wingspan.model.Tags;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TagRepository extends JpaRepository<Tags, Long> {
    Tags findByCategory(String category);
}
