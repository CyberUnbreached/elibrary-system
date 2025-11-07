package edu.utsa.teamcodex.elibrary.repository;
import edu.utsa.teamcodex.elibrary.model.DiscountCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscountRepository extends JpaRepository<DiscountCode, Long> {
    DiscountCode findByCode(String code);

}
