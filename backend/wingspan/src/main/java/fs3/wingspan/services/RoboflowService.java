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
import java.util.Map;

@Service
@Slf4j
public class RoboflowService {

    @Value("${roboflow.api.key}")
    private static String apiKey;

    @Value("${roboflow.model.id}")
    private static String modelId;

    private static final RestTemplate restTemplate = new RestTemplate();

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
}
