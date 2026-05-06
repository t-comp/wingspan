package fs3.wingspan.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * SQL DB Model file for species
 * @author Taylor Bauer
 */
@Entity
@Getter
@Setter
@Table(name = "species")
public class Species {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "name")
    private String name;

    @Column(name = "scientific_name")
    private String scientificName;

    @Column(name = "description")
    private String description;

    @Column(name = "order_name")
    private String orderName;

    @Column(name = "family")
    private String family;

    @Column(name = "genus")
    private String genus;

    // thumbnail image
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thumbnail_id")
    private Image thumbnail;


    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, String> attributeDefs;

    @OneToMany(mappedBy = "species", cascade = CascadeType.REMOVE, orphanRemoval = true)
    @JsonIgnore
    private Set<Image> images = new HashSet<>();

}