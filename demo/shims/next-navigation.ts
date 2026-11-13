import { useMemo, useSyncExternalStore } from "react";

import { getLocation, navigate, subscribe } from "../router";

/** Substitutos de `next/navigation` na demonstração. */
export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => getLocation().pathname);
}

export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, () => getLocation().search);
  return useMemo(() => new URLSearchParams(search), [search]);
}

const router = {
  push: (href: string, options?: { scroll?: boolean }) => navigate(href, options),
  replace: (href: string, options?: { scroll?: boolean }) =>
    navigate(href, { ...options, replace: true }),
  refresh: () => {},
  back: () => history.back(),
};

export function useRouter() {
  return router;
}
