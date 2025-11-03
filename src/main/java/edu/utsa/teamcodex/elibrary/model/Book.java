package edu.utsa.teamcodex.elibrary.model;

import java.time.LocalDate;
import jakarta.persistence.*;

@Entity
public class Book {

    // ✅ This is your primary key
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String author;
    private String genre;
    private boolean available = true;
    private LocalDate dueDate;

    // ✅ This is your relationship to the User table
    @ManyToOne
    @JoinColumn(name = "borrowed_by_user_id")
    private User borrowedBy; // null if available

    // Getters and Setters
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }
    public void setAuthor(String author) {
        this.author = author;
    }

    public String getGenre() {
        return genre;
    }
    public void setGenre(String genre) {
        this.genre = genre;
    }

    public boolean isAvailable() {
        return available;
    }
    public void setAvailable(boolean available) {
        this.available = available;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }
    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public User getBorrowedBy() {
        return borrowedBy;
    }
    public void setBorrowedBy(User borrowedBy) {
        this.borrowedBy = borrowedBy;
    }
}
