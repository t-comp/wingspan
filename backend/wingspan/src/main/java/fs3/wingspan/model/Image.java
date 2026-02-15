package fs3.wingspan.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@Entity
@Table(name="images")
public class Image {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @ManyToOne()
    @JoinColumn(name="species_id")
    @JsonIgnore
    private Species species;

    @Column(name="filename")
    private String filename;

    @Column(name="fpath")
    private String fpath;

    @Column(name="fisize")
    private int fisize;

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

    public Image(String filename, String fpath, int fisize, int width, int height, String lifecycle_stage, String description, String nathans_notes) {
        this.filename = filename;
        this.fpath = fpath;
        this.fisize = fisize;
        this.width = width;
        this.height = height;
        this.lifecycle_stage = lifecycle_stage;
        this.description = description;
        this.nathans_notes = nathans_notes;
    }

}
