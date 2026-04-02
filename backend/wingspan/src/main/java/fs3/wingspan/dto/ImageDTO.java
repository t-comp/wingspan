package fs3.wingspan.dto;


import fs3.wingspan.model.Image;
import lombok.*;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@Builder
public class ImageDTO {

    private int id;
    private String filename;
    private String thumbnailUrl;
    private String smallUrl;
    private String fpath;
    private String largeUrl;
    private String originalUrl;
    private String description;
    private String nathansNotes;
    private Integer fileSize;
    private String fileSizeFormatted;
    private int width;
    private int height;
    private String dimensions;
    private String lifecyclestage;
    private Set<TagDTO> tags;
    private Map<String, String> attributes;

    public static ImageDTO fromImage(final Image image) {
        int w = image.getWidth();
        int h = image.getHeight();
        Long fsize = image.getFsize() != null ? image.getFsize().longValue() : null;

        return ImageDTO.builder()
                .id(image.getId())
                .filename(image.getFilename())
                .thumbnailUrl(image.getThumbnailUrl())
                .smallUrl(image.getSmallUrl())
                .fpath(image.getDisplayUrl())
                .largeUrl(image.getLargeUrl())
                .originalUrl(image.getOriginalUrl())
                .description(image.getDescription())
                .nathansNotes(image.getNathansnotes())
                .lifecyclestage(image.getLifecyclestage())
                .fileSize(fsize != null ? fsize.intValue() : null)
                .fileSizeFormatted(fsize != null ? formatBytes(fsize) : null)
                .width(w)
                .height(h)
                .dimensions(w > 0 && h > 0 ? w + "×" + h : null)
                .attributes(image.getAttributes())
                .tags(image.getTags() != null
                        ? image.getTags().stream().map(TagDTO::from).collect(Collectors.toSet()) : new HashSet<>())
                .build();
    }

    private static String formatBytes(long bytes) {
        if(bytes < 1024) return bytes + " B";
        if(bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024));
    }

}