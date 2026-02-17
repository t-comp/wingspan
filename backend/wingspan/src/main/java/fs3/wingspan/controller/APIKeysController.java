package fs3.wingspan.controller;
import fs3.wingspan.model.APIKeys;
import fs3.wingspan.repository.APIKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api-key")
public class APIKeysController {

    @Autowired
    private APIKeyRepository apiKeyRepository;

    /**
     * generate api key for student team
     * POST /api-key/keygen
     */

    @PostMapping("/keygen")
    public String generateApiKey(@RequestBody APIKeys key) {

        // key value gen
        String kv = "rgds_" + UUID.randomUUID().toString().replace("-", "");
        key.setKeyVal(kv);

        if (key.getActive() == null) {
            key.setActive(true);
        }

        // expiration = 1 year if not specified
        if (key.getExpiration() == null) {
            key.setExpiration(LocalDateTime.now().plusYears(1));
        }
        apiKeyRepository.save(key);
        return "API Key: " + kv +
                "COPY THIS NOW! You will not be able to see it again." +
                "Expires on: " + key.getExpiration();


    }

    /**
     * get all API keys
     * GET /api-key/all
     */
    @GetMapping("/all")
    public List<APIKeys> getAllApiKeys() {
        return apiKeyRepository.findAll();
    }

    /**
     * get API key by ID
     * GET /api-key/{keyId}
     */
    @GetMapping("/{keyId}")
    public APIKeys getApiKeyById(@PathVariable int keyId) {
        return apiKeyRepository.findById(keyId).orElse(null);
    }

    /**
     * get only active API keys
     * GET /api-key/active
     */
    @GetMapping("/active")
    public List<APIKeys> getActiveApiKeys() {
        return apiKeyRepository.findByActive(true);
    }

    /**
     * get API key by team name
     * GET /api-key/team/{teamName}
     */
    @GetMapping("/team/{teamName}")
    public List<APIKeys> getApiKeysByTeam(@PathVariable String teamName) {
        return apiKeyRepository.findByTeamName(teamName);
    }

    /**
     * get API key by project name
     * GET /api-key/project/{projectName}
     */
    @GetMapping("/project/{projectName}")
    public List<APIKeys> getApiKeysByProject(@PathVariable String projectName) {
        return apiKeyRepository.findByProjectName(projectName);
    }

    /**
     * deactivate API key by team name
     * PUT /api-key/deactivate/team/{teamName}
     */
    @PutMapping("/deactivate/team/{teamName}")
    public String deactivateByTeam(@PathVariable String teamName) {
        List<APIKeys> keys = apiKeyRepository.findByTeamName(teamName);

        if (keys.isEmpty()) {
            return "No API keys found for" + teamName;
        }

        int i = 0;
        for (APIKeys k : keys) {
            if (k.getActive()) {
                k.setActive(false);
                apiKeyRepository.save(k);
                i++;
            }
        }

        return  i + " API key(s) for " + teamName + " have been deactivated.";
    }

    /**
     * deactivate specific API key by ID
     * PUT /api-key/{keyId}/deactivate
     */
    @PutMapping("/{keyId}/deactivate")
    public String deactivateApiKey(@PathVariable int keyId) {
        APIKeys k = apiKeyRepository.findById(keyId).orElse(null);
        if (k == null) {
            return "Key was not found.";
        }

        k.setActive(false);
        apiKeyRepository.save(k);
        return "Key for" + k.getTeamName() + " has been deactivated.";
    }

    /**
     * reactivate key by team name
     * PUT /api-key/activate/team/{teamName}
     */
    @PutMapping("/activate/team/{teamName}")
    public String activateByTeam(@PathVariable String teamName) {
        List<APIKeys> keys = apiKeyRepository.findByTeamName(teamName);

        if (keys.isEmpty()) {
            return "No API keys found for " + teamName;
        }

        int i = 0;
        for (APIKeys k : keys) {
            if (!k.getActive()) {
                k.setActive(true);
                apiKeyRepository.save(k);
                i++;
            }
        }

        return i + " API key(s) for " + teamName + " have been reactivated.";
    }

    /**
     * reactivate specific key by ID
     * PUT /api-key/{keyId}/activate
     */
    @PutMapping("/{keyId}/activate")
    public String activateApiKey(@PathVariable int keyId) {
        APIKeys k = apiKeyRepository.findById(keyId).orElse(null);
        if (k == null) {
            return "Key was not found.";
        }

        k.setActive(true);
        apiKeyRepository.save(k);
        return "API key for team '" + k.getTeamName() + "' has been reactivated.";
    }

    /**
     * push back expiration date
     * PUT /api-key/{keyId}/extra-time?months={months_here}
     */
    @PutMapping("/{keyId}/extra-time")
    public String extendApiKey(@PathVariable int keyId, @RequestParam int months) {
        APIKeys k = apiKeyRepository.findById(keyId).orElse(null);
        if (k == null) {
            return "Key was not found.";
        }

        LocalDateTime time = LocalDateTime.now().plusMonths(months);
        k.setExpiration(time);
        apiKeyRepository.save(k);

        return "API key for " + k.getTeamName() + " has been extended until " + time;
    }

    /**
     * delete key by team name
     * DELETE /api-key/team/{teamName}
     */
    @DeleteMapping("/team/{teamName}")
    public String deleteByTeam(@PathVariable String teamName) {
        List<APIKeys> keys = apiKeyRepository.findByTeamName(teamName);

        if (keys.isEmpty()) {
            return "No API keys found.";
        }

        apiKeyRepository.deleteAll(keys);
        return keys.size() + " API key(s) for team " + teamName + "have been deleted";
    }

    /**
     * perma delete key
     * DELETE /api-key/{keyId}
     */
    @DeleteMapping("/{keyId}")
    public String deleteApiKey(@PathVariable int keyId) {
        APIKeys k = apiKeyRepository.findById(keyId).orElse(null);
        if (k == null) {
            return "Key was not found.";
        }

        String teamName = k.getTeamName();
        apiKeyRepository.delete(k);
        return "API key for " + teamName + " has been perma deleted";
    }
}

