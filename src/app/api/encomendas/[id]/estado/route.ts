import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservarStock, libertarStock } from "@/lib/stock";
import { EstadoEncomendaCliente } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { estado } = await request.json();

    const encomenda = await db.encomendaCliente.findUnique({
      where: { id },
      include: { linhas: true }
    });

    if (!encomenda) return NextResponse.json({ error: "Encomenda não encontrada" }, { status: 404 });

    const estadoAnterior = encomenda.estado;

    // Lógica de Reserva de Stock
    const armazemPrincipal = await db.armazem.findFirst({ where: { principal: true } });

    if (armazemPrincipal) {
      // 1. Se passar para CONFIRMADA ou EM_PREPARACAO, reservar stock (se não estava antes)
      const deveReservar = (estado === "CONFIRMADA" || estado === "EM_PREPARACAO") &&
                           (estadoAnterior === "RASCUNHO" || estadoAnterior === "CANCELADA");

      // 2. Se passar para CANCELADA, libertar stock (se estava reservado)
      const deveLibertar = (estado === "CANCELADA") &&
                           (estadoAnterior === "CONFIRMADA" || estadoAnterior === "EM_PREPARACAO");

      if (deveReservar) {
        for (const linha of encomenda.linhas) {
          if (linha.artigoId) {
            await reservarStock({
              artigoId: linha.artigoId,
              armazemId: armazemPrincipal.id,
              quantidade: linha.quantidade
            });
          }
        }
      } else if (deveLibertar) {
        for (const linha of encomenda.linhas) {
          if (linha.artigoId) {
            await libertarStock({
              artigoId: linha.artigoId,
              armazemId: armazemPrincipal.id,
              quantidade: linha.quantidade
            });
          }
        }
      }
    }

    const encomendaAtualizada = await db.encomendaCliente.update({
      where: { id },
      data: { estado: estado as EstadoEncomendaCliente },
    });

    return NextResponse.json(encomendaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar estado da encomenda:", error);
    return NextResponse.json({ error: "Erro ao atualizar estado" }, { status: 500 });
  }
}
