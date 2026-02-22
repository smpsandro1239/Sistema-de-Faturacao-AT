/**
 * API para alterar estado da Encomenda de Compra
 * Sistema de Faturação Certificado pela AT
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoEncomendaCompra } from "@prisma/client";

// PATCH - Alterar estado da encomenda
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado, utilizadorId } = body;

    if (!estado) {
      return NextResponse.json(
        { error: "Estado é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se encomenda existe
    const encomenda = await db.encomendaCompra.findUnique({
      where: { id },
    });

    if (!encomenda) {
      return NextResponse.json(
        { error: "Encomenda não encontrada" },
        { status: 404 }
      );
    }

    // Validar transições de estado permitidas
    const transicoesPermitidas: Record<EstadoEncomendaCompra, EstadoEncomendaCompra[]> = {
      [EstadoEncomendaCompra.RASCUNHO]: [EstadoEncomendaCompra.ENVIADA, EstadoEncomendaCompra.CANCELADA],
      [EstadoEncomendaCompra.ENVIADA]: [EstadoEncomendaCompra.CONFIRMADA, EstadoEncomendaCompra.CANCELADA],
      [EstadoEncomendaCompra.CONFIRMADA]: [EstadoEncomendaCompra.PARCIALMENTE_RECEBIDA, EstadoEncomendaCompra.CANCELADA],
      [EstadoEncomendaCompra.PARCIALMENTE_RECEBIDA]: [EstadoEncomendaCompra.RECEBIDA, EstadoEncomendaCompra.CANCELADA],
      [EstadoEncomendaCompra.RECEBIDA]: [], // Estado final
      [EstadoEncomendaCompra.CANCELADA]: [], // Estado final
    };

    const novoEstado = estado as EstadoEncomendaCompra;
    if (!transicoesPermitidas[encomenda.estado].includes(novoEstado)) {
      return NextResponse.json(
        { error: `Transição de ${encomenda.estado} para ${novoEstado} não permitida` },
        { status: 400 }
      );
    }

    // Atualizar estado
    const encomendaAtualizada = await db.encomendaCompra.update({
      where: { id },
      data: {
        estado: novoEstado,
        updatedAt: new Date(),
      },
      include: {
        fornecedor: true,
        linhas: true,
      },
    });

    // Registar na auditoria
    await db.auditoria.create({
      data: {
        utilizadorId: utilizadorId || "system",
        acao: "UPDATE",
        entidade: "EncomendaCompra",
        entidadeId: id,
        valorAntigo: JSON.stringify({ estado: encomenda.estado }),
        valorNovo: JSON.stringify({ estado: novoEstado }),
      },
    });

    return NextResponse.json(encomendaAtualizada);
  } catch (error) {
    console.error("Erro ao alterar estado da encomenda:", error);
    return NextResponse.json(
      { error: "Erro ao alterar estado da encomenda" },
      { status: 500 }
    );
  }
}
