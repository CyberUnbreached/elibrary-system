package edu.utsa.teamcodex.elibrary.controller;
import edu.utsa.teamcodex.elibrary.model.Cart;
import edu.utsa.teamcodex.elibrary.model.CartItem;
import edu.utsa.teamcodex.elibrary.model.Purchase;
import edu.utsa.teamcodex.elibrary.model.Book;
import edu.utsa.teamcodex.elibrary.model.User;
import edu.utsa.teamcodex.elibrary.repository.CartItemRepository;
import edu.utsa.teamcodex.elibrary.repository.CartRepository;
import edu.utsa.teamcodex.elibrary.repository.BookRepository;
import edu.utsa.teamcodex.elibrary.repository.UserRepository;
import edu.utsa.teamcodex.elibrary.repository.PurchaseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/cart")
public class CartController {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final PurchaseRepository purchaseRepository;

    public CartController(CartRepository cartRepository, CartItemRepository cartItemRepository,
                          BookRepository bookRepository, UserRepository userRepository, PurchaseRepository purchaseRepository ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.purchaseRepository = purchaseRepository;
    }

    // View cart for a user
    @GetMapping("/{userId}")
    public ResponseEntity<Cart> getCart(@PathVariable Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    Cart newCart = new Cart(user);
                    return cartRepository.save(newCart);
                });
        return ResponseEntity.ok(cart);
    }

    // Add item to cart
    @PostMapping("/{userId}/add/{bookId}")
    public ResponseEntity<CartItem> addItemToCart(@PathVariable Long userId,
                                                  @PathVariable Long bookId,
                                                  @RequestParam(defaultValue = "1") int quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(new Cart(user)));

        CartItem item = new CartItem(cart, book, quantity, book.getPrice());
        return ResponseEntity.ok(cartItemRepository.save(item));
    }

    // Remove item from cart
    @DeleteMapping("/{userId}/remove/{cartItemId}")
    public ResponseEntity<String> removeItemFromCart(@PathVariable Long userId, @PathVariable Long cartItemId) {
        cartItemRepository.deleteById(cartItemId);
        return ResponseEntity.ok("Item removed from cart");
    }
     // Checkout cart
    @PostMapping("/{userId}/checkout")
    public ResponseEntity<String> checkoutCart(@PathVariable Long userId,
                                               @RequestParam(required = false) String discountCode) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user"));

        List<CartItem> items = cart.getItems();
        if (items.isEmpty()) {
            return ResponseEntity.badRequest().body("Cart is empty");
        }

        double subtotal = items.stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();

        // Apply discount if code exists
        double discountPercent = 0.0;
        if (discountCode != null) {
            // replace 
            discountPercent = 10.0; // example 10% off
        }
        double discountedTotal = subtotal * (1 - discountPercent / 100.0);

        // Apply tax
        double totalWithTax = discountedTotal * 1.0825; // 8.25% tax

        // Create Purchase objects for each item
        for (CartItem item : items) {
            Purchase purchase = new Purchase(cart.getUser(), item.getBook(),
                    item.getPrice() * item.getQuantity(),
                    java.time.LocalDate.now());
            purchaseRepository.save(purchase);
        }

        // Clear cart
        cartItemRepository.deleteAll(items);

        return ResponseEntity.ok("Checkout complete. Total: $" + String.format("%.2f", totalWithTax));
    }
}


