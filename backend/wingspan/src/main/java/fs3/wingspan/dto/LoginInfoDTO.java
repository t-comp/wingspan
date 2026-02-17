package fs3.wingspan.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginInfoDTO {
    private String usernameOrEmail;
    private String password;
}
