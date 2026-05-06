package fs3.wingspan.dto;

import lombok.Data;

/**
 * Request file for tags updates
 * @author Taylor Bauer
 */
@Data
public class UpdateTagRequest {

    private String name;

    private String category;
}
