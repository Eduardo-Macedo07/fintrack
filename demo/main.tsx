import { useEffect, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

import { THEME_COLORS, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

import {
  DashboardPage,
  LoginPage,
  PlanPage,
  RegisterPage,
  Shell,
  TransactionsPage,
} from "./pages";
import { getLocation, navigate, subscribe } from "./router";
import { initStore, useDemoState } from "./store";

const AUTH_PATHS = ["/login", "/register"];
const PRIVATE_PATHS = ["/dashboard", "/transactions", "/plan"];

/** Mesmo critério do script de tema do app: escolha salva, senão o tema do sistema. */
function initTheme() {
  let theme: Theme = "light";
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    theme =
      saved === "dark" || saved === "light"
        ? saved
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
  } catch {
    // armazenamento bloqueado: fica o tema claro
  }
  document.documentElement.dataset.theme = theme;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLORS[theme];
}

function App() {
  const state = useDemoState();
  const { pathname } = useSyncExternalStore(subscribe, getLocation);
  const user = state.users.find((u) => u.id === state.sessionUserId) ?? null;

  // O papel do proxy.ts + requireUser(): sem sessão, só login/cadastro; com sessão, direto ao app.
  const path = user
    ? PRIVATE_PATHS.includes(pathname)
      ? pathname
      : "/dashboard"
    : AUTH_PATHS.includes(pathname)
      ? pathname
      : "/login";

  useEffect(() => {
    if (path !== pathname) navigate(path, { replace: true });
  }, [path, pathname]);

  if (!user) return path === "/register" ? <RegisterPage /> : <LoginPage />;

  return (
    <Shell key={user.id} user={user}>
      {path === "/transactions" ? (
        <TransactionsPage user={user} />
      ) : path === "/plan" ? (
        <PlanPage user={user} />
      ) : (
        <DashboardPage user={user} />
      )}
    </Shell>
  );
}

initTheme();
const root = createRoot(document.getElementById("root")!);
initStore().then(() => root.render(<App />));
