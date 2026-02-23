import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Listar documentos para um cliente específico via NIF (Portal)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nif = searchParams.get("nif");

    if (!nif) {
      return NextResponse.json({ error: "NIF é obrigatório" }, { status: 400 });
    }

    const documentos = await db.documento.findMany({
      where: {
        clienteNif: nif,
        estado: "EMITIDO",
      },
      orderBy: { dataEmissao: "desc" },
    });

    return NextResponse.json(documentos);
  } catch (error) {
    console.error("Erro no portal do cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
