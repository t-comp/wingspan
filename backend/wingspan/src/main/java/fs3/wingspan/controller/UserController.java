package fs3.wingspan.controller;

import fs3.wingspan.dto.*;
import fs3.wingspan.model.UType;
import fs3.wingspan.model.Users;
import fs3.wingspan.model.Teams;
import fs3.wingspan.model.APIKeys;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import fs3.wingspan.repository.UserRepository;
import fs3.wingspan.repository.TeamsRepository;
import fs3.wingspan.repository.APIKeyRepository;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private TeamsRepository teamsRepository;

    @Autowired
    private APIKeyRepository apiKeyRepository;


    //********** ACCOUNT CREATION + LOGGING IN **********

    /**
     * create new account (student self-registers)
     * POST /user/create-account
     */
    @PostMapping("/create-account")
    public ResponseEntity<?> createAccount(@RequestBody Users u) {

        // validate username
        if (u.getUsername() == null || u.getUsername().length() < 5) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Please make sure username is at least 5 characters."));
        }
        if (userRepository.existsByUsername(u.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("Account with this username already exists."));
        }

        // validate email
        if (!isValidEmail(u.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Email address entered is not valid."));
        }
        if (userRepository.existsByEmail(u.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("An account with this email already exists"));
        }

        // validate pw
        if (!isValidPassword(u.getPassword())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Please make sure password is at least 7 characters."));
        }

        // hash pw
        String pwHash = passwordEncoder.encode(u.getPassword());
        u.setPassword(pwHash);

        // always student on self-register, admin assigns them to a team later
        u.setUtype(UType.STUDENT);
        u.setIsActive(true);

        Users saved = userRepository.save(u);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UsersDTO.fromUser(saved));
    }

    /**
     * admin creates an account on behalf of a student
     * can optionally assign them to a team right away
     * POST /user/admin/create-account
     */
    @PostMapping("/admin/create-account")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminCreateAccount(@RequestBody Users u) {

        // validate username
        if (u.getUsername() == null || u.getUsername().length() < 5) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Please make sure username is at least 5 characters."));
        }
        if (userRepository.existsByUsername(u.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("Account with this username already exists."));
        }

        // validate email
        if (!isValidEmail(u.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Email address entered is not valid."));
        }
        if (userRepository.existsByEmail(u.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("An account with this email already exists"));
        }

        // validate pw
        if (!isValidPassword(u.getPassword())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Please make sure password is at least 7 characters."));
        }

        // if a teamId was provided, make sure it actually exists
        if (u.getTeamId() != null) {
            if (!teamsRepository.existsById(u.getTeamId())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Team not found"));
            }
        }

        // hash pw
        String pwHash = passwordEncoder.encode(u.getPassword());
        u.setPassword(pwHash);

        // default to student if not specified
        if (u.getUtype() == null) {
            u.setUtype(UType.STUDENT);
        }
        u.setIsActive(true);

        Users saved = userRepository.save(u);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UsersDTO.fromUser(saved));
    }

    /**
     * user logs in with username or email and password
     * POST /user/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginInfoDTO info) {
        if (info.getUsernameOrEmail() == null || info.getPassword() == null ||
                info.getUsernameOrEmail().isEmpty() || info.getPassword().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Please make sure you have entered your login information."));
        }

        Users u = null;

        if (info.getUsernameOrEmail().contains("@")) {
            u = userRepository.findByEmail(info.getUsernameOrEmail());
        } else {
            u = userRepository.findByUsername(info.getUsernameOrEmail());
        }

        if (u != null && passwordEncoder.matches(info.getPassword(), u.getPassword())) {
            return ResponseEntity.ok(UsersDTO.fromUser(u));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new MessageResponse("Username/email or password is incorrect."));
    }


    // ACCOUNT VALIDATION HELPER METHODS

    /**
     * validate password length
     */
    private boolean isValidPassword(String password) {
        return password != null && password.length() >= 7;
    }

    /**
     * validate email format with regex
     */
    private boolean isValidEmail(String email) {
        if (email == null) return false;
        String emailRegex= "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$";
        return email.matches(emailRegex);
    }


    //********** MANAGE USERS **********

    /**
     * get all users
     * GET /user/all
     */
    @GetMapping("/all")
    public ResponseEntity<List<UsersDTO>> getAllUsers() {
        List<Users> users = userRepository.findAll();
        List<UsersDTO> dtos = users.stream()
                .map(UsersDTO::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * get user by their ID
     * GET /user/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable int userId) {
        Users user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }
        return ResponseEntity.ok(UsersDTO.fromUser(user));
    }

    /**
     * get user by their username
     * GET /user/username/{username}
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        Users user = userRepository.findByUsername(username);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }
        return ResponseEntity.ok(UsersDTO.fromUser(user));
    }

    /**
     * get user by their email
     * GET /user/email/{email}
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        Users user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }
        return ResponseEntity.ok(UsersDTO.fromUser(user));
    }

    /**
     * reset password with email
     * PUT /user/reset-password?email=email_here&newPassword=password_here
     */
    @PutMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@RequestParam String email, @RequestParam String newPassword) {
        Users u = userRepository.findByEmail(email);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        if (!isValidPassword(newPassword)) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Please make sure the password is at least 7 characters."));
        }

        String hashPW = passwordEncoder.encode(newPassword);
        u.setPassword(hashPW);
        userRepository.save(u);

        return ResponseEntity.ok(new MessageResponse("Your password has been reset!"));
    }

    /**
     * update user's username
     * PUT /user/{userId}/update-username?newUsername=username_here
     */
    @PutMapping("/{userId}/update-username")
    public ResponseEntity<MessageResponse> updateUsername(@PathVariable int userId, @RequestParam String newUsername) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        if (newUsername == null || newUsername.length() < 5) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Please make sure your username is at least 5 characters."));
        }

        if (!newUsername.equals(u.getUsername()) && userRepository.existsByUsername(newUsername)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("Username '" + newUsername + "' already exists."));
        }

        u.setUsername(newUsername);
        userRepository.save(u);

        return ResponseEntity.ok(new MessageResponse("Username has been updated to '" + newUsername + "'!"));
    }

    /**
     * update user email
     * PUT /user/{userId}/update-email?newEmail=email_here
     */
    @PutMapping("/{userId}/update-email")
    public ResponseEntity<MessageResponse> updateEmail(@PathVariable int userId, @RequestParam String newEmail) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        if (!isValidEmail(newEmail)) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid email address entered."));
        }

        if (!newEmail.equals(u.getEmail()) && userRepository.existsByEmail(newEmail)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("Email '" + newEmail + "' already exists."));
        }

        u.setEmail(newEmail);
        userRepository.save(u);

        return ResponseEntity.ok(new MessageResponse("Email has been updated to '" + newEmail + "'!"));
    }

    /**
     * make a user an admin
     * PUT /user/{userId}/make-admin
     */
    @PutMapping("/{userId}/make-admin")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> setAdmin(@PathVariable int userId) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        u.setUtype(UType.ADMIN);
        userRepository.save(u);

        return ResponseEntity.ok(new MessageResponse("Welcome to the cool kids club (admins), " + u.getUsername() + "!"));
    }

    /**
     * make user a student
     * PUT /user/{userId}/make-student
     */
    @PutMapping("/{userId}/make-student")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> setStudent(@PathVariable int userId) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        u.setUtype(UType.STUDENT);
        userRepository.save(u);

        return ResponseEntity.ok(new MessageResponse("User " + u.getUsername() + " is now a student!"));
    }

    /**
     * activate a user account
     * PUT /user/{userId}/activate
     */
    @PutMapping("/{userId}/activate")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> activateUser(@PathVariable int userId) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        u.setIsActive(true);
        userRepository.save(u);

        return ResponseEntity.ok(new MessageResponse(u.getUsername() + "'s account has been activated!"));
    }

    /**
     * deactivate a user account
     * PUT /user/{userId}/deactivate
     */
    @PutMapping("/{userId}/deactivate")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> deactivateUser(@PathVariable int userId) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        u.setIsActive(false);
        userRepository.save(u);

        return ResponseEntity.ok(new MessageResponse(u.getUsername() + "'s account has been deactivated!"));
    }

    /**
     * delete a user by their ID
     * DELETE /user/{userId}
     */
    @DeleteMapping("/{userId}")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable int userId) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        String username = u.getUsername();
        userRepository.delete(u);

        return ResponseEntity.ok(new MessageResponse("Goodbye " + username + ", user has been deleted successfully!"));
    }

    /**
     * delete all users (BE CAREFUL!)
     * DELETE /user/delete-all
     */
    @DeleteMapping("/delete-all")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> deleteAllUsers() {
        userRepository.deleteAll();
        return ResponseEntity.ok(new MessageResponse("Goodbye everyone! All users have been deleted."));
    }

    /**
     * get user's dashboard info (including API key)
     * GET /user/dashboard?email=student@iastate.edu
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@RequestParam String email) {
        Users u = userRepository.findByEmail(email);

        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        // build response map
        Map<String, Object> dash = new HashMap<>();
        dash.put("user", UsersDTO.fromUser(u));

        if (u.getTeamId() == null) {
            dash.put("hasTeam", false);
            dash.put("message", "You are not currently assigned to a team.");
            return ResponseEntity.ok(dash);
        }

        // get team info
        Teams t = teamsRepository.findById(u.getTeamId()).orElse(null);

        // get API key for team
        APIKeys apiKey = apiKeyRepository.findByTeamId(u.getTeamId());

        if (t == null || apiKey == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Team or API key not found"));
        }

        dash.put("hasTeam", true);
        dash.put("teamName", t.getName());
        dash.put("projectName", t.getProjectName());
        dash.put("semester", t.getSemester());
        dash.put("apiKey", apiKey.getKeyVal());
        dash.put("apiKeyActive", apiKey.getActive());
        dash.put("expiresAt", apiKey.getExpiration().toString());

        return ResponseEntity.ok(dash);
    }
}