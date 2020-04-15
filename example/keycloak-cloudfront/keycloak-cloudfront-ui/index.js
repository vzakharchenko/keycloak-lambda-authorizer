import fetch from 'axios';
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';

function getSessionValue() {
    return Cookies.get('KEYCLOAK_AWS_SESSION');
}

export function getTenantCookieValue(cookieName) {
    return Cookies.get(cookieName);
}

function getDecodedSession() {
    const sessionValue = getSessionValue();
    if (sessionValue){
        return jwt.decode(sessionValue);
    }
    window.location.reload();
}

function removeCookies(cookieName) {
    if (window.location.protocol === 'http:') {
        Cookies.remove(cookieName);
    } else {
        Cookies.remove(cookieName, { path: '/', domain: `.${window.location.host}`, secure: true });
        Cookies.remove(cookieName, { path: '/', domain: `${window.location.host}`, secure: true });
    }
}

export function getTenants(){
    const decodedSession = getDecodedSession();
    const retTenants=[];
    const tenants = decodedSession.tenants;
    Object.keys(tenants).forEach(tenant=>{
        const resources = tenants[tenant];
        Object.keys(resources).forEach(resource=>{
            retTenants.push({
                realm:tenant,
                resource
            })
        })
    });
    return retTenants;
}

export function getTenantCookie(realm, resource) {
    const decodedSession = getDecodedSession();
    const tenants = decodedSession.tenants;
    if (tenants[realm] && tenants[realm][resource]){
        return tenants[realm][resource].cookieName;
    }
    throw new Error('Tenant '+realm +'-'+resource + 'does not exist');
}

export async function reloadToken(realm, resource, cookieName) {
    removeCookies(cookieName);
    const ret = await fetch({
        url: `/${realm}/${resource}/refresh`,
        method: 'GET',
        withCredentials: true,
    });
    if (ret.data) {
        location.reload();
        return true;
    }
    return false;
}

export async function getActiveTenantToken(realm, resource) {
    if (!realm && !resource){
        const tenants = getTenants();
        if (tenants.length >1){
            throw new Error("Several Tenant found. Please specify which tenant do you need");
        }
        const tenant = tenants[0];
        realm = tenant.realm;
        resource = tenant.resource;
    }
    const tenantCookie = getTenantCookie(realm, resource);
    let token = getTenantCookieValue(tenantCookie);
    if (!token){
        token =  await reloadToken(realm,resource,tenantCookie);
    }
    return token;
}

export async function getDecodedTenantToken(realm, resource){
    return jwt.decode(await getActiveTenantToken(realm,resource));
}

export function getTenant(realm, resource) {
return getTenants().find(tenant=> tenant.realm === realm && tenant.resource === resource)
}