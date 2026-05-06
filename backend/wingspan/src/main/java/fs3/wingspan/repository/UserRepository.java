package fs3.wingspan.repository;

import fs3.wingspan.model.Users;
import fs3.wingspan.model.UType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository file for users
 * @author Taylor Bauer
 */
@Repository
public interface UserRepository extends JpaRepository<Users, Integer> {
    /**
     * find user by username
     * @param username
     * @return user info
     */
    Users findByUsername(String username);

    /**
     * find user by email
     * @param email
     * @return user info
     */
    Users findByEmail(String email);

    /**
     * determines whether a user exists by username
     * @param username
     * @return true or false
     */
    boolean existsByUsername(String username);

    /**
     * determines whether a user exist by email
     * @param email
     * @return true or false
     */
    boolean existsByEmail(String email);

    /**
     * find user apart of a team
     * @param teamId
     * @return list of users
     */
    List<Users> findByTeamId(Integer teamId);

    /**
     * find users by user type
     * @param utype
     * @return list of users
     */
    List<Users> findByTeamIdIsNullAndUtype(UType utype);
}