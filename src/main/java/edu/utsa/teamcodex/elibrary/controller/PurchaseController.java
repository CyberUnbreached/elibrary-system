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
import java.time.LocalDateTime;
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

        double fallback = resolveEffectivePrice(book);
        int quantity = (purchaseRequest != null && purchaseRequest.getQuantity() > 0)
                ? purchaseRequest.getQuantity()
                : 1;
        double basePrice = book.getPrice();
        double pricePerUnit = (purchaseRequest != null && purchaseRequest.getPrice() > 0)
                ? purchaseRequest.getPrice()
                : fallback;
        double finalPrice = pricePerUnit * quantity;
        boolean saleApplied = pricePerUnit + 1e-9 < basePrice;

        Purchase purchase = new Purchase(
                user,
                book,
                finalPrice,
                LocalDate.now(),
                quantity,
                basePrice,
                saleApplied,
                null,
                null
        );
        purchaseRepository.save(purchase);

        return ResponseEntity.ok("Purchase successful for book: " + book.getTitle());
    }

    private double resolveEffectivePrice(Book book) {
        double base = book.getPrice();
        Double salePrice = book.getSalePrice();
        if (salePrice == null) return base;
        if (book.getOnSale() != null && !book.getOnSale()) return base;
        LocalDateTime now = LocalDateTime.now();
        if (book.getSaleStart() != null && book.getSaleStart().isAfter(now)) return base;
        if (book.getSaleEnd() != null && book.getSaleEnd().isBefore(now)) return base;
        return Math.min(base, salePrice);
    }
}
