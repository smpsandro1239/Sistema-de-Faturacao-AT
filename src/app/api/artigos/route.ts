import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Listar todos os artigos
export async function GET() {
  try {
    const artigos = await db.artigo.findMany({
      include: {
        taxaIVA: true,
        isencao: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(artigos);
  } catch (error) {
    console.error("Erro ao buscar artigos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar artigos" },
      { status: 500 }
    );
  }
}

// POST - Criar novo artigo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, descricao, tipo, precoUnitario, unidade, taxaIVAId, isencaoId, observacoes } = body;

    // Verificar se código já existe
    const artigoExistente = await db.artigo.findUnique({
      where: { codigo },
    });

    if (artigoExistente) {
      return NextResponse.json(
        { error: "Já existe um artigo com este código." },
        { status: 400 }
      );
    }

    const artigo = await db.artigo.create({
      data: {
        codigo,
        descricao,
        tipo: tipo || "PRODUTO",
        precoUnitario: parseFloat(precoUnitario),
        unidade: unidade || "UN",
        taxaIVAId,
        isencaoId: isencaoId || null,
        observacoes: observacoes || null,
      },
      include: {
        taxaIVA: true,
        isencao: true,
      },
    });

    return NextResponse.json(artigo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar artigo:", error);
    return NextResponse.json(
      { error: "Erro ao criar artigo" },
      { status: 500 }
    );
  }
}
