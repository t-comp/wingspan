package fs3.wingspan.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;


@Getter
@Setter
public class RoboflowPrediction {
    private String predicted_classes;
    private List<Detection> predictions;


    @Getter
    @Setter
    public static class Detection {
        private String class_name;
        private double confidence;
        private double x;
        private double y;
        private double width;
        private double height;
    }
}
