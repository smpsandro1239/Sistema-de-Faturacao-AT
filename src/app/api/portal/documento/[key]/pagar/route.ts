import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fireWebhooks } from "@/lib/webhooks";

// POST - Simular pagamento de um documento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await request.json().catch(() => ({}));
    const { metodo } = body;

    const documento = await db.documento.findFirst({
      where: { accessKey: key, estado: "EMITIDO" },
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    if (documento.estadoPagamento === "PAGO") {
      return NextResponse.json({ error: "Documento já está pago" }, { status: 400 });
    }

    // Simulação de processamento externo (ex: Stripe)
    // Em produção, aqui receberíamos o webhook do Stripe e validaríamos

    const documentoAtualizado = await db.documento.update({
      where: { id: documento.id },
      data: {
        estadoPagamento: "PAGO",
        metodoPagamento: metodo === 'MBWAY' ? 'NUMERARIO' : 'CARTAO_CREDITO', // Mapeamento simplificado
      },
      include: {
        cliente: true,
      }
    });

    // Registar pagamento na tabela de pagamentos
    await db.pagamento.create({
      data: {
        documentoId: documento.id,
        metodo: metodo === 'MBWAY' ? 'NUMERARIO' : 'CARTAO_CREDITO',
        valor: documento.totalLiquido,
        observacoes: `Pagamento via Portal do Cliente (${metodo || 'Mock'})`,
      }
    });

    // Disparar Webhook
    fireWebhooks("DOCUMENTO.PAGO", documentoAtualizado).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no pagamento:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
