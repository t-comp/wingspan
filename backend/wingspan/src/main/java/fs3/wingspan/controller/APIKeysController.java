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
 * @author Taylor Bauer
 */
@RestController
@RequestMapping("/api-key")
public class APIKeysController {

    @Autowired
    private APIKeyRepository apiKeyRepository;

    /**
     * manually generate/regenerate API key for a team
     * POST /api-key/keygen
     *  @param request
     *  @return new API key generated
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
     * @return all API keys
     */
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<APIKeys>> getAllApiKeys() {
        return ResponseEntity.ok(apiKeyRepository.findAll());
    }

    /**
     * get API key by ID
     * GET /api-key/{keyId}
     * @param keyId
     * @return API key found through ID or an error if key does not exist
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
     * @return all active API keys
     */
    @GetMapping("/active")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<APIKeys>> getActiveApiKeys() {
        return ResponseEntity.ok(apiKeyRepository.findByActive(true));
    }

    /**
     * get API key by team name
     * GET /api-key/team/{teamName}
     * @param teamName
     * @return API key for specific teamName
     */
    @GetMapping("/team/{teamName}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<APIKeys>> getApiKeysByTeam(@PathVariable String teamName) {
        return ResponseEntity.ok(apiKeyRepository.findByTeamName(teamName));
    }

    /**
     * get API key by project name
     * GET /api-key/project/{projectName}
     * @param projectName
     * @return API key for specific projectName
     */
    @GetMapping("/project/{projectName}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<APIKeys>> getApiKeysByProject(@PathVariable String projectName) {
        return ResponseEntity.ok(apiKeyRepository.findByProjectName(projectName));
    }

    /**
     * deactivate API key by team name
     * PUT /api-key/deactivate/team/{teamName}
     * @param teamName
     * @return Message that confirms that the team key has been deactivated
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
     * @param keyId
     * @return message that the key has been deactivated by id
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
     * @param teamName
     * @return message that key has been reactivated by teamName
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
     * @param keyId
     * @return message that API key has been reactivated by its id
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
     * @param keyId
     * @param months
     * @return message that API key expiration data has been pushed back
     */
    @PutMapping("/{keyId}/extra-time")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<MessageResponse> extendApiKey(@PathVariable int keyId, @RequestParam int months) {
        APIKeys k = apiKeyRepository.findById(keyId).orElse(null);
        if (k == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("API key not found"));
        }

        LocalDateTime base;
        if (k.getExpiration() != null && k.getExpiration().isAfter(LocalDateTime.now())) {
            base = k.getExpiration();
        } else {
            base = LocalDateTime.now();
        }

        LocalDateTime time = base.plusMonths(months);
        k.setExpiration(time);
        apiKeyRepository.save(k);

        return ResponseEntity.ok(new MessageResponse("API key for " + k.getTeamName() + " has been extended until " + time));
    }

    /**
     * delete key by team name
     * DELETE /api-key/team/{teamName}
     * @param teamName
     * @return message that API key has been deleted through teamName
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
     * @param keyId
     * @return message that API key has been deleted by keyId
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