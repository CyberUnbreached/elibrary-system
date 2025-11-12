package edu.utsa.teamcodex.elibrary.repository;
import edu.utsa.teamcodex.elibrary.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> { }

