
import _ from 'lodash';
import { Headers } from '../../../../src/core/server/http/router/headers';

export function filterAuthHeaders(originalHeaders: Headers, headersToKeep: string[]) {
  const normalizeHeader = function (header: string) {
    if (!header) {
      return '';
    }
    return header.trim().toLowerCase();
  };

  const headersToKeepNormalized = headersToKeep.map(normalizeHeader);
  const originalHeadersNormalized = _.mapKeys(originalHeaders, function (headerValue, headerName) {
    return normalizeHeader(headerName);
  });
  return _.pick(originalHeadersNormalized, headersToKeepNormalized);
}
