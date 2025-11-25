package edu.utsa.teamcodex.elibrary.repository;

import edu.utsa.teamcodex.elibrary.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrGenreContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String title, String author, String genre, String description);
}
