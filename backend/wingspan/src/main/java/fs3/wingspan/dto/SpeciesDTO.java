package fs3.wingspan.dto;

import fs3.wingspan.model.Species;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

/**
 * DTO layer for species
 * @author Taylor Bauer
 */
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
    private Map<String, String> attributeDef;

    /**
     * builds Species with all its given attributes
     * @param s
     * @param url
     * @return all species info
     */
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
                .attributeDef(s.getAttributeDefs())
                .build();
    }
}