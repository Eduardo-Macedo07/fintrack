/**
 * Roteador em memória da versão de demonstração (no lugar do roteador do Next.js).
 *
 * A página fica hospedada como um arquivo único, sem servidor: não existem URLs como /dashboard.
 * O caminho e os filtros vivem aqui; só o nome da tela vai para o `#hash` do endereço
 * (um nome simples, que é o que o ambiente de hospedagem aceita), para o botão Voltar funcionar.
 */
export type Location = { pathname: string; search: string };

const HASH_BY_PATH: Record<string, string> = {
  "/login": "entrar",
  "/register": "cadastro",
  "/dashboard": "inicio",
  "/transactions": "transacoes",
  "/plan": "planejar",
};
const PATH_BY_HASH = Object.fromEntries(
  Object.entries(HASH_BY_PATH).map(([p, h]) => [h, p]),
);

function pathFromHash(): string | null {
  try {
    return PATH_BY_HASH[window.location.hash.replace(/^#/, "")] ?? null;
  } catch {
    return null;
  }
}

let location: Location = { pathname: pathFromHash() ?? "/login", search: "" };
const listeners = new Set<() => void>();

export const getLocation = () => location;

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function set(next: Location) {
  location = next;
  listeners.forEach((listener) => listener());
}

export function navigate(
  href: string,
  options: { scroll?: boolean; replace?: boolean } = {},
) {
  const url = new URL(href, "https://demo.invalid");
  const next = { pathname: url.pathname, search: url.search };
  if (next.pathname === location.pathname && next.search === location.search) return;

  const changedScreen = next.pathname !== location.pathname;
  set(next);

  if (changedScreen) {
    const name = HASH_BY_PATH[next.pathname];
    try {
      if (name && options.replace) history.replaceState(null, "", `#${name}`);
      else if (name) window.location.hash = name;
    } catch {
      // sem acesso ao endereço: a navegação em memória continua funcionando
    }
    if (options.scroll !== false) window.scrollTo(0, 0);
  }
}

// Botão Voltar/Avançar do navegador (ou alguém editando o #hash).
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    const pathname = pathFromHash();
    if (pathname && pathname !== location.pathname) set({ pathname, search: "" });
  });
}
