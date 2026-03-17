package fs3.wingspan.dto;

import fs3.wingspan.model.Species;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SpeciesDTO {

    private int id;
    private String name;
    private String scientificName;
    private String description;
    private String orderName;
    private String family;
    private String genus;
    private String thumbnailUrl;

    public static SpeciesDTO fromSpecies(Species s, String url) {
        return SpeciesDTO.builder()
                .id(s.getId())
                .name(s.getName())
                .scientificName(s.getScientificName())
                .description(s.getDescription())
                .orderName(s.getOrderName())
                .family(s.getFamily())
                .genus(s.getGenus())
                .thumbnailUrl(url)
                .build();
    }
}