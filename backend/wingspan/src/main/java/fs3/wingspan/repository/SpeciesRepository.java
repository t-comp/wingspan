package fs3.wingspan.repository;

import fs3.wingspan.model.Species;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpeciesRepository extends JpaRepository<Species, Integer> {
    Species findByName(String name);
    boolean existsByName(String name);

    // fiter for any combo of taxonomic group or wtv
    @Query("SELECT s FROM Species s WHERE " + "(:orderName IS NULL OR LOWER(s.orderName) = LOWER(:orderName)) AND " +
            "(:family IS NULL OR LOWER(s.family) = LOWER(:family)) AND " +  "(:genus IS NULL OR LOWER(s.genus) = LOWER(:genus))")
    List<Species> filterByTaxonomy(@Param("orderName") String orderName, @Param("family") String family, @Param("genus") String genus);

    // distinct values for each taxonomic dropdown
    @Query("SELECT DISTINCT s.orderName FROM Species s WHERE s.orderName IS NOT NULL ORDER BY s.orderName")
    List<String> findAllOrders();

    @Query("SELECT DISTINCT s.family FROM Species s WHERE s.family IS NOT NULL ORDER BY s.family")
    List<String> findAllFamilies();

    @Query("SELECT DISTINCT s.genus FROM Species s WHERE s.genus IS NOT NULL ORDER BY s.genus")
    List<String> findAllGenesus();

    Species findByNameOrScientificName(String name, String scientificName);
}