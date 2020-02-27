import AuthType  from "../lib/auth/types/AuthType";

class MockServer {
    config() {
        return {
            get: () => {
                return null;
            }
        }
    }
    register(args) {
        this.registerArgs = args;
    }
}

describe('AuthType tests', () => {
    it('should contain only security_impersonate_as when no additional headers are passed', () => {
        // arrange
        var mockServer = new MockServer();
        var authType = new AuthType(() => {}, mockServer, null, null, null, {});
        // act
        authType.setupStorage();
        // assert
        expect(mockServer.registerArgs.options.allowedHeaders).toHaveLength(1);
        expect(mockServer.registerArgs.options.allowedHeaders).toContain("security_impersonate_as");
    });

    it('should add whitelisted headers when present', () => {
        // arrange
        var mockServer = new MockServer();
        const mockEsConfig = {
            requestHeadersWhitelist: ["test-header-1", "test-header-2"]
        }
        var authType = new AuthType(() => {}, mockServer, null, null, null, mockEsConfig);
        // act
        authType.setupStorage();
        // assert
        expect(mockServer.registerArgs.options.allowedHeaders).toHaveLength(3);
        expect(mockServer.registerArgs.options.allowedHeaders).toContain("security_impersonate_as");
        expect(mockServer.registerArgs.options.allowedHeaders).toContain("test-header-1");
        expect(mockServer.registerArgs.options.allowedHeaders).toContain("test-header-2");
    });
});
