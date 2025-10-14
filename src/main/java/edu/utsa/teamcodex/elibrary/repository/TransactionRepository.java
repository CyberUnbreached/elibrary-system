package edu.utsa.teamcodex.elibrary.repository;

import edu.utsa.teamcodex.elibrary.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
}
