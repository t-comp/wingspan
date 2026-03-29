package fs3.wingspan.dto;

import fs3.wingspan.model.Users;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UsersDTO {
    private int userId;
    private String username;
    private String email;
    private String userType;
    private Integer teamId;
    private String teamName;

    public static UsersDTO fromUser(Users u) {
        return UsersDTO.builder()
                .userId(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .userType(u.getUtype().toString())
                .teamId(u.getTeamId())
                .build();
    }
}
