package fs3.wingspan.dto;


/**
 * @author Abby Van Der Brink
 */
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
    private String xSmallUrl;
    private String smallUrl;
    private String mediumUrl;
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
    private Boolean isFeatured;
    private Set<TagDTO> tags;
    private Map<String, String> attributes;

    /**
     * @param image
     * @return all info of an image
     */
    public static ImageDTO fromImage(final Image image) {
        int w = image.getWidth();
        int h = image.getHeight();

        Long fsize = null;
        if(image.getFsize() != null){
            fsize = image.getFsize().longValue();
        }

        String fileSizeFormatted = null;
        Integer fileSizeRaw = null;
        if(fsize != null){
            fileSizeFormatted = formatBytes(fsize);
            fileSizeRaw = fsize.intValue();
        }

        String dimensions = null;
        if(w > 0 && h > 0){
            dimensions = w + "×" + h;
        }

        return ImageDTO.builder()
                .id(image.getId())
                .filename(image.getFilename())
                .xSmallUrl(image.getXSmallUrl())
                .smallUrl(image.getSmallUrl())
                .mediumUrl(image.getMediumUrl())
                .largeUrl(image.getLargeUrl())
                .originalUrl(image.getOriginalUrl())
                .description(image.getDescription())
                .nathansNotes(image.getNathansnotes())
                .lifecyclestage(image.getLifecyclestage())
                .fileSize(fileSizeRaw)
                .fileSizeFormatted(fileSizeFormatted)
                .width(w)
                .height(h)
                .dimensions(dimensions)
                .isFeatured(image.getIsFeatured())
                .attributes(image.getAttributes())
                .tags(image.getTags() != null
                        ? image.getTags().stream().map(TagDTO::from).collect(Collectors.toSet()) : new HashSet<>())
                .build();
    }

    /**
     * @param bytes
     * @return string of # of bytes
     */
    private static String formatBytes(long bytes) {
        if(bytes < 1024) return bytes + " B";
        if(bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024));
    }

}