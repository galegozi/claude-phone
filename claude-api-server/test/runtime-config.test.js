const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseDotEnv,
  resolveClaudeModel,
  resolveAuthMode,
  applyAuthMode,
} = require('../runtime-config');

test('parseDotEnv reads key value pairs and ignores comments', () => {
  const parsed = parseDotEnv(`
# comment
ANTHROPIC_BASE_URL=http://localhost:11434
ANTHROPIC_AUTH_TOKEN=ollama
EMPTY_VALUE=
`);

  assert.deepStrictEqual(parsed, {
    ANTHROPIC_BASE_URL: 'http://localhost:11434',
    ANTHROPIC_AUTH_TOKEN: 'ollama',
    EMPTY_VALUE: '',
  });
});

test('resolveClaudeModel prefers explicit CLAUDE_MODEL', () => {
  assert.equal(
    resolveClaudeModel({ CLAUDE_MODEL: 'openrouter/meta-llama/llama-3.3-70b-instruct', ANTHROPIC_MODEL: 'claude-opus-4' }),
    'openrouter/meta-llama/llama-3.3-70b-instruct'
  );
});

test('resolveClaudeModel falls back to ANTHROPIC_MODEL', () => {
  assert.equal(resolveClaudeModel({ ANTHROPIC_MODEL: 'qwen/qwen3-32b' }), 'qwen/qwen3-32b');
});

test('resolveAuthMode defaults to subscription for standard Claude setups', () => {
  assert.equal(resolveAuthMode({ CLAUDE_MODEL: 'claude-sonnet-4-20250514' }), 'subscription');
});

test('resolveAuthMode switches to api for open-model configurations automatically', () => {
  assert.equal(resolveAuthMode({ CLAUDE_MODEL: 'qwen/qwen3-32b' }), 'api');
  assert.equal(resolveAuthMode({ ANTHROPIC_BASE_URL: 'http://localhost:11434', CLAUDE_MODEL: 'claude-sonnet-4-20250514' }), 'api');
});

test('applyAuthMode strips Anthropic API settings only in subscription mode', () => {
  const subscription = applyAuthMode({
    CLAUDE_MODEL: 'claude-sonnet-4-20250514',
    ANTHROPIC_API_KEY: 'test-key',
    ANTHROPIC_AUTH_TOKEN: 'token',
    ANTHROPIC_BASE_URL: 'http://localhost:11434',
  });
  assert.equal(subscription.authMode, 'subscription');
  assert.equal(subscription.env.ANTHROPIC_API_KEY, undefined);
  assert.equal(subscription.env.ANTHROPIC_AUTH_TOKEN, undefined);
  assert.equal(subscription.env.ANTHROPIC_BASE_URL, undefined);

  const api = applyAuthMode({
    CLAUDE_MODEL: 'qwen/qwen3-32b',
    ANTHROPIC_API_KEY: 'router-key',
    ANTHROPIC_BASE_URL: 'https://openrouter.ai/api/v1',
  });
  assert.equal(api.authMode, 'api');
  assert.equal(api.env.ANTHROPIC_API_KEY, 'router-key');
  assert.equal(api.env.ANTHROPIC_BASE_URL, 'https://openrouter.ai/api/v1');
});

test('explicit CLAUDE_AUTH_MODE overrides auto-detection', () => {
  assert.equal(resolveAuthMode({
    CLAUDE_AUTH_MODE: 'subscription',
    CLAUDE_MODEL: 'qwen/qwen3-32b',
    ANTHROPIC_BASE_URL: 'http://localhost:11434',
  }), 'subscription');

  assert.equal(resolveAuthMode({
    CLAUDE_AUTH_MODE: 'api',
    CLAUDE_MODEL: 'claude-sonnet-4-20250514',
  }), 'api');
});
