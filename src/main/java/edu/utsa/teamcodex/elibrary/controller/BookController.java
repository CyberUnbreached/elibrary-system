package edu.utsa.teamcodex.elibrary.controller;

import java.time.LocalDate;
import edu.utsa.teamcodex.elibrary.model.Book;
import edu.utsa.teamcodex.elibrary.repository.BookRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/books")
public class BookController {
    private final BookRepository bookRepository;

    public BookController(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @GetMapping
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    @PostMapping
    public Book addBook(@RequestBody Book book) {
        return bookRepository.save(book);
    }
    @PutMapping("/{id}/borrow")
    public Book borrowBook(@PathVariable Long id) {
    Book book = bookRepository.findById(id).orElseThrow(() -> new RuntimeException("Book not found"));
        if (!book.isAvailable()) {
            throw new RuntimeException("Book is already borrowed");
    }
    book.setAvailable(false);
    book.setDueDate(LocalDate.now().plusWeeks(2)); // due in 2 weeks
        return bookRepository.save(book);
}

@PutMapping("/{id}/return")
public Book returnBook(@PathVariable Long id) {
    Book book = bookRepository.findById(id).orElseThrow(() -> new RuntimeException("Book not found"));
    book.setAvailable(true);
    book.setDueDate(null);
        return bookRepository.save(book);
}

// DELETE endpoint
@DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBook(@PathVariable Long id) {
        Book book = bookRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        bookRepository.delete(book);
            return ResponseEntity.ok("Book with ID " + id + " has been deleted.");

}
}
