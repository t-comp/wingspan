package fs3.wingspan.controller;

import fs3.wingspan.dto.MessageResponse;
import fs3.wingspan.model.APIKeys;
import fs3.wingspan.repository.APIKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * admin management of API keys
 * note: API keys are auto-generated when a team is created in TeamsController
 * this controller handles viewing, activating, deactivating, and extending keys
 */
@RestController
@RequestMapping("/api-key")
public class APIKeysController {

    @Autowired
    private APIKeyRepository apiKeyRepository;

    /**
     * manually generate/regenerate API key for a team
     * POST /api-key/keygen
     */
    @PostMapping("/keygen")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> generateApiKey(@RequestBody APIKeys request) {
        if (request.getTeamName() == null || request.getTeamName().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Team name is required"));
        }

        String keyVal = "rgds_" + UUID.randomUUID().toString().replace("-", "");

        APIKeys k = new APIKeys();
        k.setKeyVal(keyVal);
        k.setTeamName(request.getTeamName());
        k.setProjectName(request.getProjectName());
        k.setSemester(request.getSemester());
        k.setActive(true);
        k.setExpiration(LocalDateTime.now().plusYears(1));
        apiKeyRepository.save(k);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponse("API key generated: " + keyVal));
    }

    /**
     * get all API keys
     * GET /api-key/all
     */
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<APIKeys>> getAllApiKeys() {
        return ResponseEntity.ok(apiKeyRepository.findAll());
    }

    /**
     * get API key by ID
     * GET /api-key/{keyId}
     */
    @GetMapping("/{keyId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getApiKeyById(@PathVariable int keyId) {
        APIKeys k = apiKeyRepository.findById(keyId).orElse(null);
        if (k == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("API key not found"));
        }
        return ResponseEntity.ok(k);
    }

    /**
     * get only active API keys
     * GET /api-key/active
     */
    @GetMapping("/active")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<APIKeys>> getActiveApiKeys() {
        return ResponseEntity.ok(apiKeyRepository.findByActive(true));
    }

    /**
     * get API key by team name
     * GET /api-key/team/{teamName}
     */
    @GetMapping("/team/{teamName}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<APIKeys>> getApiKeysByTeam(@PathVariable String teamName) {
        return ResponseEntity.ok(apiKeyRepository.findByTeamName(teamName));
    }

    /**
     * get API key by project name
     * GET /api-key/project/{projectName}
     */
    @GetMapping("/project/{projectName}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<APIKeys>> getApiKeysByProject(@PathVariable String projectName) {
        return ResponseEntity.ok(apiKeyRepository.findByProjectName(projectName));
    }

    /**
     * deactivate API key by team name
     * PUT /api-key/deactivate/team/{teamName}
     */
    @PutMapping("/deactivate/team/{teamName}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<MessageResponse> deactivateByTeam(@PathVariable String teamName) {
        List<APIKeys> keys = apiKeyRepository.findByTeamName(teamName);

        if (keys.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("No API keys found for team: " + teamName));
        }

        int i = 0;
        for (APIKeys k : keys) {
            if (k.getActive()) {
                k.setActive(false);
                apiKeyRepository.save(k);
                i++;
            }
        }

        return ResponseEntity.ok(new MessageResponse(i + " API key(s) for " + teamName + " have been deactivated."));
    }

    /**
     * deactivate specific API key by ID
     * PUT /api-key/{keyId}/deactivate
     */
    @PutMapping("/{keyId}/deactivate")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<MessageResponse> deactivateApiKey(@PathVariable int keyId) {
        APIKeys k = apiKeyRepository.findById(keyId).orElse(null);
        if (k == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("API key not found"));
        }

        k.setActive(false);
        apiKeyRepository.save(k);
        return ResponseEntity.ok(new MessageResponse("Key for " + k.getTeamName() + " has been deactivated."));
    }

    /**
     * reactivate key by team name
     * PUT /api-key/activate/team/{teamName}
     */
    @PutMapping("/activate/team/{teamName}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<MessageResponse> activateByTeam(@PathVariable String teamName) {
        List<APIKeys> keys = apiKeyRepository.findByTeamName(teamName);

        if (keys.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("No API keys found for team: " + teamName));
        }

        int i = 0;
        for (APIKeys k : keys) {
            if (!k.getActive()) {
                k.setActive(true);
                apiKeyRepository.save(k);
                i++;
            }
        }

        return ResponseEntity.ok(new MessageResponse(i + " API key(s) for " + teamName + " have been reactivated."));
    }

    /**
     * reactivate specific key by ID
     * PUT /api-key/{keyId}/activate
     */
    @PutMapping("/{keyId}/activate")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<MessageResponse> activateApiKey(@PathVariable int keyId) {
        APIKeys k = apiKeyRepository.findById(keyId).orElse(null);
        if (k == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("API key not found"));
        }

        k.setActive(true);
        apiKeyRepository.save(k);
        return ResponseEntity.ok(new MessageResponse("API key for team '" + k.getTeamName() + "' has been reactivated."));
    }

    /**
     * push back expiration date
     * PUT /api-key/{keyId}/extra-time?months={months_here}
     */
    @PutMapping("/{keyId}/extra-time")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<MessageResponse> extendApiKey(@PathVariable int keyId, @RequestParam int months) {
        APIKeys k = apiKeyRepository.findById(keyId).orElse(null);
        if (k == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("API key not found"));
        }

        LocalDateTime time = LocalDateTime.now().plusMonths(months);
        k.setExpiration(time);
        apiKeyRepository.save(k);

        return ResponseEntity.ok(new MessageResponse("API key for " + k.getTeamName() + " has been extended until " + time));
    }

    /**
     * delete key by team name
     * DELETE /api-key/team/{teamName}
     */
    @DeleteMapping("/team/{teamName}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<MessageResponse> deleteByTeam(@PathVariable String teamName) {
        List<APIKeys> keys = apiKeyRepository.findByTeamName(teamName);

        if (keys.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("No API keys found for team: " + teamName));
        }

        apiKeyRepository.deleteAll(keys);
        return ResponseEntity.ok(new MessageResponse(keys.size() + " API key(s) for team " + teamName + " have been deleted"));
    }

    /**
     * perma delete key
     * DELETE /api-key/{keyId}
     */
    @DeleteMapping("/{keyId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<MessageResponse> deleteApiKey(@PathVariable int keyId) {
        APIKeys k = apiKeyRepository.findById(keyId).orElse(null);
        if (k == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("API key not found"));
        }

        String teamName = k.getTeamName();
        apiKeyRepository.delete(k);
        return ResponseEntity.ok(new MessageResponse("API key for " + teamName + " has been perma deleted"));
    }
}