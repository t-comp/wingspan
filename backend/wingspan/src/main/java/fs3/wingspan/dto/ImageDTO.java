package fs3.wingspan.dto;


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
    private String lifecyclestage;
    private List<TagDTO> tags;

    public static ImageDTO fromImage(final Image image) {
        return ImageDTO.builder()
                .id(image.getId())
                .filename(image.getFilename())
                .description(image.getDescription())
                .nathansNotes(image.getNathansnotes())
                .fileSize(image.getFsize() != null ? image.getFsize().intValue() : null)
                .build();
    }

}
