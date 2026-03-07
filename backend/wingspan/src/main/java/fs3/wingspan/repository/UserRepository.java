package fs3.wingspan.repository;

import fs3.wingspan.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<Users, Integer> {
    Users findByUsername(String username);
    Users findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Users findBySetupToken(String setupToken);
    List<Users> findByTeamId(Integer teamId);
}
