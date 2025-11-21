package edu.utsa.teamcodex.elibrary.controller;

import edu.utsa.teamcodex.elibrary.model.User;
import edu.utsa.teamcodex.elibrary.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Get all users
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Register a new user
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    // LOGIN ENDPOINT
    @PostMapping(
        path = "/login",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        User user = userRepository.findByUsername(username);
        if (user == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping(
        path = "/{id}",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            String newUsername = body.getOrDefault("username", "").trim();
            String newEmail = body.getOrDefault("email", "").trim();

            if (newUsername.isEmpty() || newEmail.isEmpty()) {
                return ResponseEntity.badRequest().body("Username and email are required.");
            }

            User usernameOwner = userRepository.findByUsernameIgnoreCase(newUsername);
            if (usernameOwner != null && !usernameOwner.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Username is already taken.");
            }

            User emailOwner = userRepository.findByEmailIgnoreCase(newEmail);
            if (emailOwner != null && !emailOwner.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Email is already taken.");
            }

            user.setUsername(newUsername);
            user.setEmail(newEmail);
            userRepository.save(user);

            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found."));
    }
}
