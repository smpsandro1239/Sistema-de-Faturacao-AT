/**
 * API de Faturas de Fornecedores
 * Sistema de Faturação Certificado pela AT
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoFaturaFornecedor } from "@prisma/client";

// GET - Listar faturas de fornecedores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const fornecedorId = searchParams.get("fornecedorId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where = {
      ...(estado && { estado: estado as EstadoFaturaFornecedor }),
      ...(fornecedorId && { fornecedorId }),
      ...(search && {
        OR: [
          { numeroFatura: { contains: search } },
          { fornecedorNome: { contains: search } },
        ],
      }),
    };

    const [faturas, total] = await Promise.all([
      db.faturaFornecedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dataFatura: "desc" },
        include: {
          fornecedor: {
            select: { id: true, nome: true, nif: true },
          },
          encomendaCompra: {
            select: { id: true, numeroFormatado: true },
          },
        },
      }),
      db.faturaFornecedor.count({ where }),
    ]);

    return NextResponse.json({
      faturas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar faturas de fornecedores:", error);
    return NextResponse.json(
      { error: "Erro ao buscar faturas de fornecedores" },
      { status: 500 }
    );
  }
}

// POST - Registar nova fatura de fornecedor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      numeroFatura,
      fornecedorId,
      dataFatura,
      dataVencimento,
      observacoes,
      linhas,
      encomendaCompraId,
      utilizadorId,
    } = body;

    if (!numeroFatura || !fornecedorId || !dataFatura || !linhas || linhas.length === 0) {
      return NextResponse.json(
        { error: "Dados obrigatórios em falta" },
        { status: 400 }
      );
    }

    const fornecedor = await db.fornecedor.findUnique({
      where: { id: fornecedorId },
    });

    if (!fornecedor) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });
    }

    // Calcular totais
    let totalBase = 0;
    let totalIVA = 0;

    const linhasProcessadas = linhas.map((linha: any, index: number) => {
      const base = (linha.quantidade * linha.precoUnitario) - (linha.desconto || 0);
      const valorIVA = base * ((linha.taxaIVAPercentagem || 23) / 100);

      totalBase += base;
      totalIVA += valorIVA;

      return {
        artigoId: linha.artigoId || null,
        codigoArtigo: linha.codigoArtigo || "",
        descricaoArtigo: linha.descricaoArtigo || "",
        quantidade: parseFloat(linha.quantidade),
        precoUnitario: parseFloat(linha.precoUnitario),
        desconto: parseFloat(linha.desconto || 0),
        taxaIVAId: linha.taxaIVAId || "",
        taxaIVAPercentagem: parseFloat(linha.taxaIVAPercentagem || 23),
        base,
        valorIVA,
        ordem: index + 1,
      };
    });

    const fatura = await db.faturaFornecedor.create({
      data: {
        numeroFatura,
        fornecedorId,
        fornecedorNome: fornecedor.nome,
        fornecedorNif: fornecedor.nif,
        dataFatura: new Date(dataFatura),
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        totalBase,
        totalIVA,
        totalLiquido: totalBase + totalIVA,
        encomendaCompraId: encomendaCompraId || null,
        observacoes,
        utilizadorId: utilizadorId || "system",
        linhas: {
          create: linhasProcessadas,
        },
      },
      include: {
        linhas: true,
      },
    });

    return NextResponse.json(fatura, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar fatura de fornecedor:", error);
    return NextResponse.json(
      { error: "Erro ao registar fatura de fornecedor" },
      { status: 500 }
    );
  }
}
