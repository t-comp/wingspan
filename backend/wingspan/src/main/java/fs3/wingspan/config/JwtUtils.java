package fs3.wingspan.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import fs3.wingspan.model.Users;

import java.security.Key;
import java.util.Date;

/**
 * file creates token for user when they log in
 * @author Taylor Bauer
 */
@Component
public class JwtUtils {

    private static final String SECRET = "wingspan-secret-key-must-be-at-least-32-chars!!";
    private static final long EXPIRATION_MS = 86400000; // 24 hours

    /**
     * @return JWS key
     */
    private Key getKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    /**
     * Generates a JWTS token for a user
     * @param user
     * @return JWTS token that was generated
     */
    public String generateToken(Users user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("role", user.getUtype().name())
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     *
     * @param token
     * @return username found from given toke
     */
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey()).build()
                .parseClaimsJws(token)
                .getBody().getSubject();
    }

    /**
     *
     * @param token
     * @return true if token is valid or false if token is invalid
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getKey()).build().parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}