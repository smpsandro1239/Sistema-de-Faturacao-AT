import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = auth.user.empresaId;

    // Obter stock atual de todos os artigos em todos os armazéns
    const stocks = await db.artigoArmazemStock.findMany({
      where: {
        artigo: { empresaId },
        armazem: { empresaId }
      },
      include: {
        artigo: true,
        armazem: true
      },
      orderBy: [
        { armazem: { nome: 'asc' } },
        { artigo: { codigo: 'asc' } }
      ]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Mapa de Stocks");

    worksheet.columns = [
      { header: "Armazém", key: "armazem", width: 20 },
      { header: "Código Artigo", key: "codigo", width: 15 },
      { header: "Descrição", key: "descricao", width: 40 },
      { header: "Unidade", key: "unidade", width: 10 },
      { header: "Quantidade", key: "quantidade", width: 15 },
      { header: "Reservado", key: "reservado", width: 15 },
      { header: "Disponível", key: "disponivel", width: 15 },
      { header: "Stock Mínimo", key: "minimo", width: 15 },
    ];

    // Formatação do cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    };

    stocks.forEach((s) => {
      worksheet.addRow({
        armazem: s.armazem.nome,
        codigo: s.artigo.codigo,
        descricao: s.artigo.descricao,
        unidade: s.artigo.unidade,
        quantidade: s.quantidade,
        reservado: s.quantidadeReservada,
        disponivel: s.quantidade - s.quantidadeReservada,
        minimo: s.artigo.stockMinimo || 0,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="mapa-de-stocks.xlsx"',
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de stock:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
