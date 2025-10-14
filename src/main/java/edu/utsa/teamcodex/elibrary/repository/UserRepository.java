package edu.utsa.teamcodex.elibrary.repository;

import edu.utsa.teamcodex.elibrary.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}
