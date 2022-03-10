import {AdapterContent, Enforcer, RequestContent} from '../Options';
import {decodeToken} from "../utils/TokenUtils";

import {SecurityAdapter} from './SecurityAdapter';


export type AwsEvent = {
    headers:any,
    authorizationToken?:string
}

export type AwsAuthorizationEvent = {
    authorizationToken:string
}

export interface ApigatewayAdapter {
    validate(awsEvent:AwsEvent|AwsAuthorizationEvent, enforcer?:Enforcer):Promise<RequestContent>
}

export class DefaultApigatewayAdapter implements ApigatewayAdapter {
  constructor(options: AdapterContent) {
    this.options = options;
    this.securityAdapter = options.securityAdapter;
  }

  options: AdapterContent;

  securityAdapter:SecurityAdapter;


  getAuthHeader(awsEvent: AwsEvent) {
    const {headers} = awsEvent;
    return headers ? headers.Authorization : null;
  }

  getTokenString(awsEvent: AwsEvent|AwsAuthorizationEvent) {
    const tokenString = awsEvent.authorizationToken || this.getAuthHeader(<AwsEvent>awsEvent);
    if (!tokenString) {
      throw new Error('Expected \'event.authorizationToken\' parameter to be set');
    }
    const match = tokenString.match(/^Bearer (.*)$/i);
    if (!match || match.length < 2) {
      throw new Error(`Invalid Authorization token - '${tokenString}' does not match 'Bearer .*'`);
    }
    return match[1];
  }

  async validate(awsEvent:AwsEvent|AwsAuthorizationEvent, enforcer?:Enforcer): Promise<RequestContent> {
    const tokenString = this.getTokenString(awsEvent);
    const requestContent:RequestContent = {
      tokenString,
      token: decodeToken(tokenString),
      request: awsEvent,
    };
    return await this.securityAdapter.validate(requestContent, enforcer);
  }
}
