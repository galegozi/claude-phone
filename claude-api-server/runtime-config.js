const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const VALID_AUTH_MODES = new Set(['subscription', 'api']);

function parseDotEnv(envContent) {
  const parsed = {};

  for (const line of String(envContent || '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (key) {
      parsed[key] = valueParts.join('=');
    }
  }

  return parsed;
}

function resolveClaudeModel(env = process.env) {
  return env.CLAUDE_MODEL || env.ANTHROPIC_MODEL || DEFAULT_MODEL;
}

function isClaudeModel(model) {
  return String(model || '').toLowerCase().startsWith('claude');
}

function resolveAuthMode(env = process.env) {
  const explicitMode = String(env.CLAUDE_AUTH_MODE || '').trim().toLowerCase();
  if (VALID_AUTH_MODES.has(explicitMode)) {
    return explicitMode;
  }

  const model = resolveClaudeModel(env);
  if (env.ANTHROPIC_BASE_URL || env.ANTHROPIC_AUTH_TOKEN || !isClaudeModel(model)) {
    return 'api';
  }

  return 'subscription';
}

function applyAuthMode(env = process.env) {
  const authMode = resolveAuthMode(env);
  const nextEnv = { ...env };

  if (authMode === 'subscription') {
    delete nextEnv.ANTHROPIC_API_KEY;
    delete nextEnv.ANTHROPIC_AUTH_TOKEN;
    delete nextEnv.ANTHROPIC_BASE_URL;
  }

  return { env: nextEnv, authMode };
}

module.exports = {
  DEFAULT_MODEL,
  parseDotEnv,
  resolveClaudeModel,
  resolveAuthMode,
  applyAuthMode,
};
