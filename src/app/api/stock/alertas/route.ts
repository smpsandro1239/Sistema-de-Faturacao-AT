import { NextResponse } from "next/server";
import { obterArtigosStockBaixo, obterStockTotalArtigo, obterStockArtigo } from "@/lib/stock";
import { db } from "@/lib/db";

// GET - Obter alertas de stock baixo e informações de stock
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo") || "baixo";
    const artigoId = searchParams.get("artigoId");
    const armazemId = searchParams.get("armazemId");

    // Se for pedido de stock de um artigo específico
    if (artigoId && armazemId) {
      const stock = await obterStockArtigo(artigoId, armazemId);
      return NextResponse.json(stock);
    }

    // Se for pedido de stock total de um artigo
    if (artigoId) {
      const stock = await obterStockTotalArtigo(artigoId);
      return NextResponse.json(stock);
    }

    // Alertas de stock baixo
    if (tipo === "baixo") {
      const artigosStockBaixo = await obterArtigosStockBaixo();
      return NextResponse.json({
        tipo: "stock_baixo",
        quantidade: artigosStockBaixo.length,
        artigos: artigosStockBaixo,
      });
    }

    // Resumo geral de stock
    if (tipo === "resumo") {
      const armazens = await db.armazem.findMany({
        where: { ativo: true },
        include: {
          stocks: {
            include: {
              artigo: {
                select: {
                  codigo: true,
                  descricao: true,
                  stockMinimo: true,
                  controlaStock: true,
                },
              },
            },
          },
          _count: {
            select: { stocks: true },
          },
        },
      });

      const artigosStockBaixo = await obterArtigosStockBaixo();

      // Calcular totais por armazém
      const resumoArmazens = armazens.map((armazem) => ({
        id: armazem.id,
        codigo: armazem.codigo,
        nome: armazem.nome,
        principal: armazem.principal,
        totalArtigosComStock: armazem.stocks.filter((s) => s.quantidade > 0).length,
        totalItens: armazem.stocks.reduce((sum, s) => sum + s.quantidade, 0),
      }));

      return NextResponse.json({
        totalArmazens: armazens.length,
        totalArtigosStockBaixo: artigosStockBaixo.length,
        armazens: resumoArmazens,
        alertas: artigosStockBaixo,
      });
    }

    return NextResponse.json({ error: "Tipo de pedido inválido" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao obter alertas de stock:", error);
    return NextResponse.json(
      { error: "Erro ao obter alertas de stock" },
      { status: 500 }
    );
  }
}
