package fs3.wingspan.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * @author Taylor Bauer
 */
@Entity
@Getter
@Setter
@Table(name = "api_keys")
public class APIKeys {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "key_val")
    private String keyVal;

    @Column(name = "team_name")
    private String teamName;

    @Column(name = "project_name")
    private String projectName;

    @Column(name = "semester")
    private String semester;

    @Column(name = "expiration")
    private LocalDateTime expiration;

    @Column(name = "active")
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "team_id")
    private Integer teamId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
