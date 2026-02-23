import { createHash } from "crypto";

/**
 * Calcula o hash SHA-256 do documento conforme Portaria 363/2010
 * 
 * Requisitos da AT (Simplificado):
 * O hash deve ser calculado sobre os seguintes campos concatenados por ';':
 * 1. Data do documento (AAAA-MM-DD)
 * 2. Data e hora da gravação (AAAA-MM-DDTHH:MM:SS)
 * 3. Referência do documento (ex: FT 2024/1)
 * 4. Total do documento (ex: 123.45)
 * 5. Hash do documento anterior (se não existir, vazio)
 */
export function calcularHashDocumento(params: {
  dataEmissao: Date;
  dataCriacao: Date;
  numeroDocumento: string;
  totalLiquido: number;
  hashAnterior: string | null;
}): string {
  const { dataEmissao, dataCriacao, numeroDocumento, totalLiquido, hashAnterior } = params;

  // 1. Formatar data de emissão como AAAA-MM-DD
  const dataEmissaoStr = dataEmissao.toISOString().split("T")[0];

  // 2. Formatar data de criação como AAAA-MM-DDTHH:MM:SS
  const dataCriacaoStr = dataCriacao.toISOString().split(".")[0];

  // 3. Formatar total com 2 casas decimais
  const totalStr = totalLiquido.toFixed(2);

  // Construir string para hash
  const dadosHash = [
    dataEmissaoStr,
    dataCriacaoStr,
    numeroDocumento,
    totalStr,
    hashAnterior || "",
  ].join(";");

  // Calcular SHA-256
  const hash = createHash("sha256").update(dadosHash, "utf8").digest("hex");

  return hash;
}

/**
 * Valida a integridade do encadeamento de hashes
 */
export function validarEncadeamentoHash(
  hashAtualCalculado: string,
  hashAtualGravado: string
): boolean {
  return hashAtualCalculado === hashAtualGravado;
}

/**
 * Gera o ATCUD (Código Único de Documento da AT)
 * Formato: CódigoValidaçãoSérie-NúmeroDocumento
 */
export function gerarATCUD(codigoValidacaoSerie: string, numeroDocumento: number): string {
  if (!codigoValidacaoSerie || codigoValidacaoSerie === "0") {
    return ""; // Ou algum fallback se permitido em dev
  }
  return `${codigoValidacaoSerie}-${numeroDocumento}`;
}

/**
 * Valida formato do ATCUD
 */
export function validarATCUD(atcud: string): boolean {
  // Formato: XXXXXX-N
  const regex = /^[A-Z0-9]+-\d+$/;
  return regex.test(atcud);
}
