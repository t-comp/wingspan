package fs3.wingspan.repository;

import fs3.wingspan.model.Image;
import fs3.wingspan.model.Tags;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tags, Integer> {
    List<Tags> findByCategory(String category);
    boolean existsByNameAndCategory(String name, String category);
    Tags findByNameAndCategory(String name, String category);
    List<Tags> findByCategoryOrderByNameAsc(String category);

    List<Tags> findByNameContainingIgnoreCase(String name);
}
