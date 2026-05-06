package fs3.wingspan.repository;

import fs3.wingspan.model.APIKeys;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository file for API KEYS
 * @author Taylor Bauer
 */
@Repository
public interface APIKeyRepository extends JpaRepository<APIKeys, Integer>{
    APIKeys findByKeyVal(String keyVal);
    List<APIKeys> findByTeamName(String teamName);
    List<APIKeys> findByProjectName(String projectName);
    List<APIKeys> findByActive(boolean active);
    boolean existsByKeyVal(String keyVal);
    APIKeys findByTeamId(Integer teamId);
}
