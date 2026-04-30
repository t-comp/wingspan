package fs3.wingspan.dto;

import fs3.wingspan.model.Species;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class SpeciesWithImagesDTO {

    private int id;
    private String name;
    private String scientificName;
    private String description;
    private String orderName;
    private String family;
    private String genus;
    private String thumbnailUrl;
    private Map<String, String> attributeDef;
    private List<ImageDTO> images;

    public static SpeciesWithImagesDTO fromSpecies(Species s, String thumbnailUrl, List<ImageDTO> images) {
        return SpeciesWithImagesDTO.builder()
                .id(s.getId())
                .name(s.getName())
                .scientificName(s.getScientificName())
                .description(s.getDescription())
                .orderName(s.getOrderName())
                .family(s.getFamily())
                .genus(s.getGenus())
                .thumbnailUrl(thumbnailUrl)
                .attributeDef(s.getAttributeDefs())
                .images(images)
                .build();
    }
}