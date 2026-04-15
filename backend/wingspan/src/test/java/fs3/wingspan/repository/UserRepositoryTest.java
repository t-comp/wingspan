package fs3.wingspan.repository;

import fs3.wingspan.model.UType;
import fs3.wingspan.model.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class UserRepositoryTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:15-alpine");

    @Autowired
    private UserRepository userRepository;

    private Users admin;
    private Users studentWithTeam;
    private Users studentWithoutTeam;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        admin = new Users();
        admin.setUsername("repoAdmin");
        admin.setEmail("repoadmin@test.com");
        admin.setPassword("hashed");
        admin.setUtype(UType.ADMIN);
        admin.setIsActive(true);
        admin = userRepository.save(admin);

        studentWithTeam = new Users();
        studentWithTeam.setUsername("studentA");
        studentWithTeam.setEmail("studentA@test.com");
        studentWithTeam.setPassword("hashed");
        studentWithTeam.setUtype(UType.STUDENT);
        studentWithTeam.setIsActive(true);
        studentWithTeam.setTeamId(42);          // dummy team id
        studentWithTeam = userRepository.save(studentWithTeam);

        studentWithoutTeam = new Users();
        studentWithoutTeam.setUsername("studentB");
        studentWithoutTeam.setEmail("studentB@test.com");
        studentWithoutTeam.setPassword("hashed");
        studentWithoutTeam.setUtype(UType.STUDENT);
        studentWithoutTeam.setIsActive(true);
        studentWithoutTeam = userRepository.save(studentWithoutTeam);
    }

    @Test
    void findByUsername_returnsCorrectUser() {
        Users found = userRepository.findByUsername("repoAdmin");
        assertThat(found).isNotNull();
        assertThat(found.getEmail()).isEqualTo("repoadmin@test.com");
    }

    @Test
    void findByUsername_unknownUsername_returnsNull() {
        Users found = userRepository.findByUsername("nobody");
        assertThat(found).isNull();
    }

    @Test
    void findByEmail_returnsCorrectUser() {
        Users found = userRepository.findByEmail("studentA@test.com");
        assertThat(found).isNotNull();
        assertThat(found.getUsername()).isEqualTo("studentA");
    }

    @Test
    void existsByUsername_existingUser_returnsTrue() {
        assertThat(userRepository.existsByUsername("repoAdmin")).isTrue();
    }

    @Test
    void existsByUsername_unknownUser_returnsFalse() {
        assertThat(userRepository.existsByUsername("ghost")).isFalse();
    }

    @Test
    void existsByEmail_existingEmail_returnsTrue() {
        assertThat(userRepository.existsByEmail("repoadmin@test.com")).isTrue();
    }

    @Test
    void findByTeamId_returnsUsersInTeam() {
        List<Users> members = userRepository.findByTeamId(42);
        assertThat(members).hasSize(1);
        assertThat(members.get(0).getUsername()).isEqualTo("studentA");
    }

    @Test
    void findByTeamId_noMembers_returnsEmptyList() {
        List<Users> members = userRepository.findByTeamId(9999);
        assertThat(members).isEmpty();
    }

    @Test
    void findByTeamIdIsNullAndUtype_returnsOnlyUnassignedStudents() {
        List<Users> unassigned = userRepository.findByTeamIdIsNullAndUtype(UType.STUDENT);
        assertThat(unassigned).hasSize(1);
        assertThat(unassigned.get(0).getUsername()).isEqualTo("studentB");
    }

    @Test
    void findByTeamIdIsNullAndUtype_adminExcluded() {
        List<Users> unassigned = userRepository.findByTeamIdIsNullAndUtype(UType.STUDENT);
        assertThat(unassigned).noneMatch(u -> u.getUtype() == UType.ADMIN);
    }

    @Test
    void save_persistsAllFields() {
        Users u = new Users();
        u.setUsername("fulluser");
        u.setEmail("full@test.com");
        u.setPassword("pw");
        u.setFirstName("Full");
        u.setLastName("User");
        u.setUtype(UType.STUDENT);
        u.setIsActive(false);
        Users saved = userRepository.save(u);

        Users found = userRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getFirstName()).isEqualTo("Full");
        assertThat(found.getLastName()).isEqualTo("User");
        assertThat(found.isEnabled()).isFalse();
    }
}
