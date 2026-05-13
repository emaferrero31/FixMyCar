package com.tallermecanico.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupInfo implements ApplicationRunner {

    @Value("${server.port:8080}")
    private int port;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Override
    public void run(ApplicationArguments args) {
        String base = "http://localhost:" + port + (contextPath != null ? contextPath : "");
        System.out.println("----------------------------------------");
        System.out.println("  Backend FixMyCar en marcha");
        System.out.println("  Puerto: " + port);
        System.out.println("  API:    " + base);
        System.out.println("  Health: " + base + "/health");
        System.out.println("----------------------------------------");
    }
}
