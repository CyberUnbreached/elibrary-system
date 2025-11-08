package edu.utsa.teamcodex.elibrary.repository;

import edu.utsa.teamcodex.elibrary.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByUserId(Long userId);
}
