/**
 * API de Encomenda de Compra Individual
 * Sistema de Faturação Certificado pela AT
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoEncomendaCompra } from "@prisma/client";
import { entradaStockRececao } from "@/lib/stock";

// GET - Obter encomenda de compra por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const encomenda = await db.encomendaCompra.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        armazemDestino: true,
        linhas: {
          include: {
            artigo: {
              include: {
                taxaIVA: true,
              },
            },
          },
          orderBy: { ordem: "asc" },
        },
        movimentosStock: {
          include: {
            artigo: {
              select: { codigo: true, descricao: true },
            },
            armazem: {
              select: { codigo: true, nome: true },
            },
          },
        },
      },
    });

    if (!encomenda) {
      return NextResponse.json(
        { error: "Encomenda não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(encomenda);
  } catch (error) {
    console.error("Erro ao buscar encomenda:", error);
    return NextResponse.json(
      { error: "Erro ao buscar encomenda" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar encomenda de compra
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      fornecedorId,
      armazemDestinoId,
      dataEntregaPrevista,
      observacoes,
      linhas,
      estado,
      utilizadorId,
    } = body;

    // Buscar encomenda existente
    const encomendaExistente = await db.encomendaCompra.findUnique({
      where: { id },
      include: { linhas: true },
    });

    if (!encomendaExistente) {
      return NextResponse.json(
        { error: "Encomenda não encontrada" },
        { status: 404 }
      );
    }

    // Não permitir edição de encomendas já recebidas ou canceladas
    if (
      encomendaExistente.estado === EstadoEncomendaCompra.RECEBIDA ||
      encomendaExistente.estado === EstadoEncomendaCompra.CANCELADA
    ) {
      return NextResponse.json(
        { error: "Não é possível editar uma encomenda recebida ou cancelada" },
        { status: 400 }
      );
    }

    // Atualizar estado se fornecido
    if (estado && estado !== encomendaExistente.estado) {
      const estadosValidos = Object.values(EstadoEncomendaCompra);
      if (!estadosValidos.includes(estado)) {
        return NextResponse.json(
          { error: "Estado inválido" },
          { status: 400 }
        );
      }

      const encomendaAtualizada = await db.encomendaCompra.update({
        where: { id },
        data: {
          estado: estado as EstadoEncomendaCompra,
          updatedAt: new Date(),
        },
        include: {
          fornecedor: true,
          linhas: { include: { artigo: true } },
        },
      });

      return NextResponse.json(encomendaAtualizada);
    }

    // Atualizar campos básicos
    const dadosAtualizacao: {
      armazemDestinoId?: string | null;
      dataEntregaPrevista?: Date | null;
      observacoes?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (armazemDestinoId !== undefined) {
      dadosAtualizacao.armazemDestinoId = armazemDestinoId || null;
    }

    if (dataEntregaPrevista !== undefined) {
      dadosAtualizacao.dataEntregaPrevista = dataEntregaPrevista
        ? new Date(dataEntregaPrevista)
        : null;
    }

    if (observacoes !== undefined) {
      dadosAtualizacao.observacoes = observacoes;
    }

    // Se há linhas para atualizar, recalcular totais
    if (linhas && Array.isArray(linhas)) {
      // Buscar taxa IVA padrão
      const taxaIVAPadrao = await db.taxaIVA.findFirst({
        where: { codigo: "NOR" },
      });

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

      // Eliminar linhas existentes e criar novas
      await db.$transaction(async (tx) => {
        await tx.linhaEncomendaCompra.deleteMany({
          where: { encomendaCompraId: id },
        });

        await tx.encomendaCompra.update({
          where: { id },
          data: {
            ...dadosAtualizacao,
            totalBase,
            totalIVA,
            totalLiquido: totalBase + totalIVA,
            linhas: {
              create: linhasProcessadas,
            },
          },
        });
      });

      const encomendaAtualizada = await db.encomendaCompra.findUnique({
        where: { id },
        include: {
          fornecedor: true,
          linhas: { include: { artigo: true } },
        },
      });

      return NextResponse.json(encomendaAtualizada);
    }

    // Atualização sem alterar linhas
    const encomendaAtualizada = await db.encomendaCompra.update({
      where: { id },
      data: dadosAtualizacao,
      include: {
        fornecedor: true,
        linhas: { include: { artigo: true } },
      },
    });

    return NextResponse.json(encomendaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar encomenda:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar encomenda" },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar encomenda de compra
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const encomenda = await db.encomendaCompra.findUnique({
      where: { id },
    });

    if (!encomenda) {
      return NextResponse.json(
        { error: "Encomenda não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se pode ser cancelada
    if (encomenda.estado === EstadoEncomendaCompra.RECEBIDA) {
      return NextResponse.json(
        { error: "Não é possível cancelar uma encomenda já recebida" },
        { status: 400 }
      );
    }

    if (encomenda.estado === EstadoEncomendaCompra.CANCELADA) {
      return NextResponse.json(
        { error: "A encomenda já está cancelada" },
        { status: 400 }
      );
    }

    // Marcar como cancelada
    const encomendaCancelada = await db.encomendaCompra.update({
      where: { id },
      data: {
        estado: EstadoEncomendaCompra.CANCELADA,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(encomendaCancelada);
  } catch (error) {
    console.error("Erro ao cancelar encomenda:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar encomenda" },
      { status: 500 }
    );
  }
}
