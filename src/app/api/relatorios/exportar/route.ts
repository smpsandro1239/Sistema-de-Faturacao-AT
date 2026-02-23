import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get("inicio");
    const dataFim = searchParams.get("fim");
    const formato = searchParams.get("formato") || "xlsx";

    const where: any = {
      estado: "EMITIDO",
    };

    if (dataInicio || dataFim) {
      where.dataEmissao = {};
      if (dataInicio) where.dataEmissao.gte = new Date(dataInicio);
      if (dataFim) where.dataEmissao.lte = new Date(dataFim);
    }

    const documentos = await db.documento.findMany({
      where,
      include: {
        linhas: true,
      },
      orderBy: { dataEmissao: "desc" },
    });

    const workbook = new ExcelJS.Workbook();

    // --- ABA 1: VENDAS ---
    const worksheet = workbook.addWorksheet("Vendas");

    worksheet.columns = [
      { header: "Número", key: "numero", width: 20 },
      { header: "Data", key: "data", width: 15 },
      { header: "Cliente", key: "cliente", width: 40 },
      { header: "NIF Cliente", key: "nif", width: 15 },
      { header: "Base Tributável", key: "base", width: 15 },
      { header: "Total IVA", key: "iva", width: 15 },
      { header: "Total Líquido", key: "total", width: 15 },
    ];

    documentos.forEach((doc) => {
      worksheet.addRow({
        numero: doc.numeroFormatado,
        data: doc.dataEmissao ? doc.dataEmissao.toLocaleDateString("pt-PT") : "",
        cliente: doc.clienteNome,
        nif: doc.clienteNif,
        base: doc.totalBase,
        iva: doc.totalIVA,
        total: doc.totalLiquido,
      });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getColumn("base").numFmt = "#,##0.00€";
    worksheet.getColumn("iva").numFmt = "#,##0.00€";
    worksheet.getColumn("total").numFmt = "#,##0.00€";

    // --- ABA 2: RESUMO IVA ---
    const worksheetIva = workbook.addWorksheet("Resumo IVA");
    worksheetIva.columns = [
      { header: "Taxa IVA", key: "taxa", width: 15 },
      { header: "Base Tributável", key: "base", width: 20 },
      { header: "Valor IVA", key: "valor", width: 20 },
    ];

    const ivaResumo: Record<number, { base: number; valor: number }> = {};
    documentos.forEach(doc => {
      doc.linhas.forEach(linha => {
        const taxa = linha.taxaIVAPercentagem;
        if (!ivaResumo[taxa]) ivaResumo[taxa] = { base: 0, valor: 0 };
        ivaResumo[taxa].base += linha.base;
        ivaResumo[taxa].valor += linha.valorIVA;
      });
    });

    Object.entries(ivaResumo).forEach(([taxa, totals]) => {
      worksheetIva.addRow({
        taxa: `${taxa}%`,
        base: totals.base,
        valor: totals.valor,
      });
    });

    worksheetIva.getRow(1).font = { bold: true };
    worksheetIva.getColumn("base").numFmt = "#,##0.00€";
    worksheetIva.getColumn("valor").numFmt = "#,##0.00€";

    if (formato === "csv") {
      const csvContent = await workbook.csv.writeBuffer();
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="vendas.csv"',
        },
      });
    } else {
      const buffer = await workbook.xlsx.writeBuffer();
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="vendas.xlsx"',
        },
      });
    }
  } catch (error) {
    console.error("Erro ao exportar relatório:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
