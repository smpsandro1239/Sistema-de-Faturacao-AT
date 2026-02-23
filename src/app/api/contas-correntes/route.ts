import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Agregação de fornecedores (Usando valorPago acumulado na FaturaCompra)
    const saldosFornecedores = await db.faturaCompra.groupBy({
      by: ['fornecedorId', 'fornecedorNome', 'fornecedorNif'],
      where: {
        OR: [
          { valorPago: { lt: db.faturaCompra.fields.totalLiquido } }
        ]
      },
      _sum: {
        totalLiquido: true,
        valorPago: true,
      },
      _count: {
        id: true,
      },
    });

    const fornecedores = saldosFornecedores.map(f => ({
      id: f.fornecedorId,
      nome: f.fornecedorNome,
      nif: f.fornecedorNif,
      saldo: (f._sum.totalLiquido || 0) - (f._sum.valorPago || 0),
      contagem: f._count.id,
    })).filter(f => f.saldo > 0);

    // Agregação de clientes (Vendas)
    // Para clientes é mais complexo pois o valorPago não está denormalizado no Documento
    // Por agora, otimizamos buscando apenas documentos com saldo (simplificado)
    const documentosPendentes = await db.documento.findMany({
      where: {
        estado: "EMITIDO",
      },
      select: {
        clienteId: true,
        clienteNome: true,
        clienteNif: true,
        totalLiquido: true,
        pagamentos: {
          select: { valor: true }
        }
      }
    });

    const clientesMap: Record<string, any> = {};
    documentosPendentes.forEach((d) => {
      const totalPago = d.pagamentos.reduce((sum, p) => sum + p.valor, 0);
      const saldo = d.totalLiquido - totalPago;
      if (saldo > 0) {
        if (!clientesMap[d.clienteId]) {
          clientesMap[d.clienteId] = {
            id: d.clienteId,
            nome: d.clienteNome,
            nif: d.clienteNif,
            saldo: 0,
            contagem: 0,
          };
        }
        clientesMap[d.clienteId].saldo += saldo;
        clientesMap[d.clienteId].contagem += 1;
      }
    });

    const clientes = Object.values(clientesMap);

    return NextResponse.json({
      fornecedores,
      clientes,
      resumo: {
        totalPagar: fornecedores.reduce((sum, f) => sum + f.saldo, 0),
        totalReceber: clientes.reduce((sum, c) => sum + c.saldo, 0),
      }
    });
  } catch (error) {
    console.error("Erro na agregação de contas correntes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
