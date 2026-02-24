import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { gerarXMLCiusPT } from "@/lib/cius-pt";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.user?.empresaId) {
      return NextResponse.json({ error: auth.error || "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const documento = await db.documento.findFirst({
      where: {
        id,
        empresaId: auth.user.empresaId
      },
      include: {
        linhas: true,
      }
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    const xml = gerarXMLCiusPT({
      numero: documento.numeroFormatado,
      data: documento.dataEmissao || new Date(),
      tipo: documento.tipo,
      moeda: "EUR",
      emissor: {
        nif: documento.empresaNif,
        nome: documento.empresaNome,
        morada: documento.empresaMorada,
        cpostal: documento.empresaCodigoPostal,
        localidade: documento.empresaLocalidade,
      },
      receptor: {
        nif: documento.clienteNif,
        nome: documento.clienteNome,
        morada: documento.clienteMorada || undefined,
        cpostal: documento.clienteCodigoPostal || undefined,
        localidade: documento.clienteLocalidade || undefined,
      },
      linhas: documento.linhas.map(l => ({
        descricao: l.descricaoArtigo,
        quantidade: l.quantidade,
        precoUnitario: l.precoUnitario,
        taxaIVA: l.taxaIVAPercentagem,
        base: l.base,
      })),
      totalBase: documento.totalBase,
      totalIVA: documento.totalIVA,
      totalLiquido: documento.totalLiquido,
    });

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="ubl-${documento.numeroFormatado.replace(/\//g, '-')}.xml"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar UBL:", error);
    return NextResponse.json(
      { error: "Erro ao exportar UBL" },
      { status: 500 }
    );
  }
}
