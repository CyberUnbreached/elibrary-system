package edu.utsa.teamcodex.elibrary.model;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "discount_codes")
public class DiscountCode {
     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private double discountPercent;
    private LocalDate expirationDate;
    private boolean active;

    // Constructors
    public DiscountCode() {}

    public DiscountCode(String code, double discountPercent, LocalDate expirationDate, boolean active) {
        this.code = code;
        this.discountPercent = discountPercent;
        this.expirationDate = expirationDate;
        this.active = active;
    }
    // Getters and Setters
    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(double discountPercent) { this.discountPercent = discountPercent; }

    public LocalDate getExpirationDate() { return expirationDate; }
    public void setExpirationDate(LocalDate expirationDate) { this.expirationDate = expirationDate; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}


