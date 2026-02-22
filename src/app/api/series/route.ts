import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Listar todas as séries
export async function GET() {
  try {
    const series = await db.serie.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(series);
  } catch (error) {
    console.error("Erro ao buscar séries:", error);
    return NextResponse.json(
      { error: "Erro ao buscar séries" },
      { status: 500 }
    );
  }
}

// POST - Criar nova série
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, descricao, tipoDocumento, prefixo, codigoValidacaoAT, ano } = body;

    // Verificar se código já existe
    const serieExistente = await db.serie.findUnique({
      where: { codigo },
    });

    if (serieExistente) {
      return NextResponse.json(
        { error: "Já existe uma série com este código." },
        { status: 400 }
      );
    }

    const serie = await db.serie.create({
      data: {
        codigo,
        descricao,
        tipoDocumento,
        prefixo,
        numeroAtual: 0,
        codigoValidacaoAT: codigoValidacaoAT || null,
        ano: parseInt(ano),
        dataInicio: new Date(`${ano}-01-01`),
      },
    });

    return NextResponse.json(serie, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar série:", error);
    return NextResponse.json(
      { error: "Erro ao criar série" },
      { status: 500 }
    );
  }
}
