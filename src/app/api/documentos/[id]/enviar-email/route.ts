import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enviarEmailDocumento } from "@/lib/mail";
import { authenticateRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { email } = body;

    const documento = await db.documento.findUnique({
      where: { id },
      include: { cliente: true },
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    const targetEmail = email || documento.cliente.email;

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Cliente não tem email associado e nenhum email foi fornecido" },
        { status: 400 }
      );
    }

    const result = await enviarEmailDocumento(documento, targetEmail);

    if (result.success) {
      return NextResponse.json({ message: "Email enviado com sucesso" });
    } else {
      return NextResponse.json(
        { error: "Erro ao enviar email", details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro no endpoint de email:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
