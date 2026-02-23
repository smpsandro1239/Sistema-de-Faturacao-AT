import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoEncomendaCliente, EstadoDocumento, TipoDocumento } from "@prisma/client";
import { calcularHashDocumento, gerarATCUD } from "@/lib/hash";
import { libertarStock, saidaStockFatura } from "@/lib/stock";

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

    const ultimoDocumento = await db.documento.findFirst({
      where: { tipo: { in: [TipoDocumento.FATURA, TipoDocumento.FATURA_RECIBO] } },
      orderBy: { numero: "desc" },
    });

    const proximoNumero = serie.numeroAtual + 1;
    const numeroFormatado = `${serie.prefixo} ${serie.ano}/${String(proximoNumero).padStart(5, "0")}`;
    const atcud = gerarATCUD(serie.codigoValidacaoAT || "0", proximoNumero);
    const hash = calcularHashDocumento({
      numeroDocumento: numeroFormatado,
      dataEmissao: new Date(),
      totalLiquido: encomenda.totalLiquido,
      hashAnterior: ultimoDocumento?.hash || null,
      tipoDocumento: serie.tipoDocumento,
    });

    const documento = await db.$transaction(async (tx) => {
      await tx.serie.update({
        where: { id: serie.id },
        data: { numeroAtual: proximoNumero },
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
          empresaMorada: empresa.morada,
          empresaCodigoPostal: empresa.codigoPostal,
          empresaLocalidade: empresa.localidade,
          totalBase: encomenda.totalBase,
          totalIVA: encomenda.totalIVA,
          totalLiquido: encomenda.totalLiquido,
          hash,
          hashDocumentoAnterior: ultimoDocumento?.hash || null,
          atcud,
          dataEmissao: new Date(),
          estado: EstadoDocumento.EMITIDO,
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

      // Libertar stock reservado e fazer a saída real
      const armazemPrincipal = await tx.armazem.findFirst({ where: { principal: true } });
      if (armazemPrincipal) {
        for (const linha of encomenda.linhas) {
          if (linha.artigoId) {
            await libertarStock({
              artigoId: linha.artigoId,
              armazemId: armazemPrincipal.id,
              quantidade: linha.quantidade
            });
          }
        }

        // Saída real de stock
        const linhasStock = encomenda.linhas
          .filter(l => l.artigoId)
          .map(l => ({
            artigoId: l.artigoId!,
            quantidade: l.quantidade,
            precoUnitario: l.precoUnitario,
          }));

        if (linhasStock.length > 0) {
          await saidaStockFatura({
            linhas: linhasStock,
            armazemId: armazemPrincipal.id,
            documentoId: doc.id,
            utilizadorId: doc.utilizadorId,
          });
        }
      }

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
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
