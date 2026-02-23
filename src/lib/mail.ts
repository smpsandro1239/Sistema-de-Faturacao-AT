import nodemailer from "nodemailer";
import { gerarPDFDocumento } from "./pdf";

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
  const subject = `Fatura ${documento.numeroFormatado} - ${documento.empresaNome}`;

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

  const text = `
    Olá ${documento.clienteNome},

    Segue em anexo a fatura ${documento.numeroFormatado} no valor de ${documento.totalLiquido.toFixed(2)}€.

    Obrigado pela sua preferência.
    ${documento.empresaNome}
  `;

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal/documento/${documento.accessKey}`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Fatura ${documento.numeroFormatado}</h2>
      <p>Olá <strong>${documento.clienteNome}</strong>,</p>
      <p>Segue os detalhes da sua fatura:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Documento:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${documento.numeroFormatado}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Data:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(documento.dataEmissao).toLocaleDateString("pt-PT")}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Total:</strong></td>
          <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>${documento.totalLiquido.toFixed(2)}€</strong></td>
        </tr>
      </table>
      <p style="margin-top: 20px;">
        Pode consultar e descarregar o PDF original no nosso portal seguro:<br>
        <a href="${portalUrl}" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Ver Fatura Online</a>
      </p>
      <p style="margin-top: 20px;">Obrigado pela sua preferência.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">${documento.empresaNome} | NIF: ${documento.empresaNif}</p>
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
