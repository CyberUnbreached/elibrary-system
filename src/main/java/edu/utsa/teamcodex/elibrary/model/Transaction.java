package edu.utsa.teamcodex.elibrary.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonBackReference("user-transactions") // Prevent recursion
    private User user;

    @ManyToOne
    private Book book;

    private LocalDate borrowDate;
    private LocalDate returnDate;
    private boolean returned;

    public Transaction() {}

    public Transaction(User user, Book book, LocalDate borrowDate, LocalDate returnDate) {
        this.user = user;
        this.book = book;
        this.borrowDate = borrowDate;
        this.returnDate = returnDate;
        this.returned = false;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }
    public LocalDate getBorrowDate() { return borrowDate; }
    public void setBorrowDate(LocalDate borrowDate) { this.borrowDate = borrowDate; }
    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }
    public boolean isReturned() { return returned; }
    public void setReturned(boolean returned) { this.returned = returned; }
}
