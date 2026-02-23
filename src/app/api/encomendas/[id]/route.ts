import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { reservarStock, libertarStock } from "@/lib/stock";
import { EstadoEncomendaCliente } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.user?.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const encomenda = await db.encomendaCliente.findFirst({
      where: {
        id,
        empresaId: auth.user.empresaId
      },
      include: {
        cliente: true,
        linhas: true,
      },
    });

    if (!encomenda) return NextResponse.json({ error: "Encomenda não encontrada" }, { status: 404 });

    return NextResponse.json(encomenda);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar encomenda" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.user?.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const encomendaAntiga = await db.encomendaCliente.findFirst({
      where: { id, empresaId: auth.user.empresaId },
      include: { linhas: true }
    });

    if (!encomendaAntiga) {
      return NextResponse.json({ error: "Encomenda não encontrada" }, { status: 404 });
    }

    const encomenda = await db.$transaction(async (tx) => {
      const atualizada = await tx.encomendaCliente.update({
        where: { id },
        data: body,
      });

      // Lógica de Reserva de Stock
      if (body.estado === EstadoEncomendaCliente.CONFIRMADA && encomendaAntiga.estado !== EstadoEncomendaCliente.CONFIRMADA) {
        // Reservar stock
        const armazemPrincipal = await tx.armazem.findFirst({
          where: { empresaId: auth.user!.empresaId, principal: true }
        });

        if (armazemPrincipal) {
          for (const linha of encomendaAntiga.linhas) {
            if (linha.artigoId) {
              await reservarStock({
                artigoId: linha.artigoId,
                armazemId: armazemPrincipal.id,
                quantidade: linha.quantidade
              }, tx);
            }
          }
        }
      } else if (body.estado === EstadoEncomendaCliente.CANCELADA && encomendaAntiga.estado === EstadoEncomendaCliente.CONFIRMADA) {
        // Libertar stock se estava confirmada
        const armazemPrincipal = await tx.armazem.findFirst({
          where: { empresaId: auth.user!.empresaId, principal: true }
        });

        if (armazemPrincipal) {
          for (const linha of encomendaAntiga.linhas) {
            if (linha.artigoId) {
              await libertarStock({
                artigoId: linha.artigoId,
                armazemId: armazemPrincipal.id,
                quantidade: linha.quantidade
              }, tx);
            }
          }
        }
      }

      return atualizada;
    });

    return NextResponse.json(encomenda);
  } catch (error) {
    console.error("Erro ao atualizar encomenda:", error);
    return NextResponse.json({ error: "Erro ao atualizar encomenda" }, { status: 500 });
  }
}
