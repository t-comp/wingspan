package fs3.wingspan.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;


import java.math.BigInteger;
import java.util.HashSet;
import java.util.Map;
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

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "image_tags",
            joinColumns = @JoinColumn(name = "image_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tags> tags = new HashSet<>();


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="species_id", nullable = false)
    @JsonIgnore
    private Species species;

    @Column(name="filename", nullable=false)
    private String filename;

    // large (1920px)
    @Column(name="fpath", nullable=false)
    private String fpath;

    // thumbnail (300px)
    @Column(name="thumbnail_url")
    private String thumbnailUrl;

    // medium (1024px)
    @Column(name="medium_url")
    private String mediumUrl;

    // original version URL
    @Column(name="original_url")
    private String originalUrl;

    @Column(name="fsize")
    private BigInteger fsize;

    @Column(name="width")
    private int width;

    @Column(name="height")
    private int height;

    @Column(name="lifecyclestage")
    private String lifecyclestage;

    @Column(name="description")
    private String description;

    @Column(name="nathansnotes", columnDefinition = "TEXT")
    private String nathansnotes;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, String> attributes;

    public Image(){

    }

    public Image(Species species, String lifecycle_stage, String description, String nathans_notes) {
        this.species = species;
        this.lifecyclestage = lifecycle_stage;
        this.description = description;
        this.nathansnotes = nathans_notes;
    }

    public void removeTag(Tags tag) {
        this.tags.remove(tag);
        tag.getImages().remove(this);
    }

    public void addTag(Tags tag) {
        this.tags.add(tag);
        tag.getImages().add(this);
    }

//    public void clearTags() {
//        for (Tags tag : new HashSet<>(this.tags)) {
//            removeTag(tag);
//        }
//    }

}
