package edu.utsa.teamcodex.elibrary.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "purchases")
public class Purchase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User user;

    @ManyToOne(optional = false)
    private Book book;

    private double price;

    private LocalDate purchaseDate;

    // Additional context for reporting
    private int quantity = 1;              // number of copies purchased
    private double basePrice;              // regular unit price at time of purchase
    private Boolean saleApplied;           // whether a sale price was used
    private String discountCodeUsed;       // discount code applied, if any
    private Double discountPercentApplied; // percent discount applied from code

    // Constructors
    public Purchase() {}

    public Purchase(User user, Book book, double price, LocalDate purchaseDate) {
        this.user = user;
        this.book = book;
        this.price = price;
        this.purchaseDate = purchaseDate;
    }

    public Purchase(User user, Book book, double price, LocalDate purchaseDate,
                    int quantity, double basePrice, boolean saleApplied,
                    String discountCodeUsed, Double discountPercentApplied) {
        this.user = user;
        this.book = book;
        this.price = price;
        this.purchaseDate = purchaseDate;
        this.quantity = quantity;
        this.basePrice = basePrice;
        this.saleApplied = saleApplied;
        this.discountCodeUsed = discountCodeUsed;
        this.discountPercentApplied = discountPercentApplied;
    }

    // Getters and Setters
    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getBasePrice() { return basePrice; }
    public void setBasePrice(double basePrice) { this.basePrice = basePrice; }

    public Boolean getSaleApplied() { return saleApplied; }
    public void setSaleApplied(Boolean saleApplied) { this.saleApplied = saleApplied; }

    public String getDiscountCodeUsed() { return discountCodeUsed; }
    public void setDiscountCodeUsed(String discountCodeUsed) { this.discountCodeUsed = discountCodeUsed; }

    public Double getDiscountPercentApplied() { return discountPercentApplied; }
    public void setDiscountPercentApplied(Double discountPercentApplied) { this.discountPercentApplied = discountPercentApplied; }
}
