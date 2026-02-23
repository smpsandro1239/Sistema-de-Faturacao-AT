import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoEncomendaCliente, EstadoDocumento, TipoDocumento } from "@prisma/client";
import { calcularHashDocumento, gerarATCUD } from "@/lib/hash";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serieId, utilizadorId } = body;

    const encomenda = await db.encomendaCliente.findUnique({
      where: { id },
      include: { linhas: true },
    });

    if (!encomenda) return NextResponse.json({ error: "Encomenda não encontrada" }, { status: 404 });
    if (encomenda.estado === EstadoEncomendaCliente.FATURADA) {
      return NextResponse.json({ error: "Encomenda já foi faturada" }, { status: 400 });
    }

    // Buscar série
    const serie = await db.serie.findFirst({
      where: {
        id: serieId || undefined,
        tipoDocumento: { in: [TipoDocumento.FATURA, TipoDocumento.FATURA_RECIBO] },
        ativo: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!serie) return NextResponse.json({ error: "Série de faturação não encontrada" }, { status: 400 });

    const empresa = await db.empresa.findFirst();
    if (!empresa) return NextResponse.json({ error: "Empresa não configurada" }, { status: 400 });

    // Buscar último documento DA MESMA SÉRIE para hash
    const ultimoDocumento = await db.documento.findFirst({
      where: {
        serieId: serie.id,
        estado: EstadoDocumento.EMITIDO
      },
      orderBy: { dataEmissao: "desc" },
    });

    const proximoNumero = serie.numeroAtual + 1;
    const numeroFormatado = `${serie.prefixo} ${serie.ano}/${String(proximoNumero).padStart(5, "0")}`;
    const dataEmissao = new Date();
    const dataCriacao = new Date();

    const atcud = gerarATCUD(serie.codigoValidacaoAT || "", proximoNumero);
    const hash = calcularHashDocumento({
      numeroDocumento: numeroFormatado,
      dataEmissao,
      dataCriacao,
      totalLiquido: encomenda.totalLiquido,
      hashAnterior: ultimoDocumento?.hash || null,
    });

    const documento = await db.$transaction(async (tx) => {
      await tx.serie.update({
        where: { id: serie.id },
        data: {
          numeroAtual: proximoNumero,
          bloqueado: true
        },
      });

      const doc = await tx.documento.create({
        data: {
          numero: proximoNumero,
          numeroFormatado,
          tipo: serie.tipoDocumento,
          serieId: serie.id,
          clienteId: encomenda.clienteId,
          utilizadorId: utilizadorId || "system",
          clienteNome: encomenda.clienteNome,
          clienteNif: encomenda.clienteNif,
          empresaNome: empresa.nome,
          empresaNif: empresa.nif,
          empresaMorada: empresa.morada || "",
          empresaCodigoPostal: empresa.codigoPostal || "",
          empresaLocalidade: empresa.localidade || "",
          totalBase: encomenda.totalBase,
          totalIVA: encomenda.totalIVA,
          totalLiquido: encomenda.totalLiquido,
          hash,
          hashDocumentoAnterior: ultimoDocumento?.hash || null,
          atcud,
          dataEmissao,
          dataCriacao,
          estado: EstadoDocumento.EMITIDO,
          estadoPagamento: serie.tipoDocumento === TipoDocumento.FATURA_RECIBO ? "PAGO" : "PENDENTE",
          linhas: {
            create: encomenda.linhas.map((l) => ({
              artigoId: l.artigoId,
              codigoArtigo: l.codigoArtigo,
              descricaoArtigo: l.descricaoArtigo,
              quantidade: l.quantidade,
              precoUnitario: l.precoUnitario,
              desconto: l.desconto,
              taxaIVAId: l.taxaIVAId,
              taxaIVAPercentagem: l.taxaIVAPercentagem,
              base: l.base,
              valorIVA: l.valorIVA,
              ordem: l.ordem,
            })),
          },
        },
      });

      await tx.encomendaCliente.update({
        where: { id },
        data: {
          estado: EstadoEncomendaCliente.FATURADA,
          documentoId: doc.id,
        },
      });

      return doc;
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error) {
    console.error("Erro ao converter encomenda:", error);
    return NextResponse.json({ error: "Erro interno: " + (error instanceof Error ? error.message : "") }, { status: 500 });
  }
}
