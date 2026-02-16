package fs3.wingspan.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "tags")
public class Tags {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name="name")
    private String name;

    @Column(name="category")
    private String category;

    @ManyToMany(mappedBy = "tags")
    private Set<Image> images = new HashSet<>();

    public Tags() {

    }

    public Tags(String name, String category) {
        this.name = name;
        this.category = category;
    }
}
