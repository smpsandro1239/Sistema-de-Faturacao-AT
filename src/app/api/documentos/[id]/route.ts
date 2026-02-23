import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const documento = await db.documento.findUnique({
      where: { id },
      include: {
        cliente: true,
        serie: true,
        linhas: true,
      },
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    const empresa = await db.empresa.findFirst();

    return NextResponse.json({
      documento,
      empresa,
    });
  } catch (error) {
    console.error("Erro ao procurar documento:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
