package fs3.wingspan.controller;

import fs3.wingspan.dto.MessageResponse;
import fs3.wingspan.dto.SpeciesDTO;
import fs3.wingspan.model.Image;
import fs3.wingspan.model.Species;
import fs3.wingspan.repository.ImageRepository;
import fs3.wingspan.repository.SpeciesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/species")
public class SpeciesController {

    @Autowired
    private SpeciesRepository speciesRepository;

    @Autowired
    private ImageRepository imageRepository;

    /**
     * create new species
     * POST /species/create
     */
    @PostMapping("/create")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> createSpecies(@RequestBody Species s) {

        if (s.getName() == null || s.getName().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Please enter a name for the species."));
        }

        if (speciesRepository.existsByName(s.getName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse(s.getName() + " already exists."));
        }

        Species saved = speciesRepository.save(s);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(SpeciesDTO.fromSpecies(saved, thumbnailFallback(saved)));
    }

    /**
     * get all species
     * GET /species/all
     */
    @GetMapping("/all")
    public ResponseEntity<List<SpeciesDTO>> getAllSpecies() {
        List<SpeciesDTO> dtos = speciesRepository.findAll().stream()
                .map(s -> SpeciesDTO.fromSpecies(s, thumbnailFallback(s)))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * get species by ID
     * GET /species/{speciesId}
     */
    @GetMapping("/{speciesId}")
    public ResponseEntity<?> getSpeciesById(@PathVariable int speciesId) {
        Species s = speciesRepository.findById(speciesId).orElse(null);
        if (s == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Species not found"));
        }
        return ResponseEntity.ok(SpeciesDTO.fromSpecies(s, thumbnailFallback(s)));
    }

    /**
     * get species by name
     * GET /species/name/{name}
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<?> getSpeciesByName(@PathVariable String name) {
        Species species = speciesRepository.findByName(name);
        if (species == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Species not found"));
        }
        return ResponseEntity.ok(SpeciesDTO.fromSpecies(species, thumbnailFallback(species)));
    }

    /**
     * filter species by taxonomy (all params optional)
     * GET /species/filter?orderName=Lepidoptera&family=Nymphalidae&genus=Danaus
     */
    @GetMapping("/filter")
    public ResponseEntity<List<SpeciesDTO>> filterSpecies(@RequestParam(required = false) String orderName, @RequestParam(required = false) String family, @RequestParam(required = false) String genus) {
        List<SpeciesDTO> dtos = speciesRepository.filterByTaxonomy(orderName, family, genus).stream()
                .map(s -> SpeciesDTO.fromSpecies(s, thumbnailFallback(s)))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * get all distinct values for filter dropdowns
     * populated from whatever is actually in the database
     * GET /species/filter-options
     */
    @GetMapping("/filter-options")
    public ResponseEntity<?> getFilterOptions() {
        Map<String, Object> options = new HashMap<>();
        options.put("orders", speciesRepository.findAllOrders());
        options.put("families", speciesRepository.findAllFamilies());
        options.put("genera", speciesRepository.findAllGenesus());
        return ResponseEntity.ok(options);
    }

    /**
     * set thumbnail image for species card
     * PUT /species/{speciesId}/set-thumbnail?imageId=5
     */
    @PutMapping("/{speciesId}/set-thumbnail")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> setThumbnail(@PathVariable int speciesId, @RequestParam int imageId) {
        Species s = speciesRepository.findById(speciesId).orElse(null);
        if (s == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Species not found"));
        }

        Image image = imageRepository.findById(imageId).orElse(null);
        if (image == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Image not found"));
        }

        s.setThumbnail(image);
        speciesRepository.save(s);

        return ResponseEntity.ok(new MessageResponse("Thumbnail set for " + s.getName() + "!"));
    }

    /**
     * remove thumbnail from species (falls back to first image or null)
     * PUT /species/{speciesId}/remove-thumbnail
     */
    @PutMapping("/{speciesId}/remove-thumbnail")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> removeThumbnail(@PathVariable int speciesId) {
        Species s = speciesRepository.findById(speciesId).orElse(null);
        if (s == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Species not found"));
        }

        s.setThumbnail(null);
        speciesRepository.save(s);

        return ResponseEntity.ok(new MessageResponse("Thumbnail removed from " + s.getName() + "!"));
    }

    /**
     * update species info
     * PUT /species/{speciesId}/update
     */
    @PutMapping("/{speciesId}/update")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateSpecies(@PathVariable int speciesId, @RequestBody Species updatedSpecies) {
        Species s = speciesRepository.findById(speciesId).orElse(null);
        if (s == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Species not found"));
        }

        if (updatedSpecies.getName() != null && !updatedSpecies.getName().isEmpty()) {
            s.setName(updatedSpecies.getName());
        }
        if (updatedSpecies.getScientificName() != null) {
            s.setScientificName(updatedSpecies.getScientificName());
        }
        if (updatedSpecies.getDescription() != null) {
            s.setDescription(updatedSpecies.getDescription());
        }
        if (updatedSpecies.getOrderName() != null) {
            s.setOrderName(updatedSpecies.getOrderName());
        }
        if (updatedSpecies.getFamily() != null) {
            s.setFamily(updatedSpecies.getFamily());
        }
        if (updatedSpecies.getGenus() != null) {
            s.setGenus(updatedSpecies.getGenus());
        }

        speciesRepository.save(s);
        return ResponseEntity.ok(new MessageResponse(s.getName() + " has been updated!"));
    }

    /**
     * delete species by ID
     * DELETE /species/{speciesId}
     */
    @DeleteMapping("/{speciesId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<MessageResponse> deleteSpecies(@PathVariable int speciesId) {
        Species s = speciesRepository.findById(speciesId).orElse(null);
        if (s == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Species not found"));
        }
        s.setThumbnail(null);
        speciesRepository.save(s);
        List<Image> images = imageRepository.findBySpeciesId(speciesId);
        imageRepository.deleteAll(images);
        String name = s.getName();
        speciesRepository.delete(s);

        return ResponseEntity.ok(new MessageResponse(name + " has been deleted."));
    }



    /** helper - thumbnail url with fallback
     * if thumbnail set -> use it
     * if no thumbnail but has images -> use first image
     * if no images at all -> null (fe handle placeholder)
     */
    private String thumbnailFallback(Species s) {
        if (s.getThumbnail() != null) {
            return s.getThumbnail().getFpath();
        }

        List<Image> images = imageRepository.findBySpeciesId(s.getId());
        if (!images.isEmpty()) {
            return images.get(0).getFpath();
        }

        return null;
    }

    /**
     * set attribute definitions for a species (what custom fields this species has)
     * PUT /species/{speciesId}/attributes
     * body: { "Wing Pattern": "text", "Wingspan (inches)": "number" }
     */
    @PutMapping("/{speciesId}/attributes")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> setAttributeDefinitions(@PathVariable int speciesId, @RequestBody Map<String, String> defs) {
        Species s = speciesRepository.findById(speciesId).orElse(null);
        if (s == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Species not found"));
        }
        s.setAttributeDefs(defs);
        speciesRepository.save(s);
        return ResponseEntity.ok(new MessageResponse("Attribute definitions updated for " + s.getName()));
    }

    /**
     * get attribute definitions for a species
     * GET /species/{speciesId}/attributes
     */
    @GetMapping("/{speciesId}/attributes")
    public ResponseEntity<?> getAttributeDefinitions(@PathVariable int speciesId) {
        Species s = speciesRepository.findById(speciesId).orElse(null);
        if (s == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Species not found"));
        }
        return ResponseEntity.ok(s.getAttributeDefs());
    }
}