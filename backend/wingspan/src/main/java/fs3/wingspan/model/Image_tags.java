package fs3.wingspan.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name="image_tags")
public class Image_tags {

    @Id
    @ManyToOne
    @JoinColumn(name="image_id")
    private Image image;

//    @OneToMany
//    @JoinColumn(name="tag_id")
//    private Tags tags;
}
