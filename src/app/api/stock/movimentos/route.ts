import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obterHistoricoMovimentos } from "@/lib/stock";

// GET - Listar movimentos de stock
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artigoId = searchParams.get("artigoId") || undefined;
    const armazemId = searchParams.get("armazemId") || undefined;
    const tipo = searchParams.get("tipo") as "ENTRADA" | "SAIDA" | "TRANSFERENCIA" | null;
    const dataInicio = searchParams.get("dataInicio") ? new Date(searchParams.get("dataInicio")!) : undefined;
    const dataFim = searchParams.get("dataFim") ? new Date(searchParams.get("dataFim")!) : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const resultado = await obterHistoricoMovimentos({
      artigoId,
      armazemId,
      tipo: tipo || undefined,
      dataInicio,
      dataFim,
      page,
      limit,
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao listar movimentos:", error);
    return NextResponse.json(
      { error: "Erro ao listar movimentos de stock" },
      { status: 500 }
    );
  }
}

// POST - Criar movimento manual
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { registarMovimentoStock } = await import("@/lib/stock");

    // Validações básicas
    if (!data.artigoId || !data.armazemId || !data.quantidade || !data.tipo || !data.utilizadorId) {
      return NextResponse.json(
        { error: "Campos obrigatórios em falta" },
        { status: 400 }
      );
    }

    const movimento = await registarMovimentoStock({
      artigoId: data.artigoId,
      armazemId: data.armazemId,
      armazemDestinoId: data.armazemDestinoId,
      quantidade: parseFloat(data.quantidade),
      tipo: data.tipo,
      origem: data.origem || "AJUSTE_MANUAL",
      precoUnitario: data.precoUnitario ? parseFloat(data.precoUnitario) : undefined,
      observacoes: data.observacoes,
      utilizadorId: data.utilizadorId,
    });

    return NextResponse.json(movimento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar movimento:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar movimento de stock" },
      { status: 400 }
    );
  }
}
