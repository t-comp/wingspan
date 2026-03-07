package fs3.wingspan.controller;
import fs3.wingspan.model.Species;
import fs3.wingspan.model.SpeciesType;
import fs3.wingspan.repository.SpeciesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/species")
public class SpeciesController {

    @Autowired
    private SpeciesRepository speciesRepository;

    /**
     * create new species
     * POST /species/create
     */
    @PostMapping("/create")
    public String createSpecies(@RequestBody Species s) {

        if (s.getName() == null || s.getName().isEmpty()) {
            return "Please enter a name for the species.";
        }

        if (speciesRepository.existsByName(s.getName())) {
            return s.getName() + " already exists.";
        }

        speciesRepository.save(s);
        return s.getName() + " has been created successfully!";
    }

    /**
     * get all species
     * GET /species/all
     */
    @GetMapping("/all")
    public List<Species> getAllSpecies() {
        return speciesRepository.findAll();
    }

    /**
     * get species by ID
     * GET /species/{speciesId}
     */
    @GetMapping("/{speciesId}")
    public Species getSpeciesById(@PathVariable int speciesId) {
        return speciesRepository.findById(speciesId).orElse(null);
    }

    /**
     * get species by name
     * GET /species/name/{name}
     */
    @GetMapping("/name/{name}")
    public Species getSpeciesByName(@PathVariable String name) {
        return speciesRepository.findByName(name);
    }

    /**
     * get all butterflies
     * GET /species/butterflies
     */
    @GetMapping("/butterflies")
    public List<Species> getAllButterflies() {
        return speciesRepository.findByType(SpeciesType.BUTTERFLY);
    }

    /**
     * get all insects
     * GET /species/insects
     */
    @GetMapping("/insects")
    public List<Species> getAllInsects() {
        return speciesRepository.findByType(SpeciesType.INSECT);
    }

    /**
     * update species info
     * PUT /species/{speciesId}/update
     */
    @PutMapping("/{speciesId}/update")
    public String updateSpecies(@PathVariable int speciesId, @RequestBody Species updatedSpecies) {
        Species s = speciesRepository.findById(speciesId).orElse(null);
        if (s == null) {
            return "Species was not found.";
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
        if (updatedSpecies.getType() != null) {
            s.setType(updatedSpecies.getType());
        }

        speciesRepository.save(s);
        return s.getName() + " has been updated!";
    }

    /**
     * delete species by ID
     * DELETE /species/{speciesId}
     */
    @DeleteMapping("/{speciesId}")
    public String deleteSpecies(@PathVariable int speciesId) {
        Species s = speciesRepository.findById(speciesId).orElse(null);
        if (s == null) {
            return "Species was not found.";
        }
        String name = s.getName();
        speciesRepository.delete(s);
        return name + "has been deleted.";
    }
}
