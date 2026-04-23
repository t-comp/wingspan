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
    private String firstName;
    private String lastName;

    public static UsersDTO fromUser(Users u) {
        return UsersDTO.builder()
                .userId(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .userType(u.getUtype().toString())
                .teamId(u.getTeamId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .build();
    }

    /**
     * when team context is available
     */
    public static UsersDTO fromUser(Users u, String teamName) {
        return UsersDTO.builder()
                .userId(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .userType(u.getUtype().toString())
                .teamId(u.getTeamId())
                .teamName(teamName)
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .build();
    }
}
