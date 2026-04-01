package fs3.wingspan.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;


@Getter
@Setter
public class RoboflowPrediction {
    private String predicted_classes;
    private List<PredictionClass> predictions;

    @Getter
    @Setter
    public static class PredictionClass{
        private String class_name;
        private double confidence;
    }
}
