package fs3.wingspan.repository;

import fs3.wingspan.model.Species;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository file for Species
 * @author Taylor Bauer
 */
@Repository
public interface SpeciesRepository extends JpaRepository<Species, Integer> {
    Species findByName(String name);
    boolean existsByName(String name);


    /**
     * filter for any combo of taxonomic group
     * @return list of all species in specific taxonomy
     */
    @Query("SELECT s FROM Species s WHERE " + "(:orderName IS NULL OR LOWER(s.orderName) = LOWER(:orderName)) AND " +
            "(:family IS NULL OR LOWER(s.family) = LOWER(:family)) AND " +  "(:genus IS NULL OR LOWER(s.genus) = LOWER(:genus))")
    List<Species> filterByTaxonomy(@Param("orderName") String orderName, @Param("family") String family, @Param("genus") String genus);

    /**
     * find all orders in application
     * @return All Insect orders that are in the db
     */
    @Query("SELECT DISTINCT s.orderName FROM Species s WHERE s.orderName IS NOT NULL ORDER BY s.orderName")
    List<String> findAllOrders();

    /**
     * find all families in application
     * @return All Insect families that are in the db
     */
    @Query("SELECT DISTINCT s.family FROM Species s WHERE s.family IS NOT NULL ORDER BY s.family")
    List<String> findAllFamilies();

    /**
     * find all genesus in application
     * @return all insect genesus in db
     */
    @Query("SELECT DISTINCT s.genus FROM Species s WHERE s.genus IS NOT NULL ORDER BY s.genus")
    List<String> findAllGenesus();

    /**
     * finds species by common name or scientific name
     * @param name
     * @param scientificName
     * @return species found by given name
     */
    Species findByNameOrScientificName(String name, String scientificName);

    /**
     * checks whether a species exists by scientific name
     * @param scientificName
     * @return true if species exists, false if it does not exist
     */
    boolean existsByScientificName(String scientificName);


}