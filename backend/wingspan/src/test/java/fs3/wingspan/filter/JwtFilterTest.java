package fs3.wingspan.filter;

import fs3.wingspan.AbstractIntegrationTest;
import fs3.wingspan.model.UType;
import fs3.wingspan.model.Users;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.security.Key;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Exercises JwtFilter: valid JWT grants the correct role (ADMIN vs STUDENT),
 * invalid/tampered JWTs are rejected (endpoint stays open but no authority is set),
 * and requests to public endpoints without any auth still succeed.
 */
class JwtFilterTest extends AbstractIntegrationTest {

    private static final String SECRET = "wingspan-secret-key-must-be-at-least-32-chars!!";

    // ══════════════════════════════════════════════════════════════════════════
    // Valid ADMIN token → ADMIN-only endpoint accessible
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void validAdminJwt_grantAdminAccess() throws Exception {
        mockMvc.perform(get("/user/all")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Valid STUDENT token → ADMIN-only endpoint rejected
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void validStudentJwt_deniedOnAdminEndpoint() throws Exception {
        mockMvc.perform(get("/user/all")
                        .header("Authorization", studentToken))
                .andExpect(status().isForbidden());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Tampered / invalid JWT → no authentication applied → admin endpoint forbidden
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void invalidJwt_adminEndpointForbidden() throws Exception {
        mockMvc.perform(get("/user/all")
                        .header("Authorization", "Bearer totally.invalid.token"))
                .andExpect(status().isForbidden());
    }

    @Test
    void tamperedSignatureJwt_adminEndpointForbidden() throws Exception {
        // Valid structure, wrong secret
        Key wrongKey = Keys.hmacShaKeyFor("wrong-secret-key-must-be-at-least-32-chars!".getBytes());
        String token = Jwts.builder()
                .setSubject(savedAdmin.getUsername())
                .claim("role", "ADMIN")
                .claim("userId", savedAdmin.getId())
                .claim("email", savedAdmin.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86_400_000))
                .signWith(wrongKey, SignatureAlgorithm.HS256)
                .compact();

        mockMvc.perform(get("/user/all")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void expiredJwt_adminEndpointForbidden() throws Exception {
        Key key = Keys.hmacShaKeyFor(SECRET.getBytes());
        String expired = Jwts.builder()
                .setSubject(savedAdmin.getUsername())
                .claim("role", "ADMIN")
                .claim("userId", savedAdmin.getId())
                .claim("email", savedAdmin.getEmail())
                .setIssuedAt(new Date(System.currentTimeMillis() - 200_000))
                .setExpiration(new Date(System.currentTimeMillis() - 100_000)) // already expired
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        mockMvc.perform(get("/user/all")
                        .header("Authorization", "Bearer " + expired))
                .andExpect(status().isForbidden());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Request without any auth → public endpoints still respond
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void noAuth_publicEndpoint_returns200() throws Exception {
        mockMvc.perform(get("/species/all"))
                .andExpect(status().isOk());
    }

    @Test
    void noAuth_loginEndpoint_accessible() throws Exception {
        String body = """
                {"usernameOrEmail":"nobody","password":"nobody"}
                """;
        // 401 from the controller (wrong creds), NOT filtered out
        mockMvc.perform(post("/user/login")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Token for a user that no longer exists in the DB → no auth granted
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void jwtForDeletedUser_adminEndpointForbidden() throws Exception {
        Users ghost = createUser("ghostuser", "ghost@test.com", UType.ADMIN);
        String ghostToken = "Bearer " + jwtUtils.generateToken(ghost);

        // Delete the user from DB — token is still structurally valid
        userRepository.delete(ghost);

        mockMvc.perform(get("/user/all")
                        .header("Authorization", ghostToken))
                .andExpect(status().isForbidden());
    }
}
