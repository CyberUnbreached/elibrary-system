package edu.utsa.teamcodex.elibrary.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "users")  // 'user' is reserved by PostgreSQL
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @JsonIgnore  // Never return passwords in JSON
    private String password;

    private String email;
    private String role;

    @OneToMany(mappedBy = "borrowedBy", cascade = CascadeType.ALL)
    @JsonManagedReference("user-books")
    private List<Book> borrowedBooks;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonManagedReference("user-transactions")
    private List<Transaction> transactions;

    public User() {}

    public User(String username, String password, String email, String role) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
    }

    // Getters and setters
    public Long getId() { return id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public List<Book> getBorrowedBooks() { return borrowedBooks; }
    public List<Transaction> getTransactions() { return transactions; }
}
