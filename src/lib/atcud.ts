/**
 * Biblioteca para geração de ATCUD
 * Conforme exigências da Autoridade Tributária
 */

/**
 * Gera o código ATCUD para um documento
 * Formato: CodigoValidacao-NumeroSequencial
 *
 * @param codigoValidacao Código de validação da série atribuído pela AT
 * @param numeroSequencial Número sequencial do documento na série
 * @returns String formatada do ATCUD
 */
export function gerarATCUD(codigoValidacao: string, numeroSequencial: number): string {
  if (!codigoValidacao) {
    return "0-" + numeroSequencial;
  }
  return `${codigoValidacao}-${numeroSequencial}`;
}
