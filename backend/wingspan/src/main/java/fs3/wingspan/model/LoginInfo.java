package fs3.wingspan.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginInfo {
    private String usernameOrEmail;
    private String password;
}
