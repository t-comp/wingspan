package fs3.wingspan.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thumbnail_id")
    private Image thumbnail;
}