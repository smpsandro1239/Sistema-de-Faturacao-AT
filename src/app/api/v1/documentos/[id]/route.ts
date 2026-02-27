import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, getApiKeyFromRequest } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = getApiKeyFromRequest(request);
  const auth = await validateApiKey(apiKey);

  if (!auth.valid || !auth.empresaId) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;

  try {
    const documento = await db.documento.findFirst({
      where: {
        id,
        empresaId: auth.empresaId
      },
      include: {
        linhas: true,
        serie: true,
      },
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    return NextResponse.json(documento);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
