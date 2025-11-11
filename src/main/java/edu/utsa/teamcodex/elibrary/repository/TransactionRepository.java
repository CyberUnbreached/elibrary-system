package edu.utsa.teamcodex.elibrary.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import edu.utsa.teamcodex.elibrary.model.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserId(Long userId);
    List<Transaction> findByBookId(Long bookId);
    List<Transaction> findByReturnedFalse();
    Optional<Transaction> findByBookIdAndUserIdAndReturnedFalse(Long bookId, Long userId);
}


