package edu.utsa.teamcodex.elibrary.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String author;
    private String genre;
    private boolean available = true;

    private LocalDate dueDate;
    private double price;

    @ManyToOne
    @JoinColumn(name = "borrowed_by_id")
    @JsonBackReference("user-books")
    private User borrowedBy;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public User getBorrowedBy() { return borrowedBy; }
    public void setBorrowedBy(User borrowedBy) { this.borrowedBy = borrowedBy; }
}
