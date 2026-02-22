import QRCode from "qrcode";

/**
 * Gera os dados para o QR Code conforme requisitos da AT
 * Portaria 363/2010 - Anexo I
 */
export function gerarDadosQRCode(params: {
  nifEmissor: string;
  nifCliente: string;
  paisEmissor: string;
  tipoDocumento: string;
  dataEmissao: string;
  numeroDocumento: string;
  atcud: string;
  totalBase: number;
  totalIVA: number;
  hash: string;
}): string {
  const {
    nifEmissor,
    nifCliente,
    paisEmissor,
    tipoDocumento,
    dataEmissao,
    numeroDocumento,
    atcud,
    totalBase,
    totalIVA,
    hash,
  } = params;

  // Formatar tipo de documento conforme AT
  const tipoDoc = mapearTipoDocumento(tipoDocumento);

  // Construir string do QR Code
  // Formato: A:NIF*B:NIF Cliente*C:Pais*D:Tipo Doc*E:Data*F:Numero*G:ATCUD*H:Base*I:IVA*J:Hash
  const dados = [
    `A:${nifEmissor}`,
    `B:${nifCliente || "999999990"}`, // NIF genérico para consumidores finais
    `C:${paisEmissor}`,
    `D:${tipoDoc}`,
    `E:${formatarDataQRCode(dataEmissao)}`,
    `F:${numeroDocumento}`,
    `G:${atcud}`,
    `H:${totalBase.toFixed(2)}`,
    `I:${totalIVA.toFixed(2)}`,
    `J:${hash.substring(0, 10)}`, // Primeiros 10 caracteres do hash
  ].join("*");

  return dados;
}

/**
 * Gera QR Code como Data URL (base64)
 */
export async function gerarQRCodeDataURL(dados: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(dados, {
      width: 150,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error("Erro ao gerar QR Code:", error);
    throw error;
  }
}

/**
 * Gera QR Code como SVG string
 */
export async function gerarQRCodeSVG(dados: string): Promise<string> {
  try {
    const qrCodeSVG = await QRCode.toString(dados, {
      type: "svg",
      width: 150,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
    return qrCodeSVG;
  } catch (error) {
    console.error("Erro ao gerar QR Code SVG:", error);
    throw error;
  }
}

/**
 * Mapeia tipo de documento interno para código AT
 */
function mapearTipoDocumento(tipo: string): string {
  const mapeamento: Record<string, string> = {
    FATURA: "FT",
    FATURA_RECIBO: "FR",
    NOTA_CREDITO: "NC",
    NOTA_DEBITO: "ND",
    RECIBO: "RC",
    GUIA_REMESSA: "GR",
    GUIA_TRANSPORTE: "GT",
    FATURA_PROFORMA: "FP",
    ORCAMENTO: "OR",
  };
  return mapeamento[tipo] || "FT";
}

/**
 * Formata data para QR Code (AAAAMMDD)
 */
function formatarDataQRCode(data: string): string {
  // Assumindo formato ISO ou YYYY-MM-DD
  const dataLimpa = data.split("T")[0].replace(/-/g, "");
  return dataLimpa;
}

/**
 * Valida estrutura do QR Code
 */
export function validarQRCode(dados: string): boolean {
  const camposObrigatorios = ["A:", "B:", "C:", "D:", "E:", "F:", "G:", "H:", "I:", "J:"];
  return camposObrigatorios.every(campo => dados.includes(campo));
}
