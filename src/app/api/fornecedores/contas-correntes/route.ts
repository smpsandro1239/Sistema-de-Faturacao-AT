import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const fornecedores = await db.fornecedor.findMany({
      include: {
        faturasCompra: {
          include: {
            pagamentos: true
          }
        }
      }
    });

    const contasCorrentes = fornecedores.map(f => {
      const totalFaturado = f.faturasCompra.reduce((sum, fat) => sum + fat.totalLiquido, 0);
      const totalPago = f.faturasCompra.reduce((sum, fat) => sum + fat.valorPago, 0);
      const saldo = totalFaturado - totalPago;

      return {
        id: f.id,
        nome: f.nome,
        nif: f.nif,
        totalFaturado,
        totalPago,
        saldo,
        numeroFaturas: f.faturasCompra.length,
        numeroPendentes: f.faturasCompra.filter(fat => fat.estadoPagamento !== "PAGO").length
      };
    });

    return NextResponse.json(contasCorrentes);
  } catch (error) {
    console.error("Erro ao calcular contas correntes fornecedores:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
