FROM quay.io/phasetwo/phasetwo-keycloak:26.4.7 AS builder

# Set working directory
WORKDIR /opt/keycloak

# Create providers directory for plugins
USER root
RUN mkdir -p /opt/keycloak/providers

# Copy plugin JAR files if they exist locally (optional)
# Uncomment the line below and place your plugin JAR in the keycloak directory
# COPY --chown=keycloak:keycloak *.jar /opt/keycloak/providers/

USER keycloak

# Build Keycloak with any installed plugins
RUN /opt/keycloak/bin/kc.sh build

# Final stage
FROM quay.io/phasetwo/phasetwo-keycloak:26.4.7

# Copy built providers from builder stage
COPY --from=builder /opt/keycloak/providers /opt/keycloak/providers

# Copy the built Keycloak from builder stage
COPY --from=builder /opt/keycloak/lib/quarkus /opt/keycloak/lib/quarkus

WORKDIR /opt/keycloak

# Set entrypoint
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]

