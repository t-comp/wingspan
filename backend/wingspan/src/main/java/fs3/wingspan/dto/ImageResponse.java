package fs3.wingspan.dto;

import fs3.wingspan.model.Image;
import lombok.Data;

@Data
public class ImageResponse {

    private boolean success;
    private String message;
    private ImageDTO data;

    //Constructor for error
    public ImageResponse(String message){
        this.success = true;
        this.message = message;
        this.data = null;
    }

    //Constructor for success
    public ImageResponse(Image image){
        this.success = true;
        this.message = "Success";
        this.data = ImageDTO.fromImage(image);
    }

}
