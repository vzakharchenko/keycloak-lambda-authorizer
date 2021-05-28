# Example expressjs middleware with security resources scopes

## 1. Start Keycloak

### Docker
Using the image from https://hub.docker.com/r/jboss/keycloak/
```
docker run -p 8090:8080 -e JAVA_OPTS="-Dkeycloak.profile.feature.scripts=enabled -Dkeycloak.profile.feature.upload_scripts=enabled -server -Xms64m -Xmx512m -XX:MetaspaceSize=96M -XX:MaxMetaspaceSize=256m -Djava.net.preferIPv4Stack=true -Djboss.modules.system.pkgs=org.jboss.byteman -Djava.awt.headless=true" -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin  -v `pwd`/example/express-scopes:/express-scopes  -e KEYCLOAK_IMPORT=/express-scopes/example-realm-export.json  jboss/keycloak
```
###  Standard
```
sh bin/standalone.sh  -c standalone.xml -b 0.0.0.0 -Djboss.bind.address.management=0.0.0.0 --debug 8190 -Djboss.http.port=8090
```
Open the Keycloak admin console, click on Add Realm, click on import 'Select file', select example-realm-export.json and click Create.

## 2. Run Services Locally
- Express Service
```bash
cd express-service
npm i
npm run start
```

## 3. Run UI locally

```bash
cd frontend
npm i
npm run start
```

## 4. Open UI
[http://localhost:3001](http://localhost:3001)

users:

| User      | Password   | Service Role Scope 1|Service Role Scope 2|
|:----------|:-----------|:--------------------|:-------------------|
| user      | user       | X                   | X                  |
| user1     | user1      | X                   | -                  |
| user2     | user2      | -                   | X                  |

Resource:

| Role                   | Resource    | Scope               |
|:-----------------------|:------------|:--------------------|
| Service Role Scope 1   | service-api | Scope1              |
| Service Role Scope 2   | service-api | Scope2              |

## 6. Results

| User      | Result                                                                                                 | Description                                           |
|:----------|:-------------------------------------------------------------------------------------------------------|:------------------------------------------------------|
| User      |  has resource "service-api" with both scopes                                                           | All Access                                            |
| User1     |  has resource "service-api" with scope1                                                                | User can invoke only function1                        |
| User2     |  has resource "service-api" with scope2                                                                | User can invoke only function2                        |
