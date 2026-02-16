package fs3.wingspan.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigInteger;
import java.util.HashSet;
import java.util.Set;


@Getter
@Setter
@Entity
@Table(name="images")
public class Image {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @ManyToMany
    @JoinTable(
            name = "image_tags",
            joinColumns = @JoinColumn(name = "image_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tags> tags = new HashSet<>();


    @ManyToOne()
    @JoinColumn(name="species_id")
    @JsonIgnore
    private Species species;

    @Column(name="filename")
    private String filename;

    @Column(name="fpath")
    private String fpath;

    @Column(name="fisize")
    private BigInteger fisize;

    @Column(name="width")
    private int width;

    @Column(name="height")
    private int height;

    @Column(name="lifecycle_stage")
    private String lifecycle_stage;

    @Column(name="description")
    private String description;

    @Column(name="nathans_notes")
    private String nathans_notes;

    public Image(){

    }

    public Image(int width, int height, String lifecycle_stage, String description, String nathans_notes) {
        this.width = width;
        this.height = height;
        this.lifecycle_stage = lifecycle_stage;
        this.description = description;
        this.nathans_notes = nathans_notes;
    }

}
