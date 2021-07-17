import { KeycloakJsonStructure } from '../Options';

export function getUrl(url:string):string {
  return url.slice(url.length - 1) === '/'
    ? url.slice(0, -1) : url;
}

export function getKeycloakUrl(keycloakJson:KeycloakJsonStructure):string {
  const keycloakJsonElement = keycloakJson['auth-server-url'];
  return getUrl(keycloakJsonElement);
}
