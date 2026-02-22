import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, getInvoiceEmailTemplate } from "@/lib/mail";
import { gerarPDFDocumento } from "@/lib/pdf";

export async function POST(request: NextRequest) {
  try {
    const { documentoId, emailDestino } = await request.json();

    if (!documentoId || !emailDestino) {
      return NextResponse.json(
        { error: "Documento ID e Email de destino são obrigatórios" },
        { status: 400 }
      );
    }

    const documento = await db.documento.findUnique({
      where: { id: documentoId },
      include: {
        linhas: true,
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }

    // Gerar PDF em buffer
    const pdfBuffer = await gerarPDFDocumento(documento as any, { output: 'buffer' });

    // Preparar email
    const template = getInvoiceEmailTemplate(
      documento.clienteNome,
      documento.numeroFormatado,
      documento.empresaNome
    );

    // Enviar email com anexo
    const result = await sendEmail({
      to: emailDestino,
      subject: template.subject,
      text: template.text,
      html: template.html,
      attachments: [
        {
          filename: `${documento.numeroFormatado.replace(/\//g, '-')}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // Registar na auditoria
    await db.auditoria.create({
      data: {
        utilizadorId: "system",
        acao: "EMAIL_SENT",
        entidade: "Documento",
        entidadeId: documentoId,
        valorNovo: JSON.stringify({ to: emailDestino, messageId: (result as any).messageId }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email enviado com sucesso",
      simulated: (result as any).simulated
    });
  } catch (error) {
    console.error("Erro no endpoint de envio de email:", error);
    return NextResponse.json(
      { error: "Falha ao enviar email" },
      { status: 500 }
    );
  }
}
