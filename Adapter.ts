import {
  AdapterDependencies,
  AdapterContent,
  updateOptions,
} from './typescript/Options';
import { SecurityAdapter } from './typescript/adapters/SecurityAdapter';
import { ApigatewayAdapter, DefaultApigatewayAdapter } from './typescript/adapters/ApigatewayAdapter';
import { ServiceAccount } from './typescript/serviceaccount/ServiceAccount';
import { DefaultMiddlewareAdapter, MiddlewareAdapter } from './typescript/adapters/MiddlewareAdapter';

export interface KeycloakAdapter {
    getDefaultAdapter(): SecurityAdapter;

    getAPIGateWayAdapter(): ApigatewayAdapter;
    getExpressMiddlewareAdapter(): MiddlewareAdapter;

    getAWSLambdaAdapter(): ApigatewayAdapter;

    getServiceAccount():ServiceAccount;
}

export default class DefaultKeycloakAdapter implements KeycloakAdapter {
    options: AdapterContent;

    constructor(options: AdapterDependencies) {
      this.options = updateOptions(options);
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
