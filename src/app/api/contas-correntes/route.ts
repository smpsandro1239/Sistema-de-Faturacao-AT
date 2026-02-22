import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Buscar faturas de compra e pagamentos
    const faturasCompra = await db.faturaCompra.findMany({
      include: { pagamentos: true },
    });

    // Buscar documentos (vendas) e pagamentos
    const documentosVenda = await db.documento.findMany({
      where: { estado: "EMITIDO" },
      include: { pagamentos: true },
    });

    // Agrupar saldos fornecedores
    const fornecedoresMap: Record<string, any> = {};
    faturasCompra.forEach((f) => {
      const saldo = f.totalLiquido - f.valorPago;
      if (saldo > 0) {
        if (!fornecedoresMap[f.fornecedorId]) {
          fornecedoresMap[f.fornecedorId] = {
            id: f.fornecedorId,
            nome: f.fornecedorNome,
            nif: f.fornecedorNif,
            saldo: 0,
            contagem: 0,
          };
        }
        fornecedoresMap[f.fornecedorId].saldo += saldo;
        fornecedoresMap[f.fornecedorId].contagem += 1;
      }
    });

    // Agrupar saldos clientes
    const clientesMap: Record<string, any> = {};
    documentosVenda.forEach((d) => {
      const totalPago = d.pagamentos?.reduce((sum, p) => sum + p.valor, 0) || 0;
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

    return NextResponse.json({
      fornecedores: Object.values(fornecedoresMap),
      clientes: Object.values(clientesMap),
      resumo: {
        totalPagar: Object.values(fornecedoresMap).reduce((sum, f) => sum + f.saldo, 0),
        totalReceber: Object.values(clientesMap).reduce((sum, c) => sum + c.saldo, 0),
      }
    });
  } catch (error) {
    console.error("Erro na agregação de contas correntes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
