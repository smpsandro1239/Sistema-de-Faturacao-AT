import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, getApiKeyFromRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const apiKey = getApiKeyFromRequest(request);
  const auth = await validateApiKey(apiKey);

  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const artigos = await db.artigo.findMany({
      where: { ativo: true },
      select: {
        id: true,
        codigo: true,
        descricao: true,
        precoUnitario: true,
        unidade: true,
        taxaIVAId: true,
      },
    });
    return NextResponse.json(artigos);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const apiKey = getApiKeyFromRequest(request);
  const auth = await validateApiKey(apiKey);

  if (!auth.valid || auth.apiKey.permissao !== "READ_WRITE") {
    return NextResponse.json({ error: "Não autorizado para escrita" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { codigo, descricao, precoUnitario, taxaIVAId } = body;

    if (!codigo || !descricao || !precoUnitario || !taxaIVAId) {
      return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
    }

    const artigo = await db.artigo.create({
      data: {
        codigo,
        descricao,
        precoUnitario,
        taxaIVAId,
      },
    });

    return NextResponse.json(artigo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar artigo" }, { status: 500 });
  }
}
