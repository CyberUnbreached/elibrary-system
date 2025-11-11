package edu.utsa.teamcodex.elibrary.controller;

import edu.utsa.teamcodex.elibrary.model.Book;
import edu.utsa.teamcodex.elibrary.model.Purchase;
import edu.utsa.teamcodex.elibrary.model.User;
import edu.utsa.teamcodex.elibrary.repository.BookRepository;
import edu.utsa.teamcodex.elibrary.repository.PurchaseRepository;
import edu.utsa.teamcodex.elibrary.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/purchases")
public class PurchaseController {

    private final PurchaseRepository purchaseRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public PurchaseController(PurchaseRepository purchaseRepository, UserRepository userRepository, BookRepository bookRepository) {
        this.purchaseRepository = purchaseRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    // Get all purchases
    @GetMapping
    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    // Get purchases by user
    @GetMapping("/user/{userId}")
    public List<Purchase> getPurchasesByUser(@PathVariable Long userId) {
        return purchaseRepository.findByUserId(userId);
    }

    // Create a purchase
    @PostMapping("/{userId}/{bookId}")
    public ResponseEntity<?> purchaseBook(
            @PathVariable Long userId,
            @PathVariable Long bookId,
            @RequestBody(required = false) Purchase purchaseRequest
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        double price = (purchaseRequest != null && purchaseRequest.getPrice() > 0)
                ? purchaseRequest.getPrice()
                : 9.99; // default fallback price if not provided

        Purchase purchase = new Purchase(user, book, price, LocalDate.now());
        purchaseRepository.save(purchase);

        return ResponseEntity.ok("Purchase successful for book: " + book.getTitle());
    }
}
