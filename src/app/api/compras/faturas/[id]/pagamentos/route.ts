import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoPagamento } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { valor, metodo, referencia, data } = body;

    if (!valor || !metodo) {
      return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
    }

    const fatura = await db.faturaCompra.findUnique({
      where: { id },
    });

    if (!fatura) {
      return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    }

    const pagamento = await db.$transaction(async (tx) => {
      // Criar pagamento
      const p = await tx.pagamentoCompra.create({
        data: {
          faturaCompraId: id,
          valor,
          metodo,
          referencia,
          data: data ? new Date(data) : new Date(),
        },
      });

      // Atualizar fatura
      const novoValorPago = fatura.valorPago + valor;
      let novoEstado = EstadoPagamento.PARCIAL;
      if (novoValorPago >= fatura.totalLiquido) {
        novoEstado = EstadoPagamento.PAGO;
      }

      await tx.faturaCompra.update({
        where: { id },
        data: {
          valorPago: novoValorPago,
          estadoPagamento: novoEstado,
        },
      });

      return p;
    });

    return NextResponse.json(pagamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao registar pagamento:", error);
    return NextResponse.json({ error: "Erro ao registar pagamento" }, { status: 500 });
  }
}
