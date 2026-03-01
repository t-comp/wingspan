package fs3.wingspan.repository;

import fs3.wingspan.model.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImageRepository extends JpaRepository<Image, Integer> {
    Optional<Image> findByFilename(String filename);

    List<Image> findBySpeciesId(Integer speciesId);
    List<Image> findByLifecyclestage(String lifecyclestage);
    @Query("SELECT i FROM Image i JOIN i.tags t WHERE t.id = :tagId")
    List<Image> findByTagId(@Param("tagId") Integer tagId);

    @Query("SELECT i FROM Image i JOIN i.tags t WHERE t.category = :category")
    List<Image> findByTagCategory(@Param("category") String category);

    @Query("SELECT i FROM Image i WHERE i.species.id = :speciesId AND i.lifecyclestage = :stage")
    List<Image> findBySpeciesAndLifecycle_stage(
            @Param("speciesId") Integer speciesId,
            @Param("stage") String stage
    );
    boolean existsByFilename(String fileName);
    long countBySpeciesId(Integer speciesID);

    @Query("""
        SELECT i FROM Image i
        JOIN i.tags t
        WHERE t.id IN :tagIds
        GROUP BY i
        HAVING COUNT(DISTINCT t.id) = :tagCount
        """)
    List<Image> findByAllTags(
            @Param("tagIds") List<Integer> tagIds,
            @Param("tagCount") Long tagCount);
}
