import { schema, TypeOf } from '@kbn/config-schema';

import {
  PluginInitializerContext,
  PluginConfigDescriptor,
} from 'kibana/server';
import SecurityPlugin from './plugin';

export const configSchema = schema.object({
  cookie: schema.object({
    secure: schema.boolean({ defaultValue: false }),
    ttl: schema.number({ defaultValue: 3600 }),
    password: schema.string(),
  }),
  multitenancy: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
    tenants: schema.object({
      preferred: schema.arrayOf(schema.string(), {defaultValue: [] }),
    }),
  }),
  readonly_mode: schema.object({
    roles: schema.arrayOf(schema.string(), { defaultValue: [] }),
  }),
  auth: schema.object({
    unauthenticated_routes: schema.arrayOf(schema.string()),
  }),
});

export type SecurityPluginConfigType = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor = {
  exposeToBrowser: {
    cookie: true,
  },
  schema: configSchema,
};



export const plugin = (initializerContext: PluginInitializerContext) =>
  new SecurityPlugin(initializerContext);
