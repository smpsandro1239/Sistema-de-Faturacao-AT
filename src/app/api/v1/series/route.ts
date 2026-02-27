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
    const series = await db.serie.findMany({
      where: {
        empresaId: auth.empresaId,
        ativo: true,
      },
      select: {
        id: true,
        codigo: true,
        descricao: true,
        tipoDocumento: true,
        prefixo: true,
        ano: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(series);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
