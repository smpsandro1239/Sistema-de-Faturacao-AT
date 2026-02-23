import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [
      empresa,
      clientes,
      artigos,
      documentos,
      series,
      armazens,
      stock,
      movimentos,
      fornecedores,
      pagamentos,
      auditoria
    ] = await Promise.all([
      db.empresa.findFirst(),
      db.cliente.findMany(),
      db.artigo.findMany(),
      db.documento.findMany({ include: { linhas: true } }),
      db.serie.findMany(),
      db.armazem.findMany(),
      db.artigoArmazemStock.findMany(),
      db.movimentoStock.findMany(),
      db.fornecedor.findMany(),
      db.pagamento.findMany(),
      db.auditoria.findMany({ take: 100, orderBy: { createdAt: 'desc' } })
    ]);

    const backupData = {
      versao: "1.0",
      dataExportacao: new Date().toISOString(),
      entidades: {
        empresa,
        clientes,
        artigos,
        documentos,
        series,
        armazens,
        stock,
        movimentos,
        fornecedores,
        pagamentos,
        auditoria
      }
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=faturaat_backup_${new Date().toISOString().split('T')[0]}.json`
      }
    });
  } catch (error) {
    console.error("Erro no backup:", error);
    return NextResponse.json({ error: "Erro ao gerar backup" }, { status: 500 });
  }
}
