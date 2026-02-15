package fs3.wingspan.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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

    public Tags() {

    }

    public Tags(String name, String category) {
        this.name = name;
        this.category = category;
    }
}
