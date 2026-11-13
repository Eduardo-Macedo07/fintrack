import type { ComponentProps, MouseEvent } from "react";

import { navigate } from "../router";

type Props = Omit<ComponentProps<"a">, "href"> & {
  href: string;
  scroll?: boolean;
  replace?: boolean;
  prefetch?: boolean | null;
};

/** Substituto do `next/link` na demonstração: mesmo visual, navegação pelo roteador em memória. */
export default function Link({
  href,
  scroll,
  replace,
  prefetch,
  onClick,
  ...anchor
}: Props) {
  void prefetch; // não existe pré-carregamento sem servidor
  return (
    <a
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        navigate(href, { scroll, replace });
      }}
      {...anchor}
    />
  );
}
