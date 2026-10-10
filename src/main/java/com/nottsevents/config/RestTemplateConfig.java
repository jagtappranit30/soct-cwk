package com.nottsevents.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplateConfig — provides a shared RestTemplate bean with
 * connect and read timeouts so external API calls don't hang forever.
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // 5 second connect timeout
        factory.setConnectTimeout(5000);
        // 5 second read timeout
        factory.setReadTimeout(5000);
        return new RestTemplate(factory);
    }
}
