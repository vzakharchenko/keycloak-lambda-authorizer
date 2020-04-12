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

## 2. Run Serverless offline (Client Id and Secret credential Type)

```bash
cd serverless
npm i
npm run offline
```
Client Credentials:  
![Keycloak Admin Console 2020-04-12 13-00-52](../../docs/Keycloak%20Admin%20Console%202020-04-12%2013-00-52.png)

## 2. Run Serverless offline (Client jwt credential Type)
```bash
cd serverless-jwks
npm i
npm run offline
```

Client Credentials:  
![Keycloak Admin Console 2020-04-12 12-58-57](../../docs/Keycloak%20Admin%20Console%202020-04-12%2012-58-57.png)



## 3. Run UI locally

```bash
cd ui
npm i
npm run start
```

## 4. Open UI
[http://localhost:3001](http://localhost:3001)

![Log in to lambda-authorizer 2020-04-11 11-22-35](../../docs/Log%20in%20to%20lambda-authorizer%202020-04-11%2011-22-35.png)

users:

| User      | password  | UI Permission | Lambda Permission | Lambda-JWKS Permission |
|:----------|:----------|:--------------|:------------------|:-----------------------|
| user      | user      | X             | X                 | X                      |
| user-jwks | user-jwks | X             | -                 | X                      |
| user2     | user2     | X             | -                 | -                      |
| user3     | user3     | -             | -                 | -                      |

Permissions:

| Permission        | Permission Name  | Policy Name  | Resource       | Action                      |
|:------------------|:-----------------|:-------------|:---------------|:----------------------------|
| UI Permission     | uiRolePermission | uiRolePolicy | uiResource     | Access To UI                |
| Lambda Permission | lambdaPermission | lambdaPolicy | LambdaResource | Permission To Invoke Lambda |

## 5. Results

| User      | Result                                                                                                 | Description                                           |
|:----------|:-------------------------------------------------------------------------------------------------------|:------------------------------------------------------|
| User      | ![Express handlebars 2020-04-12 12-54-06](../../docs/Express%20handlebars%202020-04-12%2012-54-06.png) | All Access                                            |
| user-jwks | ![Express handlebars 2020-04-12 12-56-22](../../docs/Express%20handlebars%202020-04-12%2012-56-22.png) | lambda-jwks only                                      |
| User2     | ![Express handlebars 2020-04-11 22-45-33](../../docs/Express%20handlebars%202020-04-12%2012-57-43.png) | Has access to UI but does not have access to Lambda`s |
| User3     | ![localhost3001+2020-04-11+22-47-30](../../docs/localhost3001%2B2020-04-11%2B22-47-30.png)             | Does not have access to UI and Lambda`s               |

## 6. Deploy to cloud

```bash
cd serverless
npm i
serverless deploy
```

```bash
cd serverless-jwks
npm i
serverless deploy
```
