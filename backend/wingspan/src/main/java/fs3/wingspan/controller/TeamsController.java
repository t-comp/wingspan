//package fs3.wingspan.controller;
//
//import fs3.wingspan.dto.APIKeyRequest;
//import fs3.wingspan.model.APIKeys;
//import fs3.wingspan.model.Teams;
//import fs3.wingspan.model.Users;
//import fs3.wingspan.model.UType;
//import fs3.wingspan.repository.APIKeyRepository;
//import fs3.wingspan.repository.TeamRepository;
//import fs3.wingspan.repository.TeamsRepository;
//import fs3.wingspan.repository.UserRepository;
//import fs3.wingspan.services.EmailService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.*;
//
//import java.time.LocalDateTime;
//import java.util.*;
//
//@RestController
//@RequestMapping("/teams")
//public class TeamsController {
//
//    @Autowired
//    private TeamsRepository teamRepository;
//
//    @Autowired
//    private UserRepository userRepository;
//
//    @Autowired
//    private APIKeyRepository apiKeyRepository;
//
//    @Autowired
//    private EmailService emailService;
//
//    /**
//     * create a new team
//     * POST /teams/create
//     */
//    @PostMapping("/create")
//    public Map<String, Object> createTeam(@RequestBody Map<String, String> request) {
//        String teamName = request.get("teamName");
//        String projectName = request.get("projectName");
//        String semester = request.get("semester");
//
//        // Check if team already exists
//        if (teamRepository.existsByName(teamName)) {
//            return Map.of("error", "Team with this name already exists");
//        }
//
//        // Create team
//        Teams team = new Teams();
//        team.setName(teamName);
//        team.setProjectName(projectName);
//        team.setSemester(semester);
//        Teams savedTeam = teamRepository.save(team);
//
//        // Auto-generate API key for the team
//        String keyVal = "rgds_" + UUID.randomUUID().toString().replace("-", "");
//
//        APIKeys key = new APIKeys();
//        key.setKeyVal(keyVal);
//        key.setTeamId(savedTeam.getId());
//        key.setTeamName(teamName);
//        key.setProjectName(projectName);
//        key.setSemester(semester);
//        key.setActive(true);
//        key.setExpiration(LocalDateTime.now().plusYears(1));
//        apiKeyRepository.save(key);
//
//        return Map.of(
//                "success", true,
//                "teamId", savedTeam.getId(),
//                "teamName", savedTeam.getName(),
//                "apiKey", keyVal,
//                "message", "Team created successfully. Now you can invite students."
//        );
//    }
//
//    /**
//     * Invite students to a team
//     * POST /teams/{teamId}/invite-students
//     */
//    @PostMapping("/{teamId}/invite-students")
//    public Map<String, Object> inviteStudents(
//            @PathVariable Integer teamId,
//            @RequestBody Map<String, List<String>> request) {
//
//        List<String> studentEmails = request.get("studentEmails");
//
//        // Get team
//        Teams team = teamRepository.findById(teamId).orElse(null);
//        if (team == null) {
//            return Map.of("error", "Team not found");
//        }
//
//        // Create user accounts and collect setup links
//        List<Map<String, String>> setupLinks = new ArrayList<>();
//
//        for (String email : studentEmails) {
//            if (userRepository.existsByEmail(email)) {
//                setupLinks.add(Map.of(
//                        "email", email,
//                        "status", "already exists"
//                ));
//                continue;
//            }
//
//            Users user = new Users();
//            user.setEmail(email);
//            user.setUsername(email.split("@")[0]);
//            user.setUtype(UType.STUDENT);
//            user.setTeamId(teamId);
//            user.setAccountActivated(false);
//
//            // Generate setup token
//            String setupToken = UUID.randomUUID().toString();
//            user.setSetupToken(setupToken);
//            user.setTokenExpiry(LocalDateTime.now().plusDays(7));
//            userRepository.save(user);
//
//            // Mock email - return setup link
//            String setupLink = "http://159.203.134.226:8080/user/setup-password?token=" + setupToken;
//            setupLinks.add(Map.of(
//                    "email", email,
//                    "setupLink", setupLink,
//                    "status", "invited"
//            ));
//
//            // Log mock email
//            emailService.sendSetupEmail(email, team.getName(), setupToken);
//        }
//
//        return Map.of(
//                "success", true,
//                "teamName", team.getName(),
//                "invitations", setupLinks
//        );
//    }
//
//    /**
//     * Get all teams
//     * GET /teams/all
//     */
//    @GetMapping("/all")
//    public List<Teams> getAllTeams() {
//        return teamRepository.findAll();
//    }
//
//    /**
//     * Get team by ID with members
//     * GET /teams/{teamId}
//     */
//    @GetMapping("/{teamId}")
//    public Map<String, Object> getTeam(@PathVariable Integer teamId) {
//        Teams team = teamRepository.findById(teamId).orElse(null);
//        if (team == null) {
//            return Map.of("error", "Team not found");
//        }
//
//        // Get team members
//        List<Users> members = userRepository.findByTeamId(teamId);
//
//        // Get API key
//        APIKeys apiKey = apiKeyRepository.findByTeamId(teamId);
//
//        return Map.of(
//                "id", team.getId(),
//                "name", team.getName(),
//                "projectName", team.getProjectName(),
//                "semester", team.getSemester(),
//                "createdAt", team.getCreatedAt().toString(),
//                "memberCount", members.size(),
//                "members", members.stream().map(u -> Map.of(
//                        "email", u.getEmail(),
//                        "username", u.getUsername(),
//                        "activated", u.getAccountActivated()
//                )).toList(),
//                "apiKey", apiKey != null ? apiKey.getKeyVal() : "No API key",
//                "apiKeyActive", apiKey != null ? apiKey.getActive() : false
//        );
//    }
//
//    /**
//     * Delete team
//     * DELETE /teams/{teamId}
//     */
//    @DeleteMapping("/{teamId}")
//    public String deleteTeam(@PathVariable Integer teamId) {
//        Teams team = teamRepository.findById(teamId).orElse(null);
//        if (team == null) {
//            return "Team not found";
//        }
//
//        String teamName = team.getName();
//        teamRepository.delete(team);
//        return "Team '" + teamName + "' has been deleted.";
//    }
//}