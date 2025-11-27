package edu.utsa.teamcodex.elibrary.controller;
import edu.utsa.teamcodex.elibrary.model.Cart;
import edu.utsa.teamcodex.elibrary.model.CartItem;
import edu.utsa.teamcodex.elibrary.model.Purchase;
import edu.utsa.teamcodex.elibrary.model.Book;
import edu.utsa.teamcodex.elibrary.model.User;
import edu.utsa.teamcodex.elibrary.model.DiscountCode;
import edu.utsa.teamcodex.elibrary.repository.CartItemRepository;
import edu.utsa.teamcodex.elibrary.repository.CartRepository;
import edu.utsa.teamcodex.elibrary.repository.BookRepository;
import edu.utsa.teamcodex.elibrary.repository.UserRepository;
import edu.utsa.teamcodex.elibrary.repository.PurchaseRepository;
import edu.utsa.teamcodex.elibrary.repository.DiscountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/cart")
public class CartController {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final PurchaseRepository purchaseRepository;
    private final DiscountRepository discountRepository;

    public CartController(CartRepository cartRepository, CartItemRepository cartItemRepository,
                          BookRepository bookRepository, UserRepository userRepository,
                          PurchaseRepository purchaseRepository, DiscountRepository discountRepository ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.purchaseRepository = purchaseRepository;
        this.discountRepository = discountRepository;
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

        // Refresh item prices to reflect current sale/base prices
        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                Book freshBook = bookRepository.findById(item.getBook().getId())
                        .orElse(item.getBook());
                double effectivePrice = resolveEffectivePrice(freshBook);
                if (item.getPrice() != effectivePrice) {
                    item.setPrice(effectivePrice);
                    cartItemRepository.save(item);
                }
            }
        }
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

        CartItem item = new CartItem(cart, book, quantity, resolveEffectivePrice(book));
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
    @Transactional
    public ResponseEntity<String> checkoutCart(@PathVariable Long userId,
                                               @RequestParam(required = false) String discountCode) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user"));

        List<CartItem> items = cart.getItems();
        if (items.isEmpty()) {
            return ResponseEntity.badRequest().body("Cart is empty");
        }

        // Verify availability for each item using latest book quantities
        StringBuilder insufficient = new StringBuilder();
        for (CartItem item : items) {
            // Reload the latest book state to avoid stale quantities
            Book freshBook = bookRepository.findById(item.getBook().getId())
                    .orElseThrow(() -> new RuntimeException("Book not found"));
            int availableQty = freshBook.getQuantity();
            int requestedQty = item.getQuantity();
            if (requestedQty > availableQty) {
                if (insufficient.length() > 0) insufficient.append(", ");
                insufficient.append(freshBook.getTitle())
                        .append(" (requested ")
                        .append(requestedQty)
                        .append(", available ")
                        .append(availableQty)
                        .append(")");
            }
        }

        if (insufficient.length() > 0) {
            return ResponseEntity.badRequest().body("Insufficient stock for: " + insufficient);
        }

        // All items available: decrement inventory now
        for (CartItem item : items) {
            Book freshBook = bookRepository.findById(item.getBook().getId())
                    .orElseThrow(() -> new RuntimeException("Book not found"));
            int newQty = freshBook.getQuantity() - item.getQuantity();
            freshBook.setQuantity(newQty);
            // Update available flag if quantity hits zero
            if (newQty <= 0) {
                freshBook.setAvailable(false);
            }
            bookRepository.save(freshBook);
        }

        for (CartItem item : items) {
            Book freshBook = bookRepository.findById(item.getBook().getId())
                    .orElseThrow(() -> new RuntimeException("Book not found"));
            double effectivePrice = resolveEffectivePrice(freshBook);
            item.setPrice(effectivePrice); // keep cart price in sync with current sale/base price
            cartItemRepository.save(item);
        }

        // Apply discount if code exists
        double discountPercent = 0.0;
        String appliedDiscountCode = null;
        if (discountCode != null && !discountCode.trim().isEmpty()) {
            DiscountCode discount = discountRepository.findByCodeIgnoreCase(discountCode.trim());
            if (discount == null || !discount.isActive()) {
                return ResponseEntity.badRequest().body("Invalid or inactive discount code");
            }
            if (discount.getExpirationDate() != null &&
                    discount.getExpirationDate().isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest().body("This discount code has expired");
            }
            // Clamp to 0-100 to avoid over-discounting
            discountPercent = Math.max(0.0, Math.min(100.0, discount.getDiscountPercent()));
            appliedDiscountCode = discount.getCode();
        }
        // Create Purchase objects for each item (capturing quantity, sale/discount context)
        double discountedTotalForTax = 0.0;
        for (CartItem item : items) {
            Book freshBook = bookRepository.findById(item.getBook().getId())
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            double basePrice = freshBook.getPrice();
            double effectivePrice = resolveEffectivePrice(freshBook);
            boolean saleApplied = effectivePrice + 1e-9 < basePrice;

            double lineBeforeDiscount = effectivePrice * item.getQuantity();
            double lineAfterDiscount = lineBeforeDiscount * (1 - discountPercent / 100.0);
            discountedTotalForTax += lineAfterDiscount;

            Purchase purchase = new Purchase(
                    cart.getUser(),
                    freshBook,
                    lineAfterDiscount,
                    LocalDate.now(),
                    item.getQuantity(),
                    basePrice,
                    saleApplied,
                    appliedDiscountCode,
                    discountPercent > 0 ? discountPercent : null
            );
            purchaseRepository.save(purchase);
        }

        // Apply tax
        double totalWithTax = discountedTotalForTax * 1.0825; // 8.25% tax

        // Clear cart
        cartItemRepository.deleteAll(items);

        return ResponseEntity.ok("Checkout complete. Total: $" + String.format("%.2f", totalWithTax));
    }

    private double resolveEffectivePrice(Book book) {
        double base = book.getPrice();
        Double salePrice = book.getSalePrice();
        if (salePrice == null) return base;
        if (book.getOnSale() != null && !book.getOnSale()) return base;
        LocalDateTime now = LocalDateTime.now();
        if (book.getSaleStart() != null && book.getSaleStart().isAfter(now)) return base;
        if (book.getSaleEnd() != null && book.getSaleEnd().isBefore(now)) return base;
        return Math.min(base, salePrice);
    }
}


