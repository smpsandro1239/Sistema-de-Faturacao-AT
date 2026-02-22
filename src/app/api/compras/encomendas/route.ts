/**
 * API de Encomendas de Compra
 * Sistema de Faturação Certificado pela AT
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoEncomendaCompra } from "@prisma/client";

// GET - Listar encomendas de compra
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
      ...(estado && { estado: estado as EstadoEncomendaCompra }),
      ...(fornecedorId && { fornecedorId }),
      ...(search && {
        OR: [
          { numeroFormatado: { contains: search } },
          { fornecedorNome: { contains: search } },
        ],
      }),
    };

    // Verificar se o modelo existe
    if (!db.encomendaCompra) {
      return NextResponse.json({
        encomendas: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const [encomendas, total] = await Promise.all([
      db.encomendaCompra.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          fornecedor: {
            select: {
              id: true,
              codigo: true,
              nome: true,
              nif: true,
            },
          },
          armazemDestino: {
            select: {
              id: true,
              codigo: true,
              nome: true,
            },
          },
          linhas: {
            include: {
              artigo: {
                select: {
                  id: true,
                  codigo: true,
                  descricao: true,
                },
              },
            },
          },
        },
      }),
      db.encomendaCompra.count({ where }),
    ]);

    return NextResponse.json({
      encomendas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar encomendas de compra:", error);
    return NextResponse.json(
      { error: "Erro ao buscar encomendas de compra" },
      { status: 500 }
    );
  }
}

// POST - Criar nova encomenda de compra
export async function POST(request: NextRequest) {
  try {
    // Verificar se o modelo existe
    if (!db.encomendaCompra) {
      return NextResponse.json(
        { error: "Sistema de compras não inicializado. Execute o seed da base de dados." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      fornecedorId,
      armazemDestinoId,
      dataEntregaPrevista,
      observacoes,
      linhas,
      utilizadorId,
    } = body;

    // Validações
    if (!fornecedorId) {
      return NextResponse.json(
        { error: "Fornecedor é obrigatório" },
        { status: 400 }
      );
    }

    if (!linhas || linhas.length === 0) {
      return NextResponse.json(
        { error: "A encomenda deve ter pelo menos uma linha" },
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

    // Obter próximo número
    const anoAtual = new Date().getFullYear();
    const ultimaEncomenda = await db.encomendaCompra.findFirst({
      where: {
        numeroFormatado: { contains: `${anoAtual}` },
      },
      orderBy: { numero: "desc" },
    });

    const proximoNumero = (ultimaEncomenda?.numero || 0) + 1;
    const numeroFormatado = `EC ${anoAtual}/${String(proximoNumero).padStart(5, "0")}`;

    // Buscar taxa IVA padrão
    const taxaIVAPadrao = await db.taxaIVA.findFirst({
      where: { codigo: "NOR" },
    });

    // Calcular totais e processar linhas
    let totalBase = 0;
    let totalIVA = 0;

    const linhasProcessadas = await Promise.all(
      linhas.map(async (linha: { 
        artigoId?: string; 
        codigoArtigo?: string;
        descricaoArtigo?: string;
        quantidade: number; 
        precoUnitario: number; 
        desconto?: number;
        taxaIVAId?: string;
      }, index: number) => {
        const { artigoId, quantidade, precoUnitario, desconto = 0 } = linha;

        // Buscar artigo se especificado
        let artigo = null;
        if (artigoId) {
          artigo = await db.artigo.findUnique({
            where: { id: artigoId },
            include: { taxaIVA: true },
          });
        }

        const base = quantidade * precoUnitario - desconto;
        const taxaIVA = artigo?.taxaIVA || taxaIVAPadrao;
        const taxaIVAPercentagem = taxaIVA?.taxa || 23;
        const valorIVA = base * (taxaIVAPercentagem / 100);

        totalBase += base;
        totalIVA += valorIVA;

        return {
          artigoId: artigoId || null,
          codigoArtigo: artigo?.codigo || linha.codigoArtigo || "",
          descricaoArtigo: artigo?.descricao || linha.descricaoArtigo || "",
          quantidade: parseFloat(String(quantidade)),
          quantidadeRecebida: 0,
          precoUnitario: parseFloat(String(precoUnitario)),
          desconto: parseFloat(String(desconto)),
          taxaIVAId: taxaIVA?.id || linha.taxaIVAId || taxaIVAPadrao?.id || "",
          taxaIVAPercentagem,
          base,
          valorIVA,
          ordem: index + 1,
        };
      })
    );

    // Criar encomenda
    const encomenda = await db.encomendaCompra.create({
      data: {
        numero: proximoNumero,
        numeroFormatado,
        fornecedorId,
        fornecedorNome: fornecedor.nome,
        fornecedorNif: fornecedor.nif,
        fornecedorMorada: fornecedor.morada,
        dataEntregaPrevista: dataEntregaPrevista ? new Date(dataEntregaPrevista) : null,
        armazemDestinoId: armazemDestinoId || null,
        observacoes,
        totalBase,
        totalIVA,
        totalLiquido: totalBase + totalIVA,
        utilizadorId: utilizadorId || "system",
        linhas: {
          create: linhasProcessadas,
        },
      },
      include: {
        fornecedor: true,
        linhas: {
          include: {
            artigo: true,
          },
        },
      },
    });

    return NextResponse.json(encomenda, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar encomenda de compra:", error);
    return NextResponse.json(
      { error: "Erro ao criar encomenda de compra" },
      { status: 500 }
    );
  }
}
