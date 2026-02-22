import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Listar armazéns
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get("ativo");

    const armazens = await db.armazem.findMany({
      where: {
        ...(ativo !== null && { ativo: ativo === "true" }),
      },
      orderBy: [{ principal: "desc" }, { nome: "asc" }],
      include: {
        _count: {
          select: { stocks: true, movimentosOrigem: true },
        },
      },
    });

    return NextResponse.json(armazens);
  } catch (error) {
    console.error("Erro ao listar armazéns:", error);
    return NextResponse.json(
      { error: "Erro ao listar armazéns" },
      { status: 500 }
    );
  }
}

// POST - Criar armazém
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Verificar se já existe código
    const existente = await db.armazem.findUnique({
      where: { codigo: data.codigo },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Já existe um armazém com este código." },
        { status: 400 }
      );
    }

    // Se for principal, remover flag dos outros
    if (data.principal) {
      await db.armazem.updateMany({
        where: { principal: true },
        data: { principal: false },
      });
    }

    const armazem = await db.armazem.create({
      data: {
        codigo: data.codigo,
        nome: data.nome,
        morada: data.morada || null,
        codigoPostal: data.codigoPostal || null,
        localidade: data.localidade || null,
        principal: data.principal || false,
        observacoes: data.observacoes || null,
      },
    });

    return NextResponse.json(armazem, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar armazém:", error);
    return NextResponse.json(
      { error: "Erro ao criar armazém" },
      { status: 500 }
    );
  }
}
