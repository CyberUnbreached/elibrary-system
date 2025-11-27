package edu.utsa.teamcodex.elibrary.controller;

import java.time.LocalDate;
import java.util.List;

import edu.utsa.teamcodex.elibrary.model.Book;
import edu.utsa.teamcodex.elibrary.model.Transaction;
import edu.utsa.teamcodex.elibrary.model.User;
import edu.utsa.teamcodex.elibrary.repository.BookRepository;
import edu.utsa.teamcodex.elibrary.repository.TransactionRepository;
import edu.utsa.teamcodex.elibrary.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/books")
public class BookController {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public BookController(BookRepository bookRepository, UserRepository userRepository, TransactionRepository transactionRepository) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    // 📚 Get all books
    @GetMapping
    public List<Book> getAllBooks(@RequestParam(value = "q", required = false) String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return bookRepository.findAll();
        }

        String term = searchTerm.trim();
        return bookRepository
                .findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrGenreContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                        term, term, term, term);
    }

    // ➕ Add a book (staff only)
    @PostMapping
    public Book addBook(@RequestBody Book book) {
        return bookRepository.save(book);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        return bookRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping(path = "/{id}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Book> updateBook(
            @PathVariable Long id,
            @RequestBody Book updatedBook) {

        return bookRepository.findById(id)
                .map(book -> {
                    book.setTitle(updatedBook.getTitle());
                    book.setAuthor(updatedBook.getAuthor());
                    book.setGenre(updatedBook.getGenre());
                    book.setDescription(updatedBook.getDescription());
                    book.setPrice(updatedBook.getPrice());
                    // Persist inventory quantity from the update payload
                    book.setQuantity(updatedBook.getQuantity());
                    book.setImageUrl(updatedBook.getImageUrl());
                    book.setAvailable(updatedBook.isAvailable());
                    if (updatedBook.getSalePrice() != null) {
                        book.setSalePrice(updatedBook.getSalePrice());
                    }
                    if (updatedBook.getSaleStart() != null) {
                        book.setSaleStart(updatedBook.getSaleStart());
                    }
                    if (updatedBook.getSaleEnd() != null) {
                        book.setSaleEnd(updatedBook.getSaleEnd());
                    }
                    if (updatedBook.getOnSale() != null) {
                        book.setOnSale(updatedBook.getOnSale());
                    }
                    bookRepository.save(book);
                    return ResponseEntity.ok(book);
                })
                .orElse(ResponseEntity.notFound().build());
    }


    // 📖 Borrow a book (customer)
    @PutMapping("/{bookId}/borrow/{userId}")
    public ResponseEntity<String> borrowBook(@PathVariable Long bookId, @PathVariable Long userId,
                                             @RequestParam(required = false) String returnDate) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!book.isAvailable()) {
            return ResponseEntity.badRequest().body("Book is already borrowed.");
        }

        // Parse return date or set to 2 weeks by default
        LocalDate dueDate = (returnDate != null)
                ? LocalDate.parse(returnDate)
                : LocalDate.now().plusWeeks(2);

        // Link book to user
        book.setAvailable(false);
        book.setBorrowedBy(user);
        book.setDueDate(dueDate);
        bookRepository.save(book);

        // Record transaction
        Transaction transaction = new Transaction();
        transaction.setBook(book);
        transaction.setUser(user);
        transaction.setBorrowDate(LocalDate.now());
        transaction.setReturnDate(dueDate);
        transaction.setReturned(false);
        transactionRepository.save(transaction);

        return ResponseEntity.ok("Book borrowed successfully until " + dueDate);
    }

    // 🔁 Return a book (customer)
    @PutMapping("/{bookId}/return/{userId}")
    public ResponseEntity<String> returnBook(@PathVariable Long bookId, @PathVariable Long userId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));
        //User user = userRepository.findById(userId)
          //      .orElseThrow(() -> new RuntimeException("User not found"));

        if (book.isAvailable() || book.getBorrowedBy() == null) {
            return ResponseEntity.badRequest().body("This book is not currently borrowed.");
        }

        if (!book.getBorrowedBy().getId().equals(userId)) {
            return ResponseEntity.badRequest().body("This book was not borrowed by this user.");
        }

        // Update book status
        book.setAvailable(true);
        book.setBorrowedBy(null);
        book.setDueDate(null);
        bookRepository.save(book);

        // Update transaction record
        Transaction tx = transactionRepository.findByBookIdAndUserIdAndReturnedFalse(bookId, userId)
                .orElseThrow(() -> new RuntimeException("No active transaction found for this book and user."));
        tx.setReturned(true);
        tx.setReturnDate(LocalDate.now());
        transactionRepository.save(tx);

        return ResponseEntity.ok("Book returned successfully.");
    }

    // ❌ Delete book (staff only)
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBook(@PathVariable Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        bookRepository.delete(book);
        return ResponseEntity.ok("Book with ID " + id + " has been deleted.");
    }
}
