import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoPagamento, MetodoPagamento } from "@prisma/client";

// POST - Registar pagamento para um documento de venda
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { valor, metodo, referencia, data, observacoes } = body;

    if (!valor || !metodo) {
      return NextResponse.json({ error: "Valor e método são obrigatórios" }, { status: 400 });
    }

    const documento = await db.documento.findUnique({
      where: { id },
      include: { pagamentos: true }
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    if (documento.estado === "RASCUNHO") {
      return NextResponse.json({ error: "Não é possível registar pagamentos em rascunhos" }, { status: 400 });
    }

    const pagamento = await db.$transaction(async (tx) => {
      // Criar registo de pagamento
      const p = await tx.pagamento.create({
        data: {
          documentoId: id,
          valor: parseFloat(String(valor)),
          metodo: metodo as MetodoPagamento,
          referencia,
          data: data ? new Date(data) : new Date(),
          observacoes,
        },
      });

      // Calcular total pago até agora
      const totalPagoAnterior = documento.pagamentos.reduce((sum, p) => sum + p.valor, 0);
      const novoTotalPago = totalPagoAnterior + parseFloat(String(valor));

      // Atualizar estado de pagamento do documento
      let novoEstado = EstadoPagamento.PARCIAL;
      if (novoTotalPago >= documento.totalLiquido) {
        novoEstado = EstadoPagamento.PAGO;
      }

      await tx.documento.update({
        where: { id },
        data: {
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

// GET - Listar pagamentos de um documento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pagamentos = await db.pagamento.findMany({
      where: { documentoId: id },
      orderBy: { data: 'desc' }
    });
    return NextResponse.json(pagamentos);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar pagamentos" }, { status: 500 });
  }
}
