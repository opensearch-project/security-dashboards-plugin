import { AuthenticationHandler, KibanaRequest, LifecycleResponseFactory, AuthToolkit } from "../../../../src/core/server";

export function dummyAuthHandler(request: KibanaRequest, response: LifecycleResponseFactory, toolkit: AuthToolkit): AuthenticationHandler {
  
  return ;
};
