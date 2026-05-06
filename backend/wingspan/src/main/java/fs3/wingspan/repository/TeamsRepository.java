package fs3.wingspan.repository;

import fs3.wingspan.model.Teams;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository file for teams
 * @author Taylor Bauer
 */
@Repository
public interface TeamsRepository extends JpaRepository<Teams, Integer> {
    /**
     * find team by name
     * @param name
     * @return team
     */
    Teams findByName(String name);

    /**
     * determines whether a team exists by name
     * @param name
     * @return true if team exist or false if it doesnt exist
     */
    boolean existsByName(String name);
}