package fs3.wingspan.repository;
import fs3.wingspan.model.Species;
import fs3.wingspan.model.SpeciesType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SpeciesRepository extends JpaRepository<Species, Integer> {
    Species findByName(String name);
    List<Species> findByType(SpeciesType type);
    boolean existsByName(String name);

}
