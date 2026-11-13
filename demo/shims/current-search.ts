import { getLocation } from "../router";

/** Na demonstração os filtros vivem no roteador em memória, não na URL real. */
export const currentSearch = () => getLocation().search;
