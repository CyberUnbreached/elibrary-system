package edu.utsa.teamcodex.elibrary.controller;

import edu.utsa.teamcodex.elibrary.model.Book;
import edu.utsa.teamcodex.elibrary.repository.BookRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/sales")
public class SaleController {

    private final BookRepository bookRepository;

    public SaleController(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    // DTO for create/update sale requests
    public static class SaleRequest {
        private Long bookId;
        private Double salePrice;
        private LocalDateTime startsAt;
        private LocalDateTime endsAt;

        public Long getBookId() { return bookId; }
        public void setBookId(Long bookId) { this.bookId = bookId; }
        public Double getSalePrice() { return salePrice; }
        public void setSalePrice(Double salePrice) { this.salePrice = salePrice; }
        public LocalDateTime getStartsAt() { return startsAt; }
        public void setStartsAt(LocalDateTime startsAt) { this.startsAt = startsAt; }
        public LocalDateTime getEndsAt() { return endsAt; }
        public void setEndsAt(LocalDateTime endsAt) { this.endsAt = endsAt; }
    }

    // DTO for responses
    public static class SaleResponse {
        private Long id;
        private Long bookId;
        private String bookTitle;
        private Double salePrice;
        private Double basePrice;
        private LocalDateTime startsAt;
        private LocalDateTime endsAt;
        private Boolean active;
        private Book book;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getBookId() { return bookId; }
        public void setBookId(Long bookId) { this.bookId = bookId; }
        public String getBookTitle() { return bookTitle; }
        public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }
        public Double getSalePrice() { return salePrice; }
        public void setSalePrice(Double salePrice) { this.salePrice = salePrice; }
        public Double getBasePrice() { return basePrice; }
        public void setBasePrice(Double basePrice) { this.basePrice = basePrice; }
        public LocalDateTime getStartsAt() { return startsAt; }
        public void setStartsAt(LocalDateTime startsAt) { this.startsAt = startsAt; }
        public LocalDateTime getEndsAt() { return endsAt; }
        public void setEndsAt(LocalDateTime endsAt) { this.endsAt = endsAt; }
        public Boolean getActive() { return active; }
        public void setActive(Boolean active) { this.active = active; }
        public Book getBook() { return book; }
        public void setBook(Book book) { this.book = book; }
    }

    @GetMapping
    public List<SaleResponse> listSales() {
        return bookRepository.findAll().stream()
                .filter(this::isSaleConfigured)
                .map(this::toSaleResponse)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> createSale(@RequestBody SaleRequest request) {
        if (request.getBookId() == null) {
            return ResponseEntity.badRequest().body("bookId is required");
        }
        if (request.getSalePrice() == null || request.getSalePrice() <= 0) {
            return ResponseEntity.badRequest().body("salePrice must be greater than 0");
        }

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new RuntimeException("Book not found"));

        if (request.getSalePrice() >= book.getPrice()) {
            return ResponseEntity.badRequest().body("Sale price must be lower than the base price");
        }

        if (request.getStartsAt() != null && request.getEndsAt() != null
                && request.getEndsAt().isBefore(request.getStartsAt())) {
            return ResponseEntity.badRequest().body("End time must be after start time");
        }

        book.setSalePrice(request.getSalePrice());
        book.setSaleStart(request.getStartsAt() != null ? request.getStartsAt() : LocalDateTime.now());
        book.setSaleEnd(request.getEndsAt());
        book.setOnSale(true);
        bookRepository.save(book);

        return ResponseEntity.ok(toSaleResponse(book));
    }

    @PostMapping("/{bookId}/deactivate")
    public ResponseEntity<?> deactivateSale(@PathVariable Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        book.setOnSale(false);
        book.setSaleEnd(LocalDateTime.now());
        bookRepository.save(book);

        return ResponseEntity.ok("Sale deactivated");
    }

    private boolean isSaleConfigured(Book book) {
        return Boolean.TRUE.equals(book.getOnSale()) && book.getSalePrice() != null;
    }

    private boolean isSaleActive(Book book) {
        if (!isSaleConfigured(book)) return false;
        LocalDateTime now = LocalDateTime.now();
        if (book.getSaleStart() != null && book.getSaleStart().isAfter(now)) return false;
        if (book.getSaleEnd() != null && book.getSaleEnd().isBefore(now)) return false;
        return book.getSalePrice() < book.getPrice();
    }

    private SaleResponse toSaleResponse(Book book) {
        SaleResponse resp = new SaleResponse();
        resp.setId(book.getId()); // we use the book id as the sale id
        resp.setBookId(book.getId());
        resp.setBookTitle(book.getTitle());
        resp.setSalePrice(book.getSalePrice());
        resp.setBasePrice(book.getPrice());
        resp.setStartsAt(book.getSaleStart());
        resp.setEndsAt(book.getSaleEnd());
        resp.setActive(isSaleActive(book));
        resp.setBook(book);
        return resp;
    }
}
