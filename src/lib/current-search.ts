/**
 * A query string da URL neste instante (não a capturada numa renderização antiga).
 * Fica num módulo próprio para a versão de demonstração poder trocá-lo pelo roteador em memória.
 */
export const currentSearch = () => window.location.search;
