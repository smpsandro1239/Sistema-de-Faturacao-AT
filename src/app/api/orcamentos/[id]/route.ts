/**
 * API de Orçamento Individual
 * Sistema de Faturação Certificado pela AT
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoOrcamento } from "@prisma/client";

// GET - Obter orçamento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!db.orcamento) {
      return NextResponse.json(
        { error: "Sistema de orçamentos não inicializado" },
        { status: 503 }
      );
    }

    const orcamento = await db.orcamento.findUnique({
      where: { id },
      include: {
        cliente: true,
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
      },
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(orcamento);
  } catch (error) {
    console.error("Erro ao buscar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar orçamento" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar orçamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      dataValidade,
      observacoes,
      termosCondicoes,
      notasInternas,
      linhas,
      estado,
      utilizadorId,
    } = body;

    if (!db.orcamento) {
      return NextResponse.json(
        { error: "Sistema de orçamentos não inicializado" },
        { status: 503 }
      );
    }

    // Buscar orçamento existente
    const orcamentoExistente = await db.orcamento.findUnique({
      where: { id },
      include: { linhas: true },
    });

    if (!orcamentoExistente) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    // Não permitir edição de orçamentos já convertidos ou rejeitados
    if (
      orcamentoExistente.estado === EstadoOrcamento.CONVERTIDO ||
      orcamentoExistente.estado === EstadoOrcamento.REJEITADO
    ) {
      return NextResponse.json(
        { error: "Não é possível editar um orçamento convertido ou rejeitado" },
        { status: 400 }
      );
    }

    // Atualizar estado se fornecido
    if (estado && estado !== orcamentoExistente.estado) {
      const estadosValidos = Object.values(EstadoOrcamento);
      if (!estadosValidos.includes(estado)) {
        return NextResponse.json(
          { error: "Estado inválido" },
          { status: 400 }
        );
      }

      const orcamentoAtualizado = await db.orcamento.update({
        where: { id },
        data: {
          estado: estado as EstadoOrcamento,
          updatedAt: new Date(),
        },
        include: {
          cliente: true,
          linhas: { include: { artigo: true } },
        },
      });

      return NextResponse.json(orcamentoAtualizado);
    }

    // Atualizar campos básicos
    const dadosAtualizacao: {
      dataValidade?: Date | null;
      observacoes?: string;
      termosCondicoes?: string;
      notasInternas?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (dataValidade !== undefined) {
      dadosAtualizacao.dataValidade = dataValidade ? new Date(dataValidade) : null;
    }

    if (observacoes !== undefined) {
      dadosAtualizacao.observacoes = observacoes;
    }

    if (termosCondicoes !== undefined) {
      dadosAtualizacao.termosCondicoes = termosCondicoes;
    }

    if (notasInternas !== undefined) {
      dadosAtualizacao.notasInternas = notasInternas;
    }

    // Se há linhas para atualizar, recalcular totais
    if (linhas && Array.isArray(linhas)) {
      // Buscar taxa IVA padrão
      const taxaIVAPadrao = await db.taxaIVA.findFirst({
        where: { codigo: "NOR" },
      });

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

      // Eliminar linhas existentes e criar novas
      await db.$transaction(async (tx) => {
        await db.linhaOrcamento.deleteMany({
          where: { orcamentoId: id },
        });

        await db.orcamento.update({
          where: { id },
          data: {
            ...dadosAtualizacao,
            totalBase,
            totalIVA,
            totalDescontos,
            totalLiquido: totalBase + totalIVA,
            linhas: {
              create: linhasProcessadas,
            },
          },
        });
      });

      const orcamentoAtualizado = await db.orcamento.findUnique({
        where: { id },
        include: {
          cliente: true,
          linhas: { include: { artigo: true } },
        },
      });

      return NextResponse.json(orcamentoAtualizado);
    }

    // Atualização sem alterar linhas
    const orcamentoAtualizado = await db.orcamento.update({
      where: { id },
      data: dadosAtualizacao,
      include: {
        cliente: true,
        linhas: { include: { artigo: true } },
      },
    });

    return NextResponse.json(orcamentoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar orçamento" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar orçamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!db.orcamento) {
      return NextResponse.json(
        { error: "Sistema de orçamentos não inicializado" },
        { status: 503 }
      );
    }

    const orcamento = await db.orcamento.findUnique({
      where: { id },
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    // Não permitir eliminar orçamentos já convertidos
    if (orcamento.estado === EstadoOrcamento.CONVERTIDO) {
      return NextResponse.json(
        { error: "Não é possível eliminar um orçamento já convertido" },
        { status: 400 }
      );
    }

    // Eliminar linhas e orçamento
    await db.$transaction(async () => {
      await db.linhaOrcamento.deleteMany({
        where: { orcamentoId: id },
      });

      await db.orcamento.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Orçamento eliminado com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao eliminar orçamento" },
      { status: 500 }
    );
  }
}
