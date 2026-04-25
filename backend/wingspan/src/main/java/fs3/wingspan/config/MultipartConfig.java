package fs3.wingspan.config;

import jakarta.servlet.MultipartConfigElement;
import org.apache.catalina.connector.Connector;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.util.unit.DataSize;

@Configuration
public class MultipartConfig {

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxFileSize(DataSize.ofMegabytes(20));
        factory.setMaxRequestSize(DataSize.ofMegabytes(20));
        return factory.createMultipartConfig();
    }

    @Bean
    public TomcatServletWebServerFactory tomcatFactory(){
        return new  TomcatServletWebServerFactory() {
            @Override
            protected void customizeConnector(Connector connector){
                super.customizeConnector(connector);
                connector.setMaxPostSize(20 * 1024 * 1024); //20MB
            }
        };
    }
}
