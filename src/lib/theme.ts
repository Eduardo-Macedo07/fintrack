/**
 * Tema claro/escuro. A escolha fica em localStorage; sem escolha, segue o sistema.
 * O atributo `data-theme` no <html> é quem liga os tokens de cor (ver globals.css).
 */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "fintrack-theme";

/** Cor da barra do navegador no celular, por tema (acompanha o `--background`). */
export const THEME_COLORS: Record<Theme, string> = { light: "#f3f4fa", dark: "#0e1022" };

/**
 * Roda no <head>, ANTES da primeira pintura: evita o "flash" de tema claro
 * para quem usa o escuro. Precisa ser autocontido (vira texto no HTML).
 */
export const themeInitScript = `(function(){try{
var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var t=(s==="dark"||s==="light")?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
var r=document.documentElement;r.dataset.theme=t;
var m=document.querySelector('meta[name="theme-color"]');
if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m);}
m.content=${JSON.stringify(THEME_COLORS)}[t];
}catch(e){}})();`;

/** Aplica o tema na tela (com transição suave, se permitido) e guarda a escolha. */
export function applyTheme(theme: Theme, { animate = true } = {}) {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (animate && !reduce) {
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 450);
  }
  root.dataset.theme = theme;

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // modo privado/bloqueado: o tema vale só nesta visita
  }
}
