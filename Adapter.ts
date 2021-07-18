import {
  AdapterDependencies,
  AdapterContent,
  updateOptions,
} from './src/Options';
import {SecurityAdapter} from './src/adapters/SecurityAdapter';
import {ApigatewayAdapter, DefaultApigatewayAdapter} from './src/adapters/ApigatewayAdapter';
import {ServiceAccount} from './src/serviceaccount/ServiceAccount';
import {DefaultMiddlewareAdapter, MiddlewareAdapter} from './src/adapters/MiddlewareAdapter';
import {JWKS} from './src/jwks/JWKS';

export interface KeycloakAdapter {
    getDefaultAdapter(): SecurityAdapter;

    getAPIGateWayAdapter(): ApigatewayAdapter;
    getExpressMiddlewareAdapter(): MiddlewareAdapter;

    getAWSLambdaAdapter(): ApigatewayAdapter;

    getServiceAccount():ServiceAccount;

    getJWKS():JWKS;
}

export default class DefaultKeycloakAdapter implements KeycloakAdapter {
  options: AdapterContent;

  constructor(options: AdapterDependencies) {
    this.options = updateOptions(options);
  }

  getJWKS(): JWKS {
    return this.options.jwks;
  }

  getServiceAccount(): ServiceAccount {
    return this.options.serviceAccount;
  }

  getAPIGateWayAdapter(): ApigatewayAdapter {
    return new DefaultApigatewayAdapter(this.options);
  }

  getAWSLambdaAdapter(): ApigatewayAdapter {
    return this.getAPIGateWayAdapter();
  }

  getDefaultAdapter(): SecurityAdapter {
    return this.options.securityAdapter;
  }

  getExpressMiddlewareAdapter(): MiddlewareAdapter {
    return new DefaultMiddlewareAdapter(this.options);
  }
}
