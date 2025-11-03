package edu.utsa.teamcodex.elibrary.controller;

import edu.utsa.teamcodex.elibrary.model.Transaction;
import edu.utsa.teamcodex.elibrary.model.Book;
import edu.utsa.teamcodex.elibrary.model.User;
import edu.utsa.teamcodex.elibrary.repository.TransactionRepository;
import edu.utsa.teamcodex.elibrary.repository.BookRepository;
import edu.utsa.teamcodex.elibrary.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    public TransactionController(TransactionRepository transactionRepository,
                                 BookRepository bookRepository,
                                 UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    // 📜 Get all transactions (for admins/staff)
    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    // 👤 Get all transactions for a specific user
    @GetMapping("/user/{userId}")
    public List<Transaction> getTransactionsByUser(@PathVariable Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    // 📘 Get all transactions for a specific book
    @GetMapping("/book/{bookId}")
    public List<Transaction> getTransactionsByBook(@PathVariable Long bookId) {
        return transactionRepository.findByBookId(bookId);
    }

    // 🕐 Get all active (unreturned) transactions
    @GetMapping("/active")
    public List<Transaction> getActiveTransactions() {
        return transactionRepository.findByReturnedFalse();
    }

    // ➕ Create a transaction manually (usually done automatically in BookController)
    @PostMapping
    public ResponseEntity<String> createTransaction(@RequestBody Transaction transaction) {
        Book book = bookRepository.findById(transaction.getBook().getId())
                .orElseThrow(() -> new RuntimeException("Book not found"));
        User user = userRepository.findById(transaction.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!book.isAvailable()) {
            return ResponseEntity.badRequest().body("Book is already borrowed.");
        }

        book.setAvailable(false);
        book.setBorrowedBy(user);
        book.setDueDate(transaction.getReturnDate());
        bookRepository.save(book);

        transaction.setBorrowDate(LocalDate.now());
        transaction.setReturned(false);
        transactionRepository.save(transaction);

        return ResponseEntity.ok("Transaction successfully recorded.");
    }

    // 🔁 Mark a transaction as returned
    @PutMapping("/{transactionId}/return")
    public ResponseEntity<String> returnBook(@PathVariable Long transactionId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        Book book = tx.getBook();

        // Update book
        book.setAvailable(true);
        book.setBorrowedBy(null);
        book.setDueDate(null);
        bookRepository.save(book);

        // Update transaction
        tx.setReturned(true);
        tx.setReturnDate(LocalDate.now());
        transactionRepository.save(tx);

        return ResponseEntity.ok("Book returned and transaction closed.");
    }
}
