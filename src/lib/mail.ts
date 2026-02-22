import nodemailer from 'nodemailer';

/**
 * Biblioteca para envio de emails
 * Sistema de Faturação Certificado pela AT
 */

// Configuração do transportador (pode ser movido para a base de dados futuramente)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: any[];
}

/**
 * Enviar email
 */
export async function sendEmail(options: MailOptions) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"FaturaAT" <no-reply@faturaat.pt>',
    ...options,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    // Em desenvolvimento, simula sucesso se não houver SMTP configurado
    if (process.env.NODE_ENV === 'development') {
      console.log('Simulação de envio de email em desenvolvimento...');
      return { success: true, simulated: true };
    }
    throw error;
  }
}

/**
 * Template base para envio de faturas
 */
export function getInvoiceEmailTemplate(nomeCliente: string, numeroDocumento: string, empresaNome: string) {
  return {
    subject: `Fatura ${numeroDocumento} - ${empresaNome}`,
    text: `Olá ${nomeCliente},\n\nSegue em anexo o documento ${numeroDocumento} da ${empresaNome}.\n\nObrigado pela preferência.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #059669;">Olá, ${nomeCliente}!</h2>
        <p>Segue em anexo o documento <strong>${numeroDocumento}</strong> emitido por <strong>${empresaNome}</strong>.</p>
        <p>Pode consultar o detalhe do documento no ficheiro PDF em anexo.</p>
        <br/>
        <p>Obrigado pela sua preferência!</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #666;">Este é um email automático, por favor não responda.</p>
      </div>
    `,
  };
}
