package fs3.wingspan.dto;

import fs3.wingspan.model.Tags;
import lombok.Builder;
import lombok.Data;

/**
 * DTO layer for tags
 * @author Abby Van Der Brink
 */
@Data
@Builder
public class TagDTO {
    private int tagId;
    private String tagName;
    private String tagCategory;

    /**
     * builds tags with given attributes
     * @param tag
     * @return all tag info
     */
    public static TagDTO from(Tags tag){
        return TagDTO.builder()
                .tagId(tag.getId())
                .tagName(tag.getName())
                .tagCategory(tag.getCategory())
                .build();
    }
}
