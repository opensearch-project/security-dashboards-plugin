import { get } from 'lodash';
import Boom from 'boom';
import AuthenticationError from "../../../auth/errors/authentication_error";

export default function wrapElasticsearchError(error) {

  let statusCode = error.statusCode;

  if (error.status) {
    statusCode = error.status;
  }

  if (!statusCode) {
    statusCode = 500;
  }

  let message: string = get(error, 'body.message');
  if (!message) {
    message = error.message;
  }

  const wwwAuthHeader: string = get(error, 'body.error.header[WWW-Authenticate]');

  if (wwwAuthHeader) {
    const boomError = Boom.boomify(error, { statusCode: statusCode, message: message });
    boomError.output.headers['WWW-Authenticate'] = wwwAuthHeader || 'Basic realm="Authorization Required"';
    return boomError;
  }

  if (statusCode == 401) {
    return new AuthenticationError(`${message}`);
  }

  return Boom.boomify(error, { statusCode: statusCode, message: message });

}
