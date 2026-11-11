import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hash descartável usado quando o e-mail não existe, para que o login gaste o
 * mesmo tempo com usuário inexistente e com senha errada (evita enumerar e-mails
 * por tempo de resposta).
 */
export const DUMMY_HASH = bcrypt.hashSync("senha-inexistente", COST);
