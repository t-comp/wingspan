package fs3.wingspan.controller;

import fs3.wingspan.dto.LoginInfoDTO;
import fs3.wingspan.model.UType;
import fs3.wingspan.model.Users;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import fs3.wingspan.repository.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;


    //********** ACCOUNT CREATION + LOGGING IN **********

    /**
     * create new account
     * POST /user/create-account
     */
    @PostMapping("/create-account")
    public String createAccount(@RequestBody Users u) {

        // validate username
        if (u.getUsername() == null || u.getUsername().length() < 5) {
            return "Please make sure username is at least 5 characters.";
        }
        if (userRepository.existsByUsername(u.getUsername())) {
            return "Account with this username already exists.";
        }

        // validate email
        if (!isValidEmail(u.getEmail())) {
            return "Email address entered is not valid.";
        }
        if (userRepository.existsByEmail(u.getEmail())) {
            return "An account with this email already exists";
        }

        // validate pw
        if (!isValidPassword(u.getPassword())) {
            return "Please make sure password is at least 7 characters.";
        }

        // hash pw
        String pwHash = passwordEncoder.encode(u.getPassword());
        u.setPassword(pwHash);

        // default type as student
        if (u.getUtype() == null) {
            u.setUtype(UType.STUDENT);
        }

        userRepository.save(u);
        return "Account created successfully!";
    }

    /**
     * user logs in with username or email and password
     * POST /user/login
     */
    @PostMapping("/login")
    public String login(@RequestBody LoginInfoDTO info) {
        if (info.getUsernameOrEmail() == null || info.getPassword() == null ||
                info.getUsernameOrEmail().isEmpty() || info.getPassword().isEmpty()) {
            return "Please make sure you have entered your login information.";
        }

        Users u = null;

        if (info.getUsernameOrEmail().contains("@")) {
            u = userRepository.findByEmail(info.getUsernameOrEmail());
        } else {
            u = userRepository.findByUsername(info.getUsernameOrEmail());
        }

        if (u != null && passwordEncoder.matches(info.getPassword(), u.getPassword())) {
            return "Welcome back " + u.getUsername() + "!";
        }
        return "Username/email or password is incorrect.";
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
    public List<Users> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * get user by their ID
     * GET /user/{userId}
     */
    @GetMapping("/{userId}")
    public Users getUserById(@PathVariable int userId) {
        return userRepository.findById(userId).orElse(null);
    }

    /**
     * get user by their username
     * GET /user/username/{username}
     *
     */
    @GetMapping("/username/{username}")
    public Users getUserByUsername(@PathVariable String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * get user by their email
     * GET /user/email/{email}
     */
    @GetMapping("/email/{email}")
    public Users getUserByEmail(@PathVariable String email) {
        return userRepository.findByEmail(email);
    }

    /** reset password with email
     * PUT /user/reset-password?email=email_here&newPassword=password_here
     */
    @PutMapping("/reset-password")
    public String resetPassword(@RequestParam String email, @RequestParam String newPassword) {
        Users u = userRepository.findByEmail(email);
        if (u == null) {
            return "Email '" + email + "' was not found.";
        }

        if (!isValidPassword(newPassword)) {
            return "Please make sure the password is at least 7 characters.";
        }

        String hashPW = passwordEncoder.encode(newPassword);
        u.setPassword(hashPW);
        userRepository.save(u);

        return "Your password has been reset!";
    }

    /**
     * update user's username
     * PUT /user/{userId}/update-username?newUsername=username_here
     */
    @PutMapping("/{userId}/update-username")
    public String updateUsername(@PathVariable int userId, @RequestParam String newUsername) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return "User with ID " + userId + " was not found.";
        }

        if (newUsername == null || newUsername.length() < 5) {
            return "Please make sure your username is at least 5 characters.";
        }

        if (!newUsername.equals(u.getUsername()) && userRepository.existsByUsername(newUsername)) {
            return "Username '" + newUsername + "' already exists.";
        }

        u.setUsername(newUsername);
        userRepository.save(u);
        return "Username has been updated to '" + newUsername + "'!";
    }

    /**
     * update user email
     * PUT /user/{userId}/update-email?newEmail=email_here
     */
    @PutMapping("/{userId}/update-email")
    public String updateEmail(@PathVariable int userId, @RequestParam String newEmail) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return "User with ID " + userId + " was not found.";
        }

        if (!isValidEmail(newEmail)) {
            return "Invalid email address entered.";
        }

        if (!newEmail.equals(u.getEmail()) && userRepository.existsByEmail(newEmail)) {
            return "Email '" + newEmail + "' already exists.";
        }

        u.setEmail(newEmail);
        userRepository.save(u);
        return "Email has been updated to '" + newEmail + "'!";
    }

    /**
     * make a user an admin
     * PUT /user/{userId}/make-admin
     */
    @PutMapping("/{userId}/make-admin")
    public String setAdmin(@PathVariable int userId) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return "User with ID " + userId + " was not found.";
        }

        u.setUtype(UType.ADMIN);
        userRepository.save(u);
        return "Welcome to the cool kids club (admins), " + u.getUsername() + "!";
    }

    /**
     * make user a student
     * PUT /user/{userId}/make-student
     */
    @PutMapping("/{userId}/make-student")
    public String setStudent(@PathVariable int userId) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return "User with ID " + userId + " was not found.";
        }

        u.setUtype(UType.STUDENT);
        userRepository.save(u);
        return "User " + u.getUsername() + " is now a student!";
    }

    /**
     * delete a user by their ID
     * DELETE /user/{userId}
     */
    @DeleteMapping("/{userId}")
    public String deleteUser(@PathVariable int userId) {
        Users u = userRepository.findById(userId).orElse(null);
        if (u == null) {
            return "User with ID " + userId + " was not found.";
        }

        String username = u.getUsername();
        userRepository.delete(u);
        return "Goodbye " + username + ", user has been deleted successfully!";
    }

    /**
     * delete all users (BE CAREFUL!)
     * DELETE /user/delete-all
     */
    @DeleteMapping("/delete-all")
    public String deleteAllUsers() {
        userRepository.deleteAll();
        return "Goodbye everyone! All users have been deleted.";
    }



}
