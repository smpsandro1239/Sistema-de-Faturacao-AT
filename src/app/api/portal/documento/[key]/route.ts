import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Obter documento público via accessKey
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const documento = await db.documento.findFirst({
      where: { accessKey: key, estado: "EMITIDO" },
      include: {
        cliente: true,
        serie: true,
        linhas: true,
      },
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado ou não disponível" }, { status: 404 });
    }

    const empresa = await db.empresa.findFirst();

    return NextResponse.json({
      documento,
      empresa,
    });
  } catch (error) {
    console.error("Erro no portal público:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
