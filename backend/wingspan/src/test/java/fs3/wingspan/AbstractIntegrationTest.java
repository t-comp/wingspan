package fs3.wingspan;

import com.fasterxml.jackson.databind.ObjectMapper;
import fs3.wingspan.config.JwtUtils;
import fs3.wingspan.model.APIKeys;
import fs3.wingspan.model.Species;
import fs3.wingspan.model.Teams;
import fs3.wingspan.model.UType;
import fs3.wingspan.model.Users;
import fs3.wingspan.repository.APIKeyRepository;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.repository.SpeciesRepository;
import fs3.wingspan.repository.TeamsRepository;
import fs3.wingspan.repository.UserRepository;
import io.awspring.cloud.s3.S3Template;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

/**
 * Shared base for all full-stack controller / filter integration tests.
 *
 * One PostgreSQL container is started per JVM run (static field).
 * S3Client and S3Template are mocked so no real DO-Spaces calls are made.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
public abstract class AbstractIntegrationTest {

    // shared test containers for postgresql
    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:15-alpine");

    // s3 mocks
    @MockBean
    protected S3Client s3Client;

    @MockBean
    protected S3Template s3Template;


    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected JwtUtils jwtUtils;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected TeamsRepository teamsRepository;

    @Autowired
    protected APIKeyRepository apiKeyRepository;

    @Autowired
    protected SpeciesRepository speciesRepository;

    @Autowired
    protected ImageRepository imageRepository;

    @Autowired
    protected BCryptPasswordEncoder passwordEncoder;

    protected String adminToken;
    protected String studentToken;
    protected Users savedAdmin;
    protected Users savedStudent;

    @BeforeEach
    void baseSetUp() {
        imageRepository.deleteAll();
        speciesRepository.deleteAll();
        apiKeyRepository.deleteAll();
        userRepository.deleteAll();
        teamsRepository.deleteAll();

        savedAdmin   = createUser("testadmin",   "admin@test.com",   UType.ADMIN);
        savedStudent = createUser("teststudent", "student@test.com", UType.STUDENT);

        adminToken   = "Bearer " + jwtUtils.generateToken(savedAdmin);
        studentToken = "Bearer " + jwtUtils.generateToken(savedStudent);

        // Default S3 mock: putObject succeeds, deleteObject is a no-op
        when(s3Client.putObject(any(PutObjectRequest.class),
                any(software.amazon.awssdk.core.sync.RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());
        doNothing().when(s3Template).deleteObject(any(), any());
    }

    protected Users createUser(String username, String email, UType role) {
        Users u = new Users();
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode("password123"));
        u.setUtype(role);
        u.setIsActive(true);
        return userRepository.save(u);
    }

    protected Teams createTeam(String name, String projectName, String semester) {
        Teams t = new Teams();
        t.setName(name);
        t.setProjectName(projectName);
        t.setSemester(semester);
        return teamsRepository.save(t);
    }

    protected APIKeys createApiKey(Teams team, boolean active, LocalDateTime expiration) {
        APIKeys k = new APIKeys();
        k.setKeyVal("rgds_" + java.util.UUID.randomUUID().toString().replace("-", ""));
        k.setTeamId(team.getId());
        k.setTeamName(team.getName());
        k.setProjectName(team.getProjectName());
        k.setSemester(team.getSemester());
        k.setActive(active);
        k.setExpiration(expiration);
        return apiKeyRepository.save(k);
    }

    protected Species createSpecies(String name) {
        Species s = new Species();
        s.setName(name);
        s.setScientificName("Testus " + name);
        return speciesRepository.save(s);
    }
}
