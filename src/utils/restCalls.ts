export type HTTPMethod =
    | 'get' | 'GET'
    | 'delete' | 'DELETE'
    | 'head' | 'HEAD'
    | 'options' | 'OPTIONS'
    | 'post' | 'POST'
    | 'put' | 'PUT'
    | 'patch' | 'PATCH'
    | 'purge' | 'PURGE'
    | 'link' | 'LINK'
    | 'unlink' | 'UNLINK'

export interface RestCalls {
  fetchData(url:string, method?:HTTPMethod, headers?:any):Promise<string>;
  sendData(url:string, method:HTTPMethod, data:string, headers?:any):Promise<string>;
}
