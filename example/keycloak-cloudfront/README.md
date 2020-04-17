# Cloudfront(Lambda:edge) with lambda authorizer

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
Open the Keycloak admin console, click on Add Realm, click on import 'Select file', select realm-tenant1.json and realm-tenant2.json and click Create.

## 2. Run emulation cloudfront and lambda:edge locally

```bash
cd lambda-edge-example
npm i
cd ..
npm i
npm run start
```

## 3. Deploy to cloud using aws CDK
```bash
cd keycloak-cloudfront-cdk
./deploy.sh -n "<unique S3 Bucket>" -r "arn:aws:iam::<AWS-ACCOUNT>:role/<ROLE>"
```

## 4. Users:

| User         | password  | Realm Name    |  Client Type        | 
|:-------------|:----------|:--------------|:--------------------|
| tenant1      | tenant1   | tenant1       | clientId and Secret |
| tenant2      | tenant2   | Tenant2       | client jwt          | 

## 5. Switch Tenant:
![vzakharchenko14-32-39](../../docs/CloudFront:Lambda:edge example 2020-04-16 11-32-11.png)
![vzakharchenko14-32-39](../../docs/CloudFront:Lambda:edge example 2020-04-16 12-09-15.png)


