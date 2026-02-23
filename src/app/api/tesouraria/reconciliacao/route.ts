import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const movimentos = await db.movimentoBancario.findMany({
      where: { conciliado: false },
      orderBy: { data: 'desc' }
    });

    const faturasPendentes = await db.documento.findMany({
      where: {
        estado: "EMITIDO",
        estadoPagamento: { in: ["PENDENTE", "PARCIAL"] }
      },
      include: { pagamentos: true },
      orderBy: { dataEmissao: 'asc' }
    });

    return NextResponse.json({ movimentos, faturasPendentes });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { movimentoId, documentoId, dataPagamento, metodo } = await request.json();

    const movimento = await db.movimentoBancario.findUnique({ where: { id: movimentoId } });
    const documento = await db.documento.findUnique({ where: { id: documentoId } });

    if (!movimento || !documento) {
      return NextResponse.json({ error: "Movimento ou Documento não encontrado" }, { status: 404 });
    }

    // Criar pagamento real
    const pagamento = await db.pagamento.create({
      data: {
        documentoId,
        valor: movimento.valor,
        data: new Date(dataPagamento || movimento.data),
        metodo: metodo || "TRANSFERENCIA",
        referencia: movimento.referencia,
        observacoes: `Conciliação bancária: ${movimento.descricao}`
      }
    });

    // Marcar movimento como conciliado
    await db.movimentoBancario.update({
      where: { id: movimentoId },
      data: {
        conciliado: true,
        pagamentoId: pagamento.id
      }
    });

    // Verificar se a fatura foi totalmente paga
    const totalPago = (await db.pagamento.aggregate({
      where: { documentoId },
      _sum: { valor: true }
    }))._sum.valor || 0;

    if (totalPago >= documento.totalLiquido) {
      await db.documento.update({
        where: { id: documentoId },
        data: { estadoPagamento: "PAGO" }
      });
    } else {
      await db.documento.update({
        where: { id: documentoId },
        data: { estadoPagamento: "PARCIAL" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao reconciliar" }, { status: 500 });
  }
}
