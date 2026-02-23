import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoSubscricao, EstadoDocumento, TipoDocumento, FrequenciaSubscricao } from "@prisma/client";
import { calcularHashDocumento, gerarATCUD } from "@/lib/hash";
import { addWeeks, addMonths, addYears } from "date-fns";
import { authenticateRequest } from "@/lib/auth";
import { enviarEmailDocumento } from "@/lib/mail";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const hoje = new Date();

    // 1. Procurar subscrições ativas pendentes de emissão
    const subscricoes = await db.subscricao.findMany({
      where: {
        estado: EstadoSubscricao.ATIVA,
        proximaEmissao: { lte: hoje },
      },
      include: {
        linhas: true,
        serie: true,
      }
    });

    if (subscricoes.length === 0) {
      return NextResponse.json({ message: "Nenhuma subscrição pendente de processamento." });
    }

    const empresa = await db.empresa.findFirst();
    if (!empresa) return NextResponse.json({ error: "Empresa não configurada" }, { status: 400 });

    const resultados = [];

    // 2. Processar cada subscrição
    for (const sub of subscricoes) {
      try {
        // Buscar último documento DA MESMA SÉRIE para hash
        const ultimoDoc = await db.documento.findFirst({
          where: {
            serieId: sub.serieId,
            estado: EstadoDocumento.EMITIDO
          },
          orderBy: { dataEmissao: "desc" },
        });

        const proximoNumero = sub.serie.numeroAtual + 1;
        const numeroFormatado = `${sub.serie.prefixo} ${sub.serie.ano}/${String(proximoNumero).padStart(5, "0")}`;
        const dataEmissao = new Date();
        const dataCriacao = new Date();

        const atcud = gerarATCUD(sub.serie.codigoValidacaoAT || "", proximoNumero);
        const hash = calcularHashDocumento({
          numeroDocumento: numeroFormatado,
          dataEmissao,
          dataCriacao,
          totalLiquido: sub.totalLiquido,
          hashAnterior: ultimoDoc?.hash || null,
        });

        // Transação para criar documento e atualizar subscrição
        const documentoGerado = await db.$transaction(async (tx) => {
          // Criar Fatura
          const doc = await tx.documento.create({
            data: {
              numero: proximoNumero,
              numeroFormatado,
              tipo: sub.tipoDocumento,
              serieId: sub.serieId,
              clienteId: sub.clienteId,
              utilizadorId: "system",
              clienteNome: sub.clienteNome,
              clienteNif: sub.clienteNif,
              empresaNome: empresa.nome,
              empresaNif: empresa.nif,
              empresaMorada: empresa.morada || "",
              empresaCodigoPostal: empresa.codigoPostal || "",
              empresaLocalidade: empresa.localidade || "",
              totalBase: sub.totalBase,
              totalIVA: sub.totalIVA,
              totalLiquido: sub.totalLiquido,
              hash,
              hashDocumentoAnterior: ultimoDoc?.hash || null,
              atcud,
              dataEmissao,
              dataCriacao,
              estado: EstadoDocumento.EMITIDO,
              estadoPagamento: sub.tipoDocumento === TipoDocumento.FATURA_RECIBO ? "PAGO" : "PENDENTE",
              observacoes: `Fatura gerada automaticamente pela subscrição: ${sub.descricao}`,
              linhas: {
                create: sub.linhas.map((l) => ({
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
            include: {
              cliente: true,
              linhas: true,
            }
          });

          // Atualizar série
          await tx.serie.update({
            where: { id: sub.serieId },
            data: {
              numeroAtual: proximoNumero,
              bloqueado: true
            },
          });

          // Calcular próxima data
          let proxima = sub.proximaEmissao;
          switch (sub.frequencia) {
            case FrequenciaSubscricao.SEMANAL: proxima = addWeeks(proxima, 1); break;
            case FrequenciaSubscricao.MENSAL: proxima = addMonths(proxima, 1); break;
            case FrequenciaSubscricao.TRIMESTRAL: proxima = addMonths(proxima, 3); break;
            case FrequenciaSubscricao.SEMESTRAL: proxima = addMonths(proxima, 6); break;
            case FrequenciaSubscricao.ANUAL: proxima = addYears(proxima, 1); break;
          }

          // Se tiver data de fim e a próxima ultrapassar, marcar como CONCLUIDA
          let novoEstado = sub.estado;
          if (sub.dataFim && proxima > sub.dataFim) {
            novoEstado = EstadoSubscricao.CONCLUIDA;
          }

          // Atualizar subscrição
          await tx.subscricao.update({
            where: { id: sub.id },
            data: {
              ultimaEmissao: dataEmissao,
              proximaEmissao: proxima,
              estado: novoEstado,
            }
          });

          return doc;
        });

        // Envio Automático de Email se configurado no cliente
        if (documentoGerado.cliente.envioEmailAutomatico && documentoGerado.cliente.email) {
          enviarEmailDocumento(documentoGerado, documentoGerado.cliente.email).catch(console.error);
        }

        resultados.push({ id: sub.id, status: "sucesso", numero: numeroFormatado });
      } catch (err) {
        console.error(`Erro ao processar subscrição ${sub.id}:`, err);
        resultados.push({ id: sub.id, status: "erro", error: (err as Error).message });
      }
    }

    return NextResponse.json({
      message: "Processamento concluído",
      detalhes: resultados,
      total: subscricoes.length,
      sucesso: resultados.filter(r => r.status === "sucesso").length
    });
  } catch (error) {
    console.error("Erro no processamento de subscricoes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
