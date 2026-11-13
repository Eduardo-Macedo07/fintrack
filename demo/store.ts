/**
 * Estado vivo da demonstração: guarda no localStorage do navegador e avisa a tela quando muda.
 * Tudo aqui é por aparelho: nada vai para servidor nenhum.
 */
import { useSyncExternalStore } from "react";

import { loginSchema, registerSchema } from "@/features/auth/schemas";
import { DEMO_ACCOUNT } from "@/features/demo/demo-data";
import { currentMonth, today } from "@/lib/dates";

import {
  addDemoTransactions,
  addUser,
  emptyState,
  type DemoState,
  type DemoUser,
} from "./data";

const STORAGE_KEY = "fintrack-demo-v1";

let state: DemoState = emptyState();
const listeners = new Set<() => void>();

export const getState = () => state;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Troca o estado, salva e redesenha a tela (o papel do `revalidatePath` no app real). */
export function commit(next: DemoState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // armazenamento bloqueado (modo privado): a demonstração vale só até fechar a página
  }
  listeners.forEach((listener) => listener());
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getState);
}

export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Hash da senha com sal (SHA-256). É uma demonstração: no app real a senha passa por bcrypt
 * no servidor. Sem `crypto.subtle` (contexto não seguro), cai num hash simples, só para a
 * demonstração continuar funcionando.
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const text = `${salt}:${password}`;
  try {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(bytes)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++)
      h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
    return `fnv-${(h >>> 0).toString(16)}`;
  }
}

function load(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    const ok =
      Array.isArray(parsed.users) &&
      Array.isArray(parsed.categories) &&
      Array.isArray(parsed.transactions) &&
      typeof parsed.nextSeq === "number";
    return ok ? { ...emptyState(), ...parsed } : null;
  } catch {
    return null;
  }
}

async function seeded(): Promise<DemoState> {
  const salt = newId();
  const { state: withUser, user } = addUser(
    emptyState(),
    {
      name: DEMO_ACCOUNT.name,
      email: DEMO_ACCOUNT.email,
      salt,
      passwordHash: await hashPassword(DEMO_ACCOUNT.password, salt),
    },
    newId,
  );
  return addDemoTransactions(
    withUser,
    user.id,
    currentMonth(),
    Number(today().slice(8, 10)),
    newId,
  );
}

/** Carrega o que estava salvo neste navegador ou cria a conta de demonstração. */
export async function initStore() {
  state = load() ?? (await seeded());
  commit(state);
}

/** Apaga tudo deste navegador e recria a conta de demonstração. */
export async function resetDemo() {
  commit(await seeded());
}

export function currentUser(): DemoUser | null {
  return state.users.find((u) => u.id === state.sessionUserId) ?? null;
}

export function signOut() {
  commit({ ...state, sessionUserId: null });
}

/** Devolve o usuário ou `null`, sem dizer se o erro foi no e-mail ou na senha (como o app real). */
export async function signIn(credentials: unknown): Promise<DemoUser | null> {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const user = state.users.find((u) => u.email === parsed.data.email);
  const hash = await hashPassword(parsed.data.password, user?.salt ?? "sem-usuario");
  if (!user || hash !== user.passwordHash) return null;
  commit({ ...state, sessionUserId: user.id });
  return user;
}

/** Cadastra (validando como o app real), cria as categorias padrão e já entra. Lança ZodError ou EmailTakenError. */
export async function signUp(input: unknown): Promise<DemoUser> {
  const { name, email, password } = registerSchema.parse(input);
  const salt = newId();
  const { state: next, user } = addUser(
    state,
    { name, email, salt, passwordHash: await hashPassword(password, salt) },
    newId,
  );
  commit({ ...next, sessionUserId: user.id });
  return user;
}
