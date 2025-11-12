package edu.utsa.teamcodex.elibrary.repository;
import edu.utsa.teamcodex.elibrary.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);
}