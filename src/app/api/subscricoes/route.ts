import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Listar subscrições
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");
    const estado = searchParams.get("estado");

    const subscricoes = await db.subscricao.findMany({
      where: {
        clienteId: clienteId || undefined,
        estado: (estado as any) || undefined,
      },
      include: {
        cliente: true,
        serie: true,
        linhas: true,
      },
      orderBy: { proximaEmissao: "asc" },
    });

    return NextResponse.json(subscricoes);
  } catch (error) {
    console.error("Erro ao procurar subscrições:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Criar subscrição
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clienteId,
      descricao,
      frequencia,
      dataInicio,
      serieId,
      linhas,
      utilizadorId,
    } = body;

    if (!clienteId || !serieId || !linhas || linhas.length === 0) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    // Calcular totais
    let totalBase = 0;
    let totalIVA = 0;

    const linhasFormatadas = linhas.map((l: any, idx: number) => {
      const base = l.quantidade * l.precoUnitario - (l.desconto || 0);
      const valorIVA = base * (l.taxaIVAPercentagem / 100);
      totalBase += base;
      totalIVA += valorIVA;
      return {
        artigoId: l.artigoId || null,
        codigoArtigo: l.codigoArtigo,
        descricaoArtigo: l.descricaoArtigo,
        quantidade: l.quantidade,
        precoUnitario: l.precoUnitario,
        desconto: l.desconto || 0,
        taxaIVAId: l.taxaIVAId,
        taxaIVAPercentagem: l.taxaIVAPercentagem,
        base,
        valorIVA,
        ordem: idx + 1,
      };
    });

    const subscricao = await db.subscricao.create({
      data: {
        clienteId,
        clienteNome: cliente.nome,
        clienteNif: cliente.nif,
        descricao,
        frequencia,
        dataInicio: new Date(dataInicio || Date.now()),
        proximaEmissao: new Date(dataInicio || Date.now()), // Primeira emissão na data de início
        serieId,
        totalBase,
        totalIVA,
        totalLiquido: totalBase + totalIVA,
        utilizadorId: utilizadorId || "system",
        linhas: {
          create: linhasFormatadas,
        },
      },
      include: {
        linhas: true,
      },
    });

    return NextResponse.json(subscricao, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar subscrição:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
