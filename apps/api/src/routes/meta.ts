import type { FastifyPluginAsync } from 'fastify';
import { METROS } from '@parity/shared';
import type { Config } from '../config.js';
import { botUserAgent } from '../config.js';

/** Public, unauthenticated facts about this deployment. Nothing here is per-user. */
export const metaRoutes: FastifyPluginAsync<{ config: Config; version: string }> = async (
  app,
  { config, version },
) => {
  app.get('/v1/meta', async () => ({
    product: config.PRODUCT_NAME,
    version,
    metros: Object.entries(METROS).map(([code, m]) => ({ code, name: m.name, state: m.state })),
    bot_user_agent: botUserAgent(config, version),
    principles: {
      affiliate_revenue: false,
      sells_individual_data: false,
      account_required_for_check: false,
      k_anonymity_min: 10,
    },
  }));
};
