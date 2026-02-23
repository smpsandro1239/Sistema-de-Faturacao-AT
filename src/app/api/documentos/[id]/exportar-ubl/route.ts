import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gerarXMLCiusPT } from "@/lib/cius-pt";
import { authenticateRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;

    const documento = await db.documento.findUnique({
      where: { id },
      include: { cliente: true, linhas: true }
    });

    if (!documento) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });

    const empresa = await db.empresa.findFirst();
    if (!empresa) return NextResponse.json({ error: "Empresa não configurada" }, { status: 400 });

    const ciusDoc = {
      numero: documento.numeroFormatado,
      data: documento.dataEmissao || documento.createdAt,
      tipo: documento.tipo,
      moeda: "EUR",
      emissor: {
        nif: empresa.nif,
        nome: empresa.nome,
        morada: empresa.morada,
        cpostal: empresa.codigoPostal,
        localidade: empresa.localidade,
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
    };

    const xml = gerarXMLCiusPT(ciusDoc);

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename=cius-pt-${documento.numeroFormatado.replace(/\//g, '-')}.xml`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar CIUS-PT:", error);
    return NextResponse.json({ error: "Erro interno ao gerar XML" }, { status: 500 });
  }
}
