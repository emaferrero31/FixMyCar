package com.tallermecanico.config;

import org.apache.catalina.connector.Connector;
import org.apache.coyote.ProtocolHandler;
import org.apache.coyote.http11.AbstractHttp11Protocol;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.stereotype.Component;

/**
 * Tomcat limita por defecto el tamaño del POST (~2 MB). Los vehículos envían la foto como
 * data URL en JSON; sin esto el cuerpo se rechaza o trunca y la foto no persiste.
 */
@Component
public class TomcatConnectorConfig implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {

    private static final int MAX_BYTES = 40 * 1024 * 1024;

    @Override
    public void customize(TomcatServletWebServerFactory factory) {
        factory.addConnectorCustomizers(TomcatConnectorConfig::configureConnector);
    }

    private static void configureConnector(Connector connector) {
        connector.setMaxPostSize(MAX_BYTES);
        ProtocolHandler handler = connector.getProtocolHandler();
        if (handler instanceof AbstractHttp11Protocol<?> http11) {
            http11.setMaxSwallowSize(MAX_BYTES);
        }
    }
}
