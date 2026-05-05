package fs3.wingspan.config;

import fs3.wingspan.model.APIKeys;
import fs3.wingspan.repository.APIKeyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * @author Taylor Bauer
 */
@Component
public class APIKeyFilter extends OncePerRequestFilter {

    @Autowired
    private APIKeyRepository apiKeyRepository;

    /**
     *
     * @param request
     * @param response
     * @param chain
     * @throws ServletException
     * @throws IOException
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String apiKey = request.getHeader("X-API-Key");

        if (apiKey != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            if (!HttpMethod.GET.name().equals(request.getMethod())) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\": \"API key access is read-only. Use JWT login for write operations.\"}");
                return;
            }

            APIKeys key = apiKeyRepository.findByKeyVal(apiKey);

            if (key == null) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\": \"Invalid API key.\"}");
                return;
            }

            if (!Boolean.TRUE.equals(key.getActive())) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\": \"API key is inactive. Contact your instructor.\"}");
                return;
            }

            if (key.getExpiration() != null && key.getExpiration().isBefore(LocalDateTime.now())) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\": \"API key has expired. Contact your instructor.\"}");
                return;
            }

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    "api-key:" + key.getTeamName(),
                    null,
                    List.of(new SimpleGrantedAuthority("STUDENT"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        chain.doFilter(request, response);
    }
}