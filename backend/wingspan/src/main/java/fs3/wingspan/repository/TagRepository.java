package fs3.wingspan.repository;

import fs3.wingspan.model.Image;
import fs3.wingspan.model.Tags;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository file for tags
 * @author Abby Van Der Brink
 */
@Repository
public interface TagRepository extends JpaRepository<Tags, Integer> {
    /**
     * find tags by category
     * @param category
     * @return list of tags
     */
    List<Tags> findByCategory(String category);

    /**
     * determines whether a tag exists by name + category
     * @param name
     * @param category
     * @return true if tag exists or false if tag doesnt exist
     */
    boolean existsByNameAndCategory(String name, String category);

    /**
     * find a tag by name and category
     * @param name
     * @param category
     * @return a tag that matches name + category
     */
    Tags findByNameAndCategory(String name, String category);
    List<Tags> findByCategoryOrderByNameAsc(String category);

    List<Tags> findByNameContainingIgnoreCase(String name);

    List<Tags> findAllById(int tagIds);
}
