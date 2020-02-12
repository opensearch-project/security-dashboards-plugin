import AuthType  from "../lib/auth/types/AuthType";

const mockServer = {
    config: () => { 
        return {
            get: () => {
                return null;
            }
        }
    } 
}

describe('AuthType tests', () => {
    it('should contain only security_impersonate_as when no additional headers are passed', () => {
        // act
        var authType = new AuthType(null, mockServer, null, null, null, {});
        // assert
        expect(authType.allowedAdditionalAuthHeaders).toHaveLength(1);
        expect(authType.allowedAdditionalAuthHeaders).toContain("security_impersonate_as");
    });

    it('should add whitelisted headers when present', () => {
        // arrange
        const mockEsConfig = {
            requestHeadersWhitelist: ["test-header-1", "test-header-2"]
        }
        // act
        var authType = new AuthType(null, mockServer, null, null, null, mockEsConfig);
        // assert
        expect(authType.allowedAdditionalAuthHeaders).toHaveLength(3);
        expect(authType.allowedAdditionalAuthHeaders).toContain("security_impersonate_as");
        expect(authType.allowedAdditionalAuthHeaders).toContain("test-header-1");
        expect(authType.allowedAdditionalAuthHeaders).toContain("test-header-2")
    });
});
