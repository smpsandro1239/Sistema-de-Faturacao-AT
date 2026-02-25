import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { gerarPDFDocumento } from "@/lib/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const documento = await db.documento.findUnique({
      where: { id, empresaId: auth.user.empresaId },
      include: {
        linhas: true,
      },
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    const empresa = await db.empresa.findUnique({
      where: { id: auth.user.empresaId! }
    });

    if (!empresa) {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Gerar PDF
    const pdfBuffer = await gerarPDFDocumento({
      ...documento,
      dataEmissao: documento.dataEmissao ? documento.dataEmissao.toISOString() : null,
      empresaNome: empresa.nome,
      empresaNif: empresa.nif,
      empresaMorada: empresa.morada,
      empresaCodigoPostal: empresa.codigoPostal,
      empresaLocalidade: empresa.localidade,
      logo: empresa.logo,
      linhas: documento.linhas.map((l: any) => ({
        codigoArtigo: l.codigoArtigo,
        descricaoArtigo: l.descricaoArtigo,
        quantidade: l.quantidade,
        precoUnitario: l.precoUnitario,
        taxaIVAPercentagem: l.taxaIVAPercentagem,
        base: l.base,
        valorIVA: l.valorIVA,
      })),
    }, false) as Uint8Array;

    const fileName = `${documento.numeroFormatado.replace(/\//g, "-")}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao descarregar PDF:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
