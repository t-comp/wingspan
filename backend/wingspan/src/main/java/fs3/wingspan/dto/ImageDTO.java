package fs3.wingspan.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import fs3.wingspan.model.Image;
import lombok.*;

import java.util.List;

@Data
@Builder
public class ImageDTO {

    private int id;
    private String filename;
    private String description;
    private String nathansNotes;
    private Integer fileSize;
    private int width;
    private int height;
    private String lifecycle_stage;
    private List<TagDTO> tags;

    public static ImageDTO fromImage(final Image image) {
        return ImageDTO.builder()
                .id(image.getId())
                .filename(image.getFilename())
                .description(image.getDescription())
                .nathansNotes(image.getNathans_notes())
                .fileSize(image.getFisize() != null ? image.getFisize().intValue() : null)
                .build();
    }

}
