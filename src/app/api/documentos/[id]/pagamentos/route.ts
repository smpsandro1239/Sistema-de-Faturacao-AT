import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoPagamento } from "@prisma/client";

/**
 * GET - Listar pagamentos de um documento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!db.pagamento) {
      return NextResponse.json({ error: "Tabela de pagamentos não disponível" }, { status: 503 });
    }

    const pagamentos = await db.pagamento.findMany({
      where: { documentoId: id },
      orderBy: { data: "desc" },
    });

    return NextResponse.json(pagamentos);
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error);
    return NextResponse.json({ error: "Erro ao buscar pagamentos" }, { status: 500 });
  }
}

/**
 * POST - Registar um novo pagamento para um documento
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { valor, metodo, data, referencia, observacoes } = body;

    if (!valor || !metodo) {
      return NextResponse.json({ error: "Valor e método são obrigatórios" }, { status: 400 });
    }

    const documento = await db.documento.findUnique({
      where: { id },
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    // Criar o pagamento em transação para garantir consistência
    const result = await db.$transaction(async (tx) => {
      const novoPagamento = await tx.pagamento.create({
        data: {
          documentoId: id,
          valor: parseFloat(String(valor)),
          metodo,
          data: data ? new Date(data) : new Date(),
          referencia: referencia || null,
          observacoes: observacoes || null,
        },
      });

      // Recalcular total pago
      const todosPagamentos = await tx.pagamento.findMany({
        where: { documentoId: id },
      });

      const totalPago = todosPagamentos.reduce((acc, p) => acc + p.valor, 0);

      let novoEstado: EstadoPagamento = "PENDENTE";
      if (totalPago >= documento.totalLiquido - 0.01) { // Margem para arredondamentos
        novoEstado = "PAGO";
      } else if (totalPago > 0) {
        novoEstado = "PARCIAL";
      }

      await tx.documento.update({
        where: { id },
        data: {
          estadoPagamento: novoEstado,
          updatedAt: new Date(),
        },
      });

      return novoPagamento;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Erro ao registar pagamento:", error);
    return NextResponse.json({
      error: "Erro ao registar pagamento: " + (error instanceof Error ? error.message : "Erro desconhecido")
    }, { status: 500 });
  }
}
