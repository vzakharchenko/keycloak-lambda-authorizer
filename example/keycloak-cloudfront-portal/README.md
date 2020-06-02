# Cloudfront(Lambda:edge) with portal authorization

## 1. Start Keycloak

### Docker
Using the image from https://hub.docker.com/r/jboss/keycloak/
```
docker run -p 8090:8080 -e JAVA_OPTS="-Dkeycloak.profile.feature.scripts=enabled -Dkeycloak.profile.feature.upload_scripts=enabled -server -Xms64m -Xmx512m -XX:MetaspaceSize=96M -XX:MaxMetaspaceSize=256m -Djava.net.preferIPv4Stack=true -Djboss.modules.system.pkgs=org.jboss.byteman -Djava.awt.headless=true" -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin  jboss/keycloak
```
change JWKS URL for SecurityRealm1:
replace with http://<YOUR DEVICE IP>:8080/cert instead of http://localhost:8080/cert
change JWKS URL for SecurityRealm2:
replace with http://<YOUR DEVICE IP>:8080/cert instead of http://localhost:8080/cert
###  Standard
```
sh bin/standalone.sh  -c standalone.xml -b 0.0.0.0 -Djboss.bind.address.management=0.0.0.0 --debug 8190 -Djboss.http.port=8090
```
### Import Realms
**Open the Keycloak admin console, click on Add Realm, click on import 'Select file', select portal.realm, realm1.json and realm2.json and click Create.
**

