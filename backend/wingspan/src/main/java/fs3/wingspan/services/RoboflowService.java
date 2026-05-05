package fs3.wingspan.services;

import fs3.wingspan.dto.RoboflowPrediction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import org.springframework.http.HttpHeaders;
import java.util.Base64;
import java.util.Comparator;
import java.util.Map;

/**
 * @author Abby Van Der Brink
 */
@Service
@Slf4j
public class RoboflowService {

    @Value("${roboflow.api.key}")
    private static String apiKey;

    @Value("${roboflow.model.id}")
    private static String modelId;

    private static final RestTemplate restTemplate = new RestTemplate();

    /**
     * classify an image by lifecycle stage through a roboflow AI model
     * @param file
     * @return
     * @throws IOException
     */
    public static RoboflowPrediction classifyImage(MultipartFile file) throws IOException{
        String url = "https://classify.roboflow.com/" + modelId + "?api_key=" + apiKey;

        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of("image", base64Image);
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<RoboflowPrediction> response = restTemplate.postForEntity(url, request, RoboflowPrediction.class);

        log.info("Roboflow prediction: {}", response.getBody());
        return response.getBody();
    }

    /**
     * returns the lifecycle stage that is predicted
     * @param file
     * @return
     * @throws IOException
     */
    public static String getLifecycleStage(MultipartFile file) throws IOException {
        RoboflowPrediction prediction = classifyImage(file);

        if (prediction != null || prediction.getPredictions() == null || prediction.getPredictions().isEmpty()) {
            log.warn("No predictions found for image {}", file.getOriginalFilename());
            return null;
        }
        return prediction.getPredictions().stream()
                .max(Comparator.comparingDouble(RoboflowPrediction.Detection::getConfidence))
                .map(RoboflowPrediction.Detection::getClass_name)
                .orElse(null);
    }
}
