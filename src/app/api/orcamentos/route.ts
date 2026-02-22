/**
 * API de Orçamentos / Propostas
 * Sistema de Faturação Certificado pela AT
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoOrcamento } from "@prisma/client";

// GET - Listar orçamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const clienteId = searchParams.get("clienteId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where = {
      ...(estado && { estado: estado as EstadoOrcamento }),
      ...(clienteId && { clienteId }),
      ...(search && {
        OR: [
          { numeroFormatado: { contains: search } },
          { clienteNome: { contains: search } },
        ],
      }),
    };

    // Verificar se o modelo existe
    if (!db.orcamento) {
      return NextResponse.json({
        orcamentos: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const [orcamentos, total] = await Promise.all([
      db.orcamento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          cliente: {
            select: {
              id: true,
              codigo: true,
              nome: true,
              nif: true,
              email: true,
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
            orderBy: { ordem: "asc" },
          },
        },
      }),
      db.orcamento.count({ where }),
    ]);

    return NextResponse.json({
      orcamentos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar orçamentos" },
      { status: 500 }
    );
  }
}

// POST - Criar novo orçamento
export async function POST(request: NextRequest) {
  try {
    // Verificar se o modelo existe
    if (!db.orcamento) {
      return NextResponse.json(
        { error: "Sistema de orçamentos não inicializado." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      clienteId,
      dataValidade,
      observacoes,
      termosCondicoes,
      notasInternas,
      linhas,
      utilizadorId,
    } = body;

    // Validações
    if (!clienteId) {
      return NextResponse.json(
        { error: "Cliente é obrigatório" },
        { status: 400 }
      );
    }

    if (!linhas || linhas.length === 0) {
      return NextResponse.json(
        { error: "O orçamento deve ter pelo menos uma linha" },
        { status: 400 }
      );
    }

    // Buscar cliente
    const cliente = await db.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Obter próximo número
    const anoAtual = new Date().getFullYear();
    const ultimoOrcamento = await db.orcamento.findFirst({
      where: {
        numeroFormatado: { contains: `${anoAtual}` },
      },
      orderBy: { numero: "desc" },
    });

    const proximoNumero = (ultimoOrcamento?.numero || 0) + 1;
    const numeroFormatado = `ORC ${anoAtual}/${String(proximoNumero).padStart(5, "0")}`;

    // Buscar taxa IVA padrão
    const taxaIVAPadrao = await db.taxaIVA.findFirst({
      where: { codigo: "NOR" },
    });

    // Calcular totais e processar linhas
    let totalBase = 0;
    let totalIVA = 0;
    let totalDescontos = 0;

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
        totalDescontos += desconto;

        return {
          artigoId: artigoId || null,
          codigoArtigo: artigo?.codigo || linha.codigoArtigo || "",
          descricaoArtigo: artigo?.descricao || linha.descricaoArtigo || "",
          quantidade: parseFloat(String(quantidade)),
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

    // Criar orçamento
    const orcamento = await db.orcamento.create({
      data: {
        numero: proximoNumero,
        numeroFormatado,
        clienteId,
        clienteNome: cliente.nome,
        clienteNif: cliente.nif,
        clienteMorada: cliente.morada,
        clienteCodigoPostal: cliente.codigoPostal,
        clienteLocalidade: cliente.localidade,
        dataValidade: dataValidade ? new Date(dataValidade) : null,
        observacoes,
        termosCondicoes,
        notasInternas,
        totalBase,
        totalIVA,
        totalDescontos,
        totalLiquido: totalBase + totalIVA,
        utilizadorId: utilizadorId || "system",
        linhas: {
          create: linhasProcessadas,
        },
      },
      include: {
        cliente: true,
        linhas: {
          include: {
            artigo: true,
          },
        },
      },
    });

    return NextResponse.json(orcamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar orçamento" },
      { status: 500 }
    );
  }
}
