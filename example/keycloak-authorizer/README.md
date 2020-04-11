# Api gateway with lambda authorizer

## 1. Start Keycloak

### Docker
Using the image from https://hub.docker.com/r/jboss/keycloak/
```
docker run -p 8080:8080 -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin jboss/keycloak
```
###  Standard
```
sh bin/standalone.sh  -c standalone.xml -b 0.0.0.0 -Djboss.bind.address.management=0.0.0.0 --debug 8190 -Djboss.http.port=8090
```
Open the Keycloak admin console, click on Add Realm, click on import 'Select file', select example-realm-export.json and click Create.

## 2. Run Serverless offline

```
cd serverless
npm i
npm run offline
```

## 3. Run UI locally

```
cd ui
npm i
npm run start
```

## 4. Open UI
[http://localhost:3001](http://localhost:3001)

![Log in to lambda-authorizer 2020-04-11 11-22-35](../../docs/Log%20in%20to%20lambda-authorizer%202020-04-11%2011-22-35.png)

users:

| User  | password | UI Permission | Lambda Permission |
|:------|:---------|:--------------|:------------------|
| user  | user     | X             | X                 |
| user2 | user2    | X             | -                 |
| user3 | user3    | -             | -                 |

Permissions:

| Permission        | Permission Name  | Policy Name  | Resource       | Action                      |
|:------------------|:-----------------|:-------------|:---------------|:----------------------------|
| UI Permission     | uiRolePermission | uiRolePolicy | uiResource     | Access To UI                |
| Lambda Permission | lambdaPermission | lambdaPolicy | LambdaResource | Permission To Invoke Lambda |

## 5. Results

| User  | Result                                                                                                 | Description                                         |
|:------|:-------------------------------------------------------------------------------------------------------|:----------------------------------------------------|
| User  | ![Express handlebars 2020-04-11 11-35-42](../../docs/Express%20handlebars%202020-04-11%2011-35-42.png) | All Access                                          |
| User2 | ![Express handlebars 2020-04-11 22-45-33](../../docs/Express%20handlebars%202020-04-11%2022-45-33.png) | Has access to UI but does not have access to Lambda |
| User3 | ![localhost3001+2020-04-11+22-47-30](../../docs/localhost3001%2B2020-04-11%2B22-47-30.png)             | Does not have access to UI and Lambda               |


