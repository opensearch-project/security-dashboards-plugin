class MockServer {
    config() {
        return {
            get: () => {
                return null;
            }
        }
    }
    ext(_, preAuthFunc) {
        this.preAuthFunc = preAuthFunc;
    }
    register(args) {
        this.registerArgs = args;
    }
}

class MockRequest {
    constructor() {
        this.auth = {};
        this.state = {};
        this.cookieAuth = {
            set(_) { }
        };
    }
}

class MockAuthResponse {
    constructor() {
        this.user = { roles: [""] };
        this.session = {};
    }
}

class MockHapi {
    state(storageCookieName, storage) {
    }
}

export {
    MockServer,
    MockRequest,
    MockAuthResponse,
    MockHapi
}