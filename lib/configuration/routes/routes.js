import Boom from 'boom';
import Joi from 'joi';
import Resources from './../resources';

/**
 * The backend API allows to manage the backend configuration.
 *
 * NOTE: All routes are POST since the REST API requires an admin certificat to access
 *
 */
export default function (pluginRoot, server, APP_ROOT, API_ROOT) {

  const config = server.config();
  const backend = server.plugins.opendistro_security.getSecurityConfigurationBackend();


  /**
   * Returns a list of resource instances.
   *
   */
  server.route({
    method: 'GET',
    path: `${API_ROOT}/configuration/{resourceName}`,
    handler: {
      async: async (request, reply) => {
        try {
          const results = await backend.list(request.headers, request.params.resourceName);
          return reply({
            total: Object.keys(results).length,
            data: results
          });
        } catch (error) {
          if (error.isBoom) {
            return reply(error);
          }
          throw error;
        }
      }
    },
    config: {
      validate: {
        params: {
          resourceName: Joi.string().required()
        }
      }
    }
  });

  /**
   * Returns a resource instance.
   *
   * Response sample:
   *
   * {
   *   "id": "kibiuser",
   * }
   */
  server.route({
    method: 'GET',
    path: `${API_ROOT}/configuration/{resourceName}/{id}`,
    handler: {
      async: async (request, reply) => {
        try {
          const result = await backend.get(request.headers, request.params.resourceName, request.params.id);
          return reply(result);
        } catch (error) {
          if (error.name === 'NotFoundError') {
            return reply(Boom.notFound(`${request.params.id} not found.`));
          } else {
            if (error.isBoom) {
              return reply(error);
            }
            throw error;
          }
        }
      }
    },
    config: {
      validate: {
        params: {
          resourceName: Joi.string().required(),
          id: Joi.string().required()
        }
      }
    }
  });

  /**
   * Deletes a resource instance.
   *
   * Response sample:
   *
   * {
   *   "message": "Deleted user username"
   * }
   */
  server.route({
    method: 'DELETE',
    path: `${API_ROOT}/configuration/{resourceName}/{id}`,
    handler: {
      async: async (request, reply) => {
        try {
          const response = await backend.delete(request.headers, request.params.resourceName, request.params.id);
          return reply({
            message: response.message
          });
        } catch (error) {
            if (error.isBoom) {
                return reply(error);
            }
            throw error;
        }
      }
    },
    config: {
      validate: {
        params: {
          resourceName: Joi.string().required(),
          id: Joi.string().required()
        }
      }
    }
  });


  /**
   * Updates or creates a resource
   *
   * Request sample:
   *
   * {
   *   "password": "password"
   * }
   */
  server.route({
    method: 'POST',
    path: `${API_ROOT}/configuration/{resourceName}/{id}`,
    handler: {
      async: async (request, reply) => {
        try {
          const response = await backend.save(request.headers, request.params.resourceName, request.params.id, request.payload);
          return reply({
            message: response.message
          });
        } catch (error) {
          if (error.isBoom) {
            return reply(error);
          }
          throw error;
        }
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: `${API_ROOT}/configuration/cache`,
    handler: {
      async: async (request, reply) => {
        try {
          const response = await backend.clearCache(request.headers);
          return reply({
            message: response.message
          });
        } catch (error) {
            if (error.isBoom) {
                return reply(error);
            }
            throw error;
        }
      }
    }
  });


  server.route({
    method: 'GET',
    path: `${API_ROOT}/restapiinfo`,
    handler: {
      async: async (request, reply) => {
        try {
          const response = await backend.restapiinfo(request.headers);
          return reply(response);
        } catch (error) {
            if (error.isBoom) {
                return reply(error);
            }
            throw error;
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: `${API_ROOT}/configuration/indices`,
    handler: (request, reply) => {
        try {
          let response =  backend.indices(request.headers);
          return reply(response);
        } catch (error) {
            if (error.isBoom) {
                return reply(error);
            }
            throw error;
        }
      }
  });

    server.route({
        method: 'POST',
        path: `${API_ROOT}/configuration/validatedls/{indexName}`,
        handler: {
            async: async (request, reply) => {
                try {
                    const response = await backend.validateDls(request.headers, request.params.indexName, request.payload);
                    return reply(response);
                } catch (error) {
                    if (error.isBoom) {
                        return reply(error);
                    }
                    throw error;
                }
            }
        }
    });

}

