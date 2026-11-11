import "server-only";

import { parseEnv } from "./env-schema";

/** Variáveis de ambiente validadas. Importe apenas em código de servidor. */
export const env = parseEnv(process.env);
