import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, getApiKeyFromRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const apiKey = getApiKeyFromRequest(request);
  const auth = await validateApiKey(apiKey);

  if (!auth.valid || !auth.empresaId) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const documentos = await db.documento.findMany({
      where: {
        empresaId: auth.empresaId
      },
      select: {
        id: true,
        numeroFormatado: true,
        tipo: true,
        clienteNome: true,
        totalLiquido: true,
        dataEmissao: true,
        estado: true,
        atcud: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(documentos);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
