FROM quay.io/keycloak/keycloak:25.0.6

COPY realm-export.json /opt/keycloak/data/import/realm.json

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]