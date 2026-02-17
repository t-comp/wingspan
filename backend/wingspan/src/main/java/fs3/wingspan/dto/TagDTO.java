package fs3.wingspan.dto;

import fs3.wingspan.model.Tags;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TagDTO {
    private int tagId;
    private String tagName;
    private String tagCategory;

    public static TagDTO from(Tags tag){
        return TagDTO.builder()
                .tagId(tag.getId())
                .tagName(tag.getName())
                .tagCategory(tag.getCategory())
                .build();
    }
}
