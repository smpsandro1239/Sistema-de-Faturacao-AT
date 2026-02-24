import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { registarMovimentoStock } from "@/lib/stock";

// GET - Listar faturas de compra
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fornecedorId = searchParams.get("fornecedorId");
    const estado = searchParams.get("estado");

    const faturas = await db.faturaCompra.findMany({
      where: {
        fornecedorId: fornecedorId || undefined,
        estadoPagamento: (estado as any) || undefined,
      },
      include: {
        fornecedor: true,
        linhas: true,
        pagamentos: true,
      },
      orderBy: { dataEmissao: "desc" },
    });

    return NextResponse.json(faturas);
  } catch (error) {
    console.error("Erro ao procurar faturas de compra:", error);
    return NextResponse.json(
      { error: "Erro ao procurar faturas de compra" },
      { status: 500 }
    );
  }
}

// POST - Criar nova fatura de compra
export async function POST(request: NextRequest) {
  try {
    const { authenticated, user, error: authError } = await authenticateRequest(request);
    if (!authenticated || !user?.empresaId) {
      return NextResponse.json({ error: authError || "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      numero,
      fornecedorId,
      dataEmissao,
      dataVencimento,
      linhas,
      observacoes,
      utilizadorId,
    } = body;

    if (!numero || !fornecedorId || !linhas || linhas.length === 0) {
      return NextResponse.json(
        { error: "Campos obrigatórios em falta" },
        { status: 400 }
      );
    }

    // Buscar fornecedor
    const fornecedor = await db.fornecedor.findUnique({
      where: { id: fornecedorId },
    });

    if (!fornecedor) {
      return NextResponse.json(
        { error: "Fornecedor não encontrado" },
        { status: 404 }
      );
    }

    // Calcular totais
    let totalBase = 0;
    let totalIVA = 0;

    const linhasFormatadas = linhas.map((l: any) => {
      const base = l.quantidade * l.precoUnitario - (l.desconto || 0);
      const valorIVA = base * (l.taxaIVAPercentagem / 100);
      totalBase += base;
      totalIVA += valorIVA;
      return {
        artigoId: l.artigoId || null,
        descricao: l.descricao,
        quantidade: l.quantidade,
        precoUnitario: l.precoUnitario,
        desconto: l.desconto || 0,
        taxaIVAPercentagem: l.taxaIVAPercentagem,
        base,
        valorIVA,
      };
    });

    const totalLiquido = totalBase + totalIVA;

    const fatura = await db.$transaction(async (tx) => {
      const f = await tx.faturaCompra.create({
        data: {
          empresaId: user.empresaId,
          numero,
          fornecedorId,
          fornecedorNome: fornecedor.nome,
          fornecedorNif: fornecedor.nif,
          dataEmissao: new Date(dataEmissao),
          dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
          totalBase,
          totalIVA,
          totalLiquido,
          observacoes,
          utilizadorId: user.userId,
          linhas: {
            create: linhasFormatadas,
          },
        },
        include: {
          linhas: true,
        },
      });

      // Entrada automática de stock no armazém principal
      const armazemPrincipal = await tx.armazem.findFirst({
        where: {
          empresaId: user.empresaId,
          principal: true,
          ativo: true,
        },
      });

      if (armazemPrincipal) {
        for (const linha of f.linhas) {
          if (linha.artigoId) {
            // Verificar se o artigo controla stock
            const artigo = await tx.artigo.findUnique({
              where: { id: linha.artigoId },
              select: { controlaStock: true },
            });

            if (artigo?.controlaStock) {
              await registarMovimentoStock({
                artigoId: linha.artigoId,
                armazemId: armazemPrincipal.id,
                quantidade: linha.quantidade,
                tipo: "ENTRADA",
                origem: "ENCOMENDA_COMPRA", // Usamos este para compras
                precoUnitario: linha.precoUnitario,
                observacoes: `Entrada automática via fatura de compra ${numero}`,
                utilizadorId: user.userId,
              }, tx);
            }
          }
        }
      }

      return f;
    });

    return NextResponse.json(fatura, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar fatura de compra:", error);
    return NextResponse.json(
      { error: "Erro ao criar fatura de compra" },
      { status: 500 }
    );
  }
}
