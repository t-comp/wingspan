package fs3.wingspan.dto;


import fs3.wingspan.model.Image;
import lombok.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@Builder
public class ImageDTO {

    private int id;
    private String filename;
    private String fpath;
    private String description;
    private String nathansNotes;
    private Integer fileSize;
    private int width;
    private int height;
    private String lifecyclestage;
    private Set<TagDTO> tags;

    public static ImageDTO fromImage(final Image image) {
        return ImageDTO.builder()
                .id(image.getId())
                .filename(image.getFilename())
                .fpath(image.getFpath())
                .description(image.getDescription())
                .nathansNotes(image.getNathansnotes())
                .lifecyclestage(image.getLifecyclestage())
                .fileSize(image.getFsize() != null ? image.getFsize().intValue() : null)
                .tags(image.getTags() != null
                    ? image.getTags().stream().map(TagDTO::from).collect(Collectors.toSet()) : new HashSet<>())
                .build();
    }

}
