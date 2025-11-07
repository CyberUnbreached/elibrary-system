package edu.utsa.teamcodex.elibrary.controller;
import edu.utsa.teamcodex.elibrary.model.DiscountCode;
import edu.utsa.teamcodex.elibrary.repository.DiscountRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/discounts")

public class DiscountController {
    private final DiscountRepository discountRepository;

    public DiscountController(DiscountRepository discountRepository) {
        this.discountRepository = discountRepository;
}
    // GET all discount codes
    @GetMapping
    public List<DiscountCode> getAllDiscounts() {
        return discountRepository.findAll();
    }

    // POST create a new discount code
    @PostMapping
    public DiscountCode createDiscount(@RequestBody DiscountCode discountCode) {
        return discountRepository.save(discountCode);
    }

    // PUT update or deactivate a discount code
    @PutMapping("/{id}")
    public DiscountCode updateDiscount(@PathVariable Long id, @RequestBody DiscountCode updatedCode) {
        DiscountCode code = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount code not found"));
        code.setCode(updatedCode.getCode());
        code.setDiscountPercent(updatedCode.getDiscountPercent());
        code.setExpirationDate(updatedCode.getExpirationDate());
        code.setActive(updatedCode.isActive());
        return discountRepository.save(code);
    }

    // DELETE a discount code
    @DeleteMapping("/{id}")
    public void deleteDiscount(@PathVariable Long id) {
        discountRepository.deleteById(id);
    }
}
