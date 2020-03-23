import { plugin }  from "../lib/session/sessionPlugin";
import { MockServer, MockRequest, MockAuthResponse, MockHapi } from './Mocks'

describe('Session Plugin tests', () => {
    var mockServer = new MockServer();
    var request = new MockRequest();
    var h = new MockHapi();
    var authResponse = new MockAuthResponse();
    const testHeaderKey1 = "test-header-key-1", testHeaderValue1 = "test-header-value-1";
    const testHeaderKey2 = "test-header-key-2", testHeaderValue2 = "test-header-value-2";
    var additionalAuthHeaders = {
        [testHeaderKey1]: testHeaderValue1,
        [testHeaderKey2]: testHeaderValue2
    };

    it('should store only 1 specified header in the session', () => {
        // arrange
        plugin.register(mockServer, { headersToStoreInSession:[testHeaderKey1] })
        mockServer.preAuthFunc(request, h)
        
        // act
        request.auth.securitySessionStorage._handleAuthResponse({}, authResponse, additionalAuthHeaders)

        // assert
        const storedHeaders = authResponse.session.additionalAuthHeaders;
        expect(storedHeaders).toHaveProperty(testHeaderKey1, testHeaderValue1);
        expect(storedHeaders).not.toHaveProperty(testHeaderKey2);
    });

    it('should store 2 specified headers in the session', () => {
        // arrange
        plugin.register(mockServer, { headersToStoreInSession:[testHeaderKey1, testHeaderKey2] })
        mockServer.preAuthFunc(request, h)
        
        // act
        request.auth.securitySessionStorage._handleAuthResponse({}, authResponse, additionalAuthHeaders)

        // assert
        const storedHeaders = authResponse.session.additionalAuthHeaders;
        expect(storedHeaders).toHaveProperty(testHeaderKey1, testHeaderValue1);
        expect(storedHeaders).toHaveProperty(testHeaderKey2, testHeaderValue2);
    });

    it('should store no headers in the session', () => {
        // arrange
        plugin.register(mockServer, { headersToStoreInSession:[] })
        mockServer.preAuthFunc(request, h)
        
        // act
        request.auth.securitySessionStorage._handleAuthResponse({}, authResponse, additionalAuthHeaders)

        // assert
        const storedHeaders = authResponse.session.additionalAuthHeaders;
        expect(storedHeaders).not.toHaveProperty(testHeaderKey1, testHeaderValue1);
        expect(storedHeaders).not.toHaveProperty(testHeaderKey2, testHeaderValue2);
    });
});
