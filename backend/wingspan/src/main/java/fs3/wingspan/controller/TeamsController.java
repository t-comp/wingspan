package fs3.wingspan.controller;

import fs3.wingspan.dto.MessageResponse;
import fs3.wingspan.dto.UsersDTO;
import fs3.wingspan.model.APIKeys;
import fs3.wingspan.model.Teams;
import fs3.wingspan.model.Users;
import fs3.wingspan.model.UType;
import fs3.wingspan.repository.APIKeyRepository;
import fs3.wingspan.repository.TeamsRepository;
import fs3.wingspan.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/teams")
public class TeamsController {

    @Autowired
    private TeamsRepository teamsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private APIKeyRepository apiKeyRepository;

    /**
     * create a new team with auto gen api key
     * POST /teams/create
     */
    @PostMapping("/create")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createTeam(@RequestBody Teams t) {

        if (t.getName() == null || t.getName().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Team name is required"));
        }

        if (teamsRepository.existsByName(t.getName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("Team with this name already exists"));
        }

        Teams savedTeam = teamsRepository.save(t);

        // auto gen api key when team created
        String keyVal = "rgds_" + UUID.randomUUID().toString().replace("-", "");

        APIKeys k = new APIKeys();
        k.setKeyVal(keyVal);
        k.setTeamId(savedTeam.getId());
        k.setTeamName(t.getName());
        k.setProjectName(t.getProjectName());
        k.setSemester(t.getSemester());
        k.setActive(true);
        k.setExpiration(LocalDateTime.now().plusYears(1));
        apiKeyRepository.save(k);

        Map<String, Object> response = new HashMap<>();
        response.put("team", savedTeam);
        response.put("apiKey", keyVal);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * get all teams
     * GET /teams/all
     */
    @GetMapping("/all")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Teams>> getAllTeams() {
        return ResponseEntity.ok(teamsRepository.findAll());
    }

    /**
     * get team by ID
     * GET /teams/{teamId}
     */
    @GetMapping("/{teamId}")
    public ResponseEntity<?> getTeam(@PathVariable Integer teamId) {
        Teams team = teamsRepository.findById(teamId).orElse(null);
        if (team == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Team not found"));
        }
        return ResponseEntity.ok(team);
    }

    /**
     * get all unassigned students (ntahn drag/drop students)
     * GET /teams/unassigned-students
     */
    @GetMapping("/unassigned-students")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UsersDTO>> getUnassignedStudents() {
        List<Users> students = userRepository.findByTeamIdIsNullAndUtype(UType.STUDENT);
        List<UsersDTO> dtos = students.stream()
                .map(UsersDTO::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * get all members of a team
     * GET /teams/{teamId}/members
     */
    @GetMapping("/{teamId}/members")
    public ResponseEntity<?> getTeamMembers(@PathVariable Integer teamId) {
        if (!teamsRepository.existsById(teamId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Team not found"));
        }
        List<UsersDTO> dtos = userRepository.findByTeamId(teamId).stream()
                .map(UsersDTO::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * add member to team
     * PUT /teams/{teamId}/add-member
     */
    @PutMapping("/{teamId}/add-member")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> addMemberToTeam(@PathVariable Integer teamId, @RequestBody Map<String, Integer> request) {

        Integer userId = request.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("userId is required"));
        }

        Teams t = teamsRepository.findById(teamId).orElse(null);
        if (t == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Team not found"));
        }

        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("User not found"));
        }

        u.setTeamId(teamId);
        userRepository.save(u);

        return ResponseEntity.ok(new MessageResponse(u.getUsername() + " added to team " + t.getName()));
    }

    /**
     * remove member from team
     * PUT /teams/{teamId}/remove-member
     */
    @PutMapping("/{teamId}/remove-member")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> removeMemberFromTeam(@PathVariable Integer teamId,  @RequestBody Map<String, Integer> request) {

        Integer userId = request.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("userId is required"));
        }

        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("User not found"));
        }

        u.setTeamId(null);
        userRepository.save(u);

        return ResponseEntity.ok(new MessageResponse(u.getUsername() + " removed from team"));
    }

    /**
     * update team info
     * PUT /teams/{teamId}/update
     */
    @PutMapping("/{teamId}/update")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateTeam(@PathVariable Integer teamId, @RequestBody Teams nTeam) {
        Teams t = teamsRepository.findById(teamId).orElse(null);
        if (t == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Team not found"));
        }

        if (nTeam.getName() != null) {
            t.setName(nTeam.getName());
        }
        if (nTeam.getProjectName() != null) {
            t.setProjectName(nTeam.getProjectName());
        }
        if (nTeam.getSemester() != null) {
            t.setSemester(nTeam.getSemester());
        }

        teamsRepository.save(t);
        return ResponseEntity.ok(new MessageResponse("Team " + t.getName() + " has been updated"));
    }

    /**
     * delete team
     * DELETE /teams/{teamId}
     */
    @DeleteMapping("/{teamId}")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> deleteTeam(@PathVariable Integer teamId) {
        Teams t = teamsRepository.findById(teamId).orElse(null);
        if (t == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Team not found"));
        }
        
        List<Users> members = userRepository.findByTeamId(teamId);
        for (Users u : members) {
            u.setTeamId(null);
            userRepository.save(u);
        }

        teamsRepository.delete(t);
        return ResponseEntity.ok(new MessageResponse("Team '" + t.getName() + "' has been deleted."));
    }
}