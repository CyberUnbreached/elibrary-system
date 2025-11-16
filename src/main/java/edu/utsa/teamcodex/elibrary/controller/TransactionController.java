package edu.utsa.teamcodex.elibrary.controller;

import edu.utsa.teamcodex.elibrary.model.Transaction;
import edu.utsa.teamcodex.elibrary.repository.TransactionRepository;
import edu.utsa.teamcodex.elibrary.repository.UserRepository;
import edu.utsa.teamcodex.elibrary.repository.BookRepository;
import edu.utsa.teamcodex.elibrary.model.User;
import edu.utsa.teamcodex.elibrary.model.Book;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public TransactionController(
            TransactionRepository transactionRepository,
            UserRepository userRepository,
            BookRepository bookRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    // Return all transactions with full user + book objects
    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    // Return all transactions for the given user
    @GetMapping("/user/{userId}")
    public List<Transaction> getTransactionsByUser(@PathVariable Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    // Create new transaction
    @PostMapping
    public Transaction createTransaction(@RequestBody Transaction transaction) {

        // Resolve user entity
        if (transaction.getUser() != null && transaction.getUser().getId() != null) {
            User user = userRepository.findById(transaction.getUser().getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            transaction.setUser(user);
        }

        // Resolve book entity
        if (transaction.getBook() != null && transaction.getBook().getId() != null) {
            Book book = bookRepository.findById(transaction.getBook().getId())
                    .orElseThrow(() -> new RuntimeException("Book not found"));
            transaction.setBook(book);
        }

        return transactionRepository.save(transaction);
    }

    @DeleteMapping("/{id}")
    public void deleteTransaction(@PathVariable Long id) {
        transactionRepository.deleteById(id);
    }
}
