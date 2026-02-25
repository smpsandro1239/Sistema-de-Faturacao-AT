import nodemailer from "nodemailer";
import { gerarPDFDocumento } from "./pdf";
import { defaultTemplates, renderTemplate } from "./mail-templates";

/**
 * Biblioteca de envio de emails
 * Sistema de Faturação Certificado pela AT
 */

// Configuração do transportador (exemplo com Ethereal para testes ou variáveis de ambiente)
// Em produção, usar um serviço real (Resend, SendGrid, Mailgun, SMTP real)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "demo@ethereal.email",
    pass: process.env.EMAIL_PASS || "demo_pass",
  },
});

interface EnviarEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: {
    filename: string;
    content: any;
  }[];
}

export async function enviarEmail(params: EnviarEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Sistema de Faturação" <no-reply@faturaat.pt>',
      ...params,
    });

    console.log("Email enviado: %s", info.messageId);
    // Se estiver a usar Ethereal, mostrar URL de pré-visualização
    if (process.env.EMAIL_HOST?.includes("ethereal")) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false, error };
  }
}

/**
 * Envia um documento por email para o cliente com PDF em anexo
 */
export async function enviarEmailDocumento(documento: any, clienteEmail: string) {
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal/documento/${documento.accessKey}`;

  const templateData = {
    clienteNome: documento.clienteNome,
    numeroFormatado: documento.numeroFormatado,
    empresaNome: documento.empresaNome,
    totalLiquido: documento.totalLiquido.toFixed(2),
    portalUrl: portalUrl
  };

  const template = defaultTemplates.DOCUMENTO_EMITIDO;
  const subject = renderTemplate(template.subject, templateData);
  const text = renderTemplate(template.body, templateData);

  // Gerar PDF para anexo
  const pdfBuffer = await gerarPDFDocumento({
    ...documento,
    dataEmissao: documento.dataEmissao ? documento.dataEmissao.toISOString() : null,
    linhas: documento.linhas.map((l: any) => ({
      codigoArtigo: l.codigoArtigo,
      descricaoArtigo: l.descricaoArtigo,
      quantidade: l.quantidade,
      precoUnitario: l.precoUnitario,
      taxaIVAPercentagem: l.taxaIVAPercentagem,
      base: l.base,
      valorIVA: l.valorIVA,
    })),
  }, false) as Uint8Array;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Fatura ${documento.numeroFormatado}</h1>
        </div>
        <div style="padding: 30px; background-color: white;">
          <p>Olá <strong>${documento.clienteNome}</strong>,</p>
          <p>Esperamos que esteja bem. Segue em anexo o seu documento fiscal emitido por <strong>${documento.empresaNome}</strong>.</p>

          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #edf2f7;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #718096;">Número:</td>
                <td style="padding: 5px 0; text-align: right; font-weight: bold;">${documento.numeroFormatado}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #718096;">Data:</td>
                <td style="padding: 5px 0; text-align: right;">${new Date(documento.dataEmissao).toLocaleDateString("pt-PT")}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0 0 0; border-top: 1px solid #e2e8f0; color: #718096; font-size: 18px;">Total:</td>
                <td style="padding: 10px 0 0 0; border-top: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #059669; font-size: 18px;">${documento.totalLiquido.toFixed(2)}€</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${portalUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Detalhes no Portal</a>
          </div>

          <p style="color: #718096; font-size: 14px; text-align: center;">Obrigado pela sua preferência.</p>
        </div>
        <div style="background-color: #f7fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #a0aec0; font-size: 12px;">${documento.empresaNome} | NIF: ${documento.empresaNif}</p>
        </div>
      </div>
    </div>
  `;

  return enviarEmail({
    to: clienteEmail,
    subject,
    text,
    html,
    attachments: [
      {
        filename: `${documento.numeroFormatado.replace(/\//g, '-')}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  });
}
