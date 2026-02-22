import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obterStockTotalArtigo, verificarStockDisponivel } from "@/lib/stock";

// GET - Obter stock de artigos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artigoId = searchParams.get("artigoId");
    const armazemId = searchParams.get("armazemId");
    const quantidade = searchParams.get("quantidade");
    const verificar = searchParams.get("verificar") === "true";

    // Verificar disponibilidade de stock
    if (artigoId && armazemId && quantidade && verificar) {
      const disponivel = await verificarStockDisponivel({
        artigoId,
        armazemId,
        quantidade: parseFloat(quantidade),
      });
      return NextResponse.json({ disponivel });
    }

    // Obter stock total de um artigo
    if (artigoId) {
      const stock = await obterStockTotalArtigo(artigoId);
      return NextResponse.json(stock);
    }

    // Listar stock de todos os artigos que controlam stock
    const artigos = await db.artigo.findMany({
      where: {
        controlaStock: true,
        ativo: true,
      },
      include: {
        stocksArmazem: {
          include: {
            armazem: {
              select: { id: true, codigo: true, nome: true, principal: true },
            },
          },
        },
      },
      orderBy: { descricao: "asc" },
    });

    const stockResumo = artigos.map((artigo) => ({
      id: artigo.id,
      codigo: artigo.codigo,
      descricao: artigo.descricao,
      unidade: artigo.unidade,
      stockMinimo: artigo.stockMinimo,
      stockMaximo: artigo.stockMaximo,
      stockTotal: artigo.stocksArmazem.reduce((sum, s) => sum + s.quantidade, 0),
      porArmazem: artigo.stocksArmazem.map((s) => ({
        armazem: s.armazem,
        quantidade: s.quantidade,
        reservada: s.quantidadeReservada,
        disponivel: s.quantidade - s.quantidadeReservada,
      })),
    }));

    return NextResponse.json(stockResumo);
  } catch (error) {
    console.error("Erro ao obter stock:", error);
    return NextResponse.json(
      { error: "Erro ao obter stock de artigos" },
      { status: 500 }
    );
  }
}
