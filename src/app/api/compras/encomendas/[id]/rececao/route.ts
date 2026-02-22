/**
 * API de Receção de Encomenda de Compra
 * Entrada de stock automática
 * Sistema de Faturação Certificado pela AT
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoEncomendaCompra } from "@prisma/client";
import { entradaStockRececao } from "@/lib/stock";

// POST - Receber encomenda (entrada de stock)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { armazemId, linhasRececao, utilizadorId, observacoes } = body;

    // Validar armazém
    if (!armazemId) {
      return NextResponse.json(
        { error: "Armazém de destino é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar encomenda
    const encomenda = await db.encomendaCompra.findUnique({
      where: { id },
      include: {
        linhas: {
          include: {
            artigo: true,
          },
        },
        armazemDestino: true,
      },
    });

    if (!encomenda) {
      return NextResponse.json(
        { error: "Encomenda não encontrada" },
        { status: 404 }
      );
    }

    // Verificar estado
    if (
      encomenda.estado === EstadoEncomendaCompra.RECEBIDA ||
      encomenda.estado === EstadoEncomendaCompra.CANCELADA
    ) {
      return NextResponse.json(
        { error: "Esta encomenda não pode ser recebida" },
        { status: 400 }
      );
    }

    // Verificar armazém
    const armazem = await db.armazem.findUnique({
      where: { id: armazemId },
    });

    if (!armazem || !armazem.ativo) {
      return NextResponse.json(
        { error: "Armazém não encontrado ou inativo" },
        { status: 400 }
      );
    }

    // Processar linhas de receção
    const linhasProcessadas: {
      linhaId: string;
      artigoId: string | null;
      quantidadeRecebida: number;
      precoUnitario: number;
    }[] = [];

    // Se não há linhas específicas, receber tudo
    const linhasAReceber = linhasRececao || encomenda.linhas.map(l => ({
      linhaId: l.id,
      quantidade: l.quantidade - l.quantidadeRecebida,
    }));

    let todasRecebidas = true;

    for (const linhaRec of linhasAReceber) {
      const linhaOriginal = encomenda.linhas.find(l => l.id === linhaRec.linhaId);
      
      if (!linhaOriginal) {
        continue;
      }

      const quantidadeAReceber = parseFloat(String(linhaRec.quantidade)) || 0;
      const quantidadePendente = linhaOriginal.quantidade - linhaOriginal.quantidadeRecebida;

      if (quantidadeAReceber <= 0) {
        continue;
      }

      if (quantidadeAReceber > quantidadePendente) {
        return NextResponse.json(
          { error: `Quantidade a receber (${quantidadeAReceber}) excede a pendente (${quantidadePendente}) na linha ${linhaOriginal.descricaoArtigo}` },
          { status: 400 }
        );
      }

      // Atualizar quantidade recebida na linha
      await db.linhaEncomendaCompra.update({
        where: { id: linhaOriginal.id },
        data: {
          quantidadeRecebida: linhaOriginal.quantidadeRecebida + quantidadeAReceber,
        },
      });

      linhasProcessadas.push({
        linhaId: linhaOriginal.id,
        artigoId: linhaOriginal.artigoId,
        quantidadeRecebida: quantidadeAReceber,
        precoUnitario: linhaOriginal.precoUnitario,
      });

      // Verificar se ainda há quantidade pendente
      if (linhaOriginal.quantidadeRecebida + quantidadeAReceber < linhaOriginal.quantidade) {
        todasRecebidas = false;
      }
    }

    // Filtrar linhas com artigo válido para stock
    const linhasStock = linhasProcessadas
      .filter(l => l.artigoId)
      .map(l => ({
        artigoId: l.artigoId!,
        quantidade: l.quantidadeRecebida,
        precoUnitario: l.precoUnitario,
      }));

    // Registrar entrada de stock
    if (linhasStock.length > 0) {
      await entradaStockRececao({
        linhas: linhasStock,
        armazemId,
        encomendaCompraId: id,
        utilizadorId: utilizadorId || "system",
      });
    }

    // Atualizar estado da encomenda
    const novoEstado = todasRecebidas
      ? EstadoEncomendaCompra.RECEBIDA
      : EstadoEncomendaCompra.PARCIALMENTE_RECEBIDA;

    const encomendaAtualizada = await db.encomendaCompra.update({
      where: { id },
      data: {
        estado: novoEstado,
        dataRececao: todasRecebidas ? new Date() : encomenda.dataRececao,
        updatedAt: new Date(),
      },
      include: {
        fornecedor: true,
        linhas: {
          include: {
            artigo: true,
          },
        },
        armazemDestino: true,
      },
    });

    // Registrar auditoria
    await db.auditoria.create({
      data: {
        utilizadorId: utilizadorId || "system",
        acao: "UPDATE",
        entidade: "EncomendaCompra",
        entidadeId: id,
        valorAntigo: JSON.stringify({ estado: encomenda.estado }),
        valorNovo: JSON.stringify({
          estado: novoEstado,
          linhasRecebidas: linhasProcessadas.length,
          armazemRececao: armazem.nome,
        }),
      },
    });

    return NextResponse.json({
      message: "Receção registada com sucesso",
      encomenda: encomendaAtualizada,
      linhasRecebidas: linhasProcessadas.length,
      stockEntrada: linhasStock.length,
    });
  } catch (error) {
    console.error("Erro ao receber encomenda:", error);
    return NextResponse.json(
      { error: "Erro ao receber encomenda: " + (error instanceof Error ? error.message : "Erro desconhecido") },
      { status: 500 }
    );
  }
}
