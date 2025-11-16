package edu.utsa.teamcodex.elibrary.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Correct: Transaction is the "child" in the User → Transaction relationship
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonManagedReference("user-transactions")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id")
    @JsonIgnoreProperties({"borrowedBy"})  // prevent recursion
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
