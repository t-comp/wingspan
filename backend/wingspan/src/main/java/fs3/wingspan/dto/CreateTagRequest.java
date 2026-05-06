package fs3.wingspan.dto;

import lombok.Data;

/**
 * Request file for tags
 * @author Taylor Bauer
 */
@Data
public class CreateTagRequest {
    private String name;

    private String category;

}

