package fs3.wingspan.repository;

import fs3.wingspan.model.Teams;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamsRepository extends JpaRepository<Teams, Integer> {
    Teams findByName(String name);
    boolean existsByName(String name);
}