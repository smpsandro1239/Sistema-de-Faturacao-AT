/**
 * Sistema de Templates de Email
 * Suporta placeholders dinâmicos para personalização
 */

export interface EmailTemplate {
  subject: string;
  body: string;
}

export const defaultTemplates: Record<string, EmailTemplate> = {
  DOCUMENTO_EMITIDO: {
    subject: "Fatura {{numeroFormatado}} - {{empresaNome}}",
    body: `
      Olá {{clienteNome}},

      Segue em anexo a fatura {{numeroFormatado}} no valor de {{totalLiquido}}€.

      Pode consultar e descarregar o PDF original no nosso portal seguro:
      {{portalUrl}}

      Obrigado pela sua preferência.
      {{empresaNome}}
    `
  },
  STOCK_BAIXO: {
    subject: "Alerta de Stock Baixo - {{empresaNome}}",
    body: `
      Olá,

      Os seguintes artigos atingiram o nível de stock mínimo:

      {{listaArtigos}}

      Por favor, verifique a necessidade de reposição.

      {{empresaNome}}
    `
  }
};

export function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(placeholder, String(value));
  }
  return rendered;
}
