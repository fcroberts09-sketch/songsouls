import { describe, expect, it } from 'vitest';
import { botUserAgent, loadConfig } from '../../src/config.js';

describe('config', () => {
  it('applies defaults and treats empty strings as unset', () => {
    const c = loadConfig({ NODE_ENV: 'test', OTEL_EXPORTER_OTLP_ENDPOINT: '', PORT: '' });
    expect(c.PORT).toBe(4000);
    expect(c.OTEL_EXPORTER_OTLP_ENDPOINT).toBeUndefined();
  });
  it('rejects a non-URL database url', () => {
    expect(() => loadConfig({ NODE_ENV: 'test', DATABASE_URL: 'nope' })).toThrow();
  });
  it('builds an identified bot user agent with a contact address', () => {
    const ua = botUserAgent(
      loadConfig({
        NODE_ENV: 'test',
        PRODUCT_NAME: 'Parity',
        BOT_CONTACT_URL: 'https://parity.example/bot',
        BOT_CONTACT_EMAIL: 'bot@parity.example',
      }),
      '0.0.1',
    );
    expect(ua).toBe(
      'ParityPriceCheck/0.0.1 (+https://parity.example/bot; mailto:bot@parity.example)',
    );
  });
});
