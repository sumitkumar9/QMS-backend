import { z } from 'zod';

/** Treat `FOO=` (empty string) as "not set", so defaults apply. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema);

const commaList = z.string().transform((v) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0),
);

const envSchema = z.object({
  NODE_ENV: optional(z.enum(['development', 'test', 'production']).default('development')),
  PORT: optional(z.coerce.number().int().min(1).max(65535).default(3000)),
  LOG_LEVEL: optional(z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info')),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  CORS_ORIGINS: optional(commaList.default([])),
  TRUST_PROXY: optional(z.coerce.number().int().min(0).default(0)),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // Logger is not available yet (it depends on env), so write directly to stderr.
    process.stderr.write(`Invalid environment configuration:\n${z.prettifyError(result.error)}\n`);
    process.exit(1);
  }
  return result.data;
}

/** Validated, typed environment. Parsed once at import; the process exits on invalid config. */
export const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
