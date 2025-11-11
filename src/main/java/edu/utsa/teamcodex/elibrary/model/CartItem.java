package edu.utsa.teamcodex.elibrary.model;
import jakarta.persistence.*;

@Entity
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cart_id")
    private Cart cart;

    @ManyToOne
    @JoinColumn(name = "book_id")
    private Book book;

    private int quantity;
    private double price; // price for item 

    // Constructors
    public CartItem() {}

    public CartItem(Cart cart, Book book, int quantity, double price) {
        this.cart = cart;
        this.book = book;
        this.quantity = quantity;
        this.price = price;
    }

    // Getters and setters
    public Long getId() { return id; }
    public Cart getCart() { return cart; }
    public void setCart(Cart cart) { this.cart = cart; }
    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
}


    
