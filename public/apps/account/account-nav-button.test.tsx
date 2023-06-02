/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */


describe('Remove the tenant parameter in copied URLs', () => {

    it('should remove the security_tenant parameter in the copied URLs', () => {
        const mockSetWindowHref = jest.fn();
        Object.defineProperty(window, 'location', {
          value: {
            get pathname() {
              return '/app/dashboards?security_tenant=admin_tenant';
            },
            set href(value: string) {
                console.log('value ', value)
              mockSetWindowHref(value);
            }
          },
        });
    
        // https://marek-rozmus.medium.com/mocking-window-object-d316050ae7a5
        window.location.href = '/kilkenny';
        
        //https://robertmarshall.dev/blog/how-to-mock-local-storage-in-jest-tests/
        expect(mockSetWindowHref).toBeCalledWith('/kilkenny')
      });
});