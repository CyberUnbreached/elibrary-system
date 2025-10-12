package edu.utsa.teamcodex.elibrary.repository;

import edu.utsa.teamcodex.elibrary.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {
    // You can add custom queries here later
}
