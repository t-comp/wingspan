package fs3.wingspan.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "USERS")
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "username")
    private String username;

    @Column(name = "email")
    private String email;

    @Column(name = "password")
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "utype")
    private UType utype;

    @Column(name = "team_id")
    private Integer teamId;

    @Column(name = "setup_token")
    private String setupToken;

    @Column(name = "token_exp")
    private LocalDateTime tokenExp;

    @Column(name = "isActive")
    private Boolean isActive = false;
}
