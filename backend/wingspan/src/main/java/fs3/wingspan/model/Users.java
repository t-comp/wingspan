package fs3.wingspan.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * SQL DB Model file for users
 * @author Taylor Bauer
 */
@Entity
@Getter
@Setter
@Table(name = "USERS")
public class Users implements UserDetails {
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

    @Column(name = "firstname")
    private String firstName;

    @Column(name = "lastname")
    private String lastName;

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

    // ********** UserDetails implementation **********

    /**
     * @return list of users with admin access
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(utype.toString()));
    }

    /**
     * @return true
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * @return true
     */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * @return true
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * @return true or false if enabled or not
     */
    @Override
    public boolean isEnabled() {
        return isActive != null && isActive;
    }
}