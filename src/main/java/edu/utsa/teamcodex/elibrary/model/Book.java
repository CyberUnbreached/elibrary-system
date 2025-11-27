package edu.utsa.teamcodex.elibrary.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String author;
    private String genre;
    private String description;

    private boolean available = true;
    private LocalDate dueDate;

    private double price;

    // NEW: Image URL for displaying book images
    private String imageUrl;

    // NEW: Inventory quantity
    private int quantity;

    // Optional sale fields (time-boxed sale price override)
    private Double salePrice;
    private LocalDateTime saleStart;
    private LocalDateTime saleEnd;
    private Boolean onSale;

    @ManyToOne
    @JoinColumn(name = "borrowed_by_id")
    @JsonBackReference("user-books")
    private User borrowedBy;

    // ===== Constructors =====
    public Book() {}

    public Book(String title, String author, String genre, String description, double price, String imageUrl, int quantity) {
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.quantity = quantity;
        this.available = true;
    }

    // ===== Getters & Setters =====
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public User getBorrowedBy() { return borrowedBy; }
    public void setBorrowedBy(User borrowedBy) { this.borrowedBy = borrowedBy; }

    public Double getSalePrice() { return salePrice; }
    public void setSalePrice(Double salePrice) { this.salePrice = salePrice; }

    public LocalDateTime getSaleStart() { return saleStart; }
    public void setSaleStart(LocalDateTime saleStart) { this.saleStart = saleStart; }

    public LocalDateTime getSaleEnd() { return saleEnd; }
    public void setSaleEnd(LocalDateTime saleEnd) { this.saleEnd = saleEnd; }

    public Boolean getOnSale() { return onSale; }
    public void setOnSale(Boolean onSale) { this.onSale = onSale; }
}
