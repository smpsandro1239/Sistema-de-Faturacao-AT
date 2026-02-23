import { createHash } from "crypto";

/**
 * Calcula o hash SHA-256 do documento conforme Portaria 363/2010
 * 
 * O hash é calculado sobre os seguintes campos:
 * - Data de emissão
 * - Tipo de documento
 * - Número do documento
 * - Total líquido
 * - Hash do documento anterior (para encadeamento)
 */
export function calcularHashDocumento(params: {
  dataEmissao: Date;
  tipoDocumento: string;
  numeroDocumento: string;
  totalLiquido: number;
  hashAnterior: string | null;
}): string {
  const { dataEmissao, tipoDocumento, numeroDocumento, totalLiquido, hashAnterior } = params;

  // Formatar data como AAAA-MM-DD
  const dataFormatada = dataEmissao.toISOString().split("T")[0];

  // Formatar total com 2 casas decimais
  const totalFormatado = totalLiquido.toFixed(2);

  // Construir string para hash
  // Ordem: Data + Tipo + Número + Total + Hash Anterior
  const dadosHash = [
    dataFormatada,
    tipoDocumento,
    numeroDocumento,
    totalFormatado,
    hashAnterior || "",
  ].join(";");

  // Calcular SHA-256
  const hash = createHash("sha256").update(dadosHash, "utf8").digest("hex");

  return hash;
}

/**
 * Valida a integridade do encadeamento de hashes
 */
export function validarEncadeamentoHash(params: {
  hashAtual: string;
  hashAnterior: string | null;
  documentoAnteriorHash: string | null;
}): boolean {
  // Se não há documento anterior, o hash anterior deve ser null
  if (!params.hashAnterior && !params.documentoAnteriorHash) {
    return true;
  }

  // Se há documento anterior, o hash anterior deve corresponder
  if (params.hashAnterior && params.documentoAnteriorHash) {
    return params.hashAnterior === params.documentoAnteriorHash;
  }

  return false;
}

/**
 * Gera o ATCUD (Código Único de Documento da AT)
 * Formato: CódigoValidaçãoSérie-NúmeroDocumento
 */
export function gerarATCUD(codigoValidacaoSerie: string, numeroDocumento: number): string {
  return `${codigoValidacaoSerie}-${numeroDocumento}`;
}

/**
 * Valida formato do ATCUD
 */
export function validarATCUD(atcud: string): boolean {
  // Formato: XXXXXX-N ou XXXXXXXX-NNNNN
  const regex = /^[A-Z0-9]+-\d+$/;
  return regex.test(atcud);
}

/**
 * Extrai componentes do ATCUD
 */
export function parseATCUD(atcud: string): { codigoSerie: string; numero: number } | null {
  if (!validarATCUD(atcud)) {
    return null;
  }

  const [codigoSerie, numeroStr] = atcud.split("-");
  return {
    codigoSerie,
    numero: parseInt(numeroStr, 10),
  };
}
