package fs3.wingspan.repository;

import fs3.wingspan.model.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Repository file for Images
 * @author Abby Van Der Brink
 */
@Repository
public interface ImageRepository extends JpaRepository<Image, Integer> {

    /**
     * Find images by a species ID
     * @param speciesId
     * @return List of images
     */
    List<Image> findBySpeciesId(Integer speciesId);

    /**
     * find images by tag id
     * @param tagId
     * @return list of images
     */
    @Query("SELECT i FROM Image i JOIN i.tags t WHERE t.id = :tagId")
    List<Image> findByTagId(@Param("tagId") Integer tagId);

    /**
     * find images by tag category
     * @param category
     * @return list of images
     */
    @Query("SELECT i FROM Image i JOIN i.tags t WHERE t.category = :category")
    List<Image> findByTagCategory(@Param("category") String category);

    /**
     * find images by species and lifecycle stage
     * @param speciesId
     * @param stage
     * @return list of images
     */
    @Query("SELECT i FROM Image i WHERE i.species.id = :speciesId AND i.lifecyclestage = :stage")
    List<Image> findBySpeciesAndLifecycle_stage(
            @Param("speciesId") Integer speciesId,
            @Param("stage") String stage
    );

    @Query("""
        SELECT i FROM Image i
        JOIN i.tags t
        WHERE t.id IN :tagIds
        GROUP BY i
        HAVING COUNT(DISTINCT t.id) = :tagCount
        """)
    /**
     * find images that match all given tags
     * @param tagIds
     * @param tagCount
     * @return list of images
     */
    List<Image> findByAllTags(
            @Param("tagIds") List<Integer> tagIds,
            @Param("tagCount") Long tagCount);

    /**
     * find all images that match species and all given tags
     * @param speciesId
     * @param tagIds
     * @param tagCount
     * @return list of images
     */
    @Query("""
        SELECT i FROM Image i
        JOIN i.tags t
        WHERE i.species.id = :speciesId
        AND t.id IN :tagIds
        GROUP BY i
        HAVING COUNT(DISTINCT t.id) = :tagCount
        """)
    List<Image> findBySpeciesAndTagIds(
            @Param("speciesId") Integer speciesId,
            @Param("tagIds") List<Integer> tagIds,
            @Param("tagCount") Long tagCount);

    /**
     * filter images by species + tag names (must have ALL tags)
     * @param speciesId
     * @param tagNames
     * @param tagCount
     * @return list of images
     */
    @Query("""
        SELECT i FROM Image i
        JOIN i.tags t
        WHERE i.species.id = :speciesId
        AND LOWER(t.name) IN :tagNames
        GROUP BY i
        HAVING COUNT(DISTINCT t.id) = :tagCount
        """)
    List<Image> findBySpeciesAndTagNames(
            @Param("speciesId") Integer speciesId,
            @Param("tagNames") List<String> tagNames,
            @Param("tagCount") Long tagCount);

    /**
     * get featured image for a species + exact tag name set
     * @param speciesId
     * @param tagNames
     * @param tagCount
     * @return list of images
     */
    @Query("""
        SELECT i FROM Image i
        JOIN i.tags t
        WHERE i.species.id = :speciesId
        AND i.isFeatured = true
        AND LOWER(t.name) IN :tagNames
        GROUP BY i
        HAVING COUNT(DISTINCT t.id) = :tagCount
        """)
    Optional<Image> findFeaturedBySpeciesAndTagNames(
            @Param("speciesId") Integer speciesId,
            @Param("tagNames") List<String> tagNames,
            @Param("tagCount") Long tagCount);


    /**
     * find the images that are feature for given tag/species combination
     * @param speciesId
     * @param tagNames
     * @param tagCount
     * @param excludeId
     * @return list of images
     */
    @Query("""
        SELECT i FROM Image i
        JOIN i.tags t
        WHERE i.species.id = :speciesId
        AND i.isFeatured = true
        AND i.id != :excludeId
        GROUP BY i
        HAVING COUNT(DISTINCT t.id) = :tagCount
        AND SUM(CASE WHEN LOWER(t.name) IN :tagNames THEN 1 ELSE 0 END) = :tagCount
        """)
    List<Image> findCurrentlyFeaturedForSameCombo(
            @Param("speciesId") Integer speciesId,
            @Param("tagNames") List<String> tagNames,
            @Param("tagCount") Long tagCount,
            @Param("excludeId") Integer excludeId);

    /**
     * gets scientific name from species for longvity to pull from
     * @param scientificName
     * @param lifecyclestage
     * @return list of images
     */
    @Query("""
    SELECT i FROM Image i
    JOIN i.species s
    WHERE LOWER(s.scientificName) = LOWER(:scientificName)
    AND LOWER(i.lifecyclestage) = LOWER(:lifecyclestage)
    """)
    List<Image> findBySpeciesScientificNameAndLifecyclestage(
            @Param("scientificName") String scientificName,
            @Param("lifecyclestage") String lifecyclestage);

    /**
     * Also add a fallback that ignores lifecycle stage
     * @param scientificName
     * @return list of images
     */
    @Query("""
    SELECT i FROM Image i
    JOIN i.species s
    WHERE LOWER(s.scientificName) = LOWER(:scientificName)
    """)
    List<Image> findBySpeciesScientificName(
            @Param("scientificName") String scientificName);

    /**
     * Find an image by species id and lifecycle stage
     * @param speciesId
     * @param lifecyclestage
     * @return list of images
     */
    List<Image> findBySpeciesIdAndLifecyclestage(int speciesId, String lifecyclestage);
}
