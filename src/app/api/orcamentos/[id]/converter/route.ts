/**
 * API de Conversão de Orçamento para Fatura
 * Sistema de Faturação Certificado pela AT
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoOrcamento, EstadoDocumento, TipoDocumento } from "@prisma/client";
import { calcularHashDocumento, gerarATCUD } from "@/lib/hash";
import { saidaStockFatura } from "@/lib/stock";

// POST - Converter orçamento em fatura
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serieId, utilizadorId, observacoes } = body;

    if (!db.orcamento || !db.documento) {
      return NextResponse.json(
        { error: "Sistema não inicializado" },
        { status: 503 }
      );
    }

    // Buscar orçamento
    const orcamento = await db.orcamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        linhas: {
          include: {
            artigo: true,
          },
          orderBy: { ordem: "asc" },
        },
      },
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    // Verificar estado
    if (orcamento.estado === EstadoOrcamento.CONVERTIDO) {
      return NextResponse.json(
        { error: "Este orçamento já foi convertido" },
        { status: 400 }
      );
    }

    if (orcamento.estado === EstadoOrcamento.REJEITADO) {
      return NextResponse.json(
        { error: "Não é possível converter um orçamento rejeitado" },
        { status: 400 }
      );
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

    if (!serie) {
      return NextResponse.json(
        { error: "Série de faturação não encontrada. Crie uma série ativa para faturas." },
        { status: 400 }
      );
    }

    // Buscar empresa
    const empresa = await db.empresa.findFirst();
    if (!empresa) {
      return NextResponse.json(
        { error: "Dados da empresa não configurados" },
        { status: 400 }
      );
    }

    // Próximo número
    const proximoNumero = serie.numeroAtual + 1;
    const numeroFormatado = `${serie.prefixo} ${serie.ano}/${String(proximoNumero).padStart(5, "0")}`;

    // Buscar último documento DA MESMA SÉRIE para hash
    const ultimoDocumento = await db.documento.findFirst({
      where: {
        serieId: serie.id,
        estado: EstadoDocumento.EMITIDO
      },
      orderBy: { dataEmissao: "desc" },
    });

    const dataEmissao = new Date();
    const dataCriacao = new Date();

    // Gerar ATCUD
    const atcud = gerarATCUD(serie.codigoValidacaoAT || "", proximoNumero);

    // Calcular hash
    const hash = calcularHashDocumento({
      dataEmissao,
      dataCriacao,
      numeroDocumento: numeroFormatado,
      totalLiquido: orcamento.totalLiquido,
      hashAnterior: ultimoDocumento?.hash || null,
    });

    // Criar documento com as linhas do orçamento
    const documento = await db.$transaction(async (tx) => {
      // Atualizar número da série
      await tx.serie.update({
        where: { id: serie.id },
        data: {
          numeroAtual: proximoNumero,
          bloqueado: true
        },
      });

      // Criar documento
      const novoDocumento = await tx.documento.create({
        data: {
          numero: proximoNumero,
          numeroFormatado,
          tipo: serie.tipoDocumento === TipoDocumento.FATURA_RECIBO 
            ? TipoDocumento.FATURA_RECIBO 
            : TipoDocumento.FATURA,
          serieId: serie.id,
          clienteId: orcamento.clienteId,
          utilizadorId: utilizadorId || "system",
          clienteNome: orcamento.clienteNome,
          clienteNif: orcamento.clienteNif,
          clienteMorada: orcamento.clienteMorada,
          clienteCodigoPostal: orcamento.clienteCodigoPostal,
          clienteLocalidade: orcamento.clienteLocalidade,
          empresaNome: empresa.nome,
          empresaNif: empresa.nif,
          empresaMorada: empresa.morada || "",
          empresaCodigoPostal: empresa.codigoPostal || "",
          empresaLocalidade: empresa.localidade || "",
          totalBase: orcamento.totalBase,
          totalIVA: orcamento.totalIVA,
          totalDescontos: orcamento.totalDescontos,
          totalLiquido: orcamento.totalLiquido,
          hash,
          hashDocumentoAnterior: ultimoDocumento?.hash || null,
          atcud,
          dataEmissao,
          dataCriacao,
          estado: EstadoDocumento.EMITIDO,
          estadoPagamento: serie.tipoDocumento === TipoDocumento.FATURA_RECIBO ? "PAGO" : "PENDENTE",
          observacoes: observacoes || `Convertido do orçamento ${orcamento.numeroFormatado}`,
          linhas: {
            create: orcamento.linhas.map((linha) => ({
              artigoId: linha.artigoId,
              codigoArtigo: linha.codigoArtigo,
              descricaoArtigo: linha.descricaoArtigo,
              quantidade: linha.quantidade,
              precoUnitario: linha.precoUnitario,
              desconto: linha.desconto,
              taxaIVAId: linha.taxaIVAId,
              taxaIVAPercentagem: linha.taxaIVAPercentagem,
              base: linha.base,
              valorIVA: linha.valorIVA,
              ordem: linha.ordem,
            })),
          },
        },
        include: {
          linhas: true,
        },
      });

      // Atualizar stock se houver armazém principal
      const armazemPrincipal = await tx.armazem.findFirst({ where: { principal: true } });
      if (armazemPrincipal) {
        const linhasStock = novoDocumento.linhas
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
            documentoId: novoDocumento.id,
            utilizadorId: novoDocumento.utilizadorId,
          });
        }
      }

      // Atualizar orçamento
      await tx.orcamento.update({
        where: { id },
        data: {
          estado: EstadoOrcamento.CONVERTIDO,
          documentoConvertidoId: novoDocumento.id,
          updatedAt: new Date(),
        },
      });

      return novoDocumento;
    });

    // Registar auditoria
    await db.auditoria.create({
      data: {
        utilizadorId: utilizadorId || "system",
        acao: "CREATE",
        entidade: "Documento",
        entidadeId: documento.id,
        valorNovo: JSON.stringify({
          tipo: documento.tipo,
          numero: documento.numeroFormatado,
          convertidoDe: orcamento.numeroFormatado,
        }),
      },
    });

    return NextResponse.json({
      message: "Orçamento convertido com sucesso",
      documento,
      orcamentoOriginal: orcamento.numeroFormatado,
    });
  } catch (error) {
    console.error("Erro ao converter orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao converter orçamento: " + (error instanceof Error ? error.message : "Erro desconhecido") },
      { status: 500 }
    );
  }
}
