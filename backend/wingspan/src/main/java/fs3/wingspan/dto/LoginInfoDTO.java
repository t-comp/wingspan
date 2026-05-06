package fs3.wingspan.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * DTO layer for login info
 * @author Taylor Bauer
 */
@Getter
@Setter
public class LoginInfoDTO {
    private String usernameOrEmail;
    private String password;
}
