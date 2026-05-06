package fs3.wingspan.model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * SQL DB Model file for teams
 * @author Taylor Bauer
 */
@Entity
@Getter
@Setter
@Table(name = "teams")
public class Teams {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "project_name")
    private String projectName;

    @Column(name = "semester")
    private String semester;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
