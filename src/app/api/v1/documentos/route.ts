import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, getApiKeyFromRequest } from "@/lib/api-auth";
import { calcularHashDocumento, gerarATCUD } from "@/lib/hash";
import { documentCreateSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const apiKey = getApiKeyFromRequest(request);
  const auth = await validateApiKey(apiKey);

  if (!auth.valid || !auth.empresaId) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const documentos = await db.documento.findMany({
      where: {
        empresaId: auth.empresaId
      },
      select: {
        id: true,
        numeroFormatado: true,
        tipo: true,
        clienteNome: true,
        totalLiquido: true,
        dataEmissao: true,
        estado: true,
        atcud: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(documentos);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const apiKey = getApiKeyFromRequest(request);
  const auth = await validateApiKey(apiKey);

  if (!auth.valid || !auth.empresaId || auth.apiKey.permissao !== "READ_WRITE") {
    return NextResponse.json({ error: "Não autorizado para escrita" }, { status: 401 });
  }

  try {
    const rawBody = await request.json();
    const result = documentCreateSchema.safeParse(rawBody);

    if (!result.success) {
      return NextResponse.json({
        error: "Dados inválidos",
        detalhes: result.error.errors
      }, { status: 400 });
    }

    const {
      serieId,
      clienteId,
      tipo,
      linhas,
      observacoes,
      metodoPagamento
    } = result.data;

    return await db.$transaction(async (tx) => {
      // 1. Buscar série com LOCK implicito por ser transação SQLite serializável
      const serie = await tx.serie.findFirst({
        where: {
          id: serieId,
          empresaId: auth.empresaId,
          ativo: true
        },
      });

      if (!serie) {
        throw new Error("Série não encontrada ou inativa");
      }

      // 2. Buscar cliente
      const cliente = await tx.cliente.findFirst({
        where: {
          id: clienteId,
          empresaId: auth.empresaId
        },
      });

      if (!cliente) {
        throw new Error("Cliente não encontrado");
      }

      // 3. Buscar empresa
      const empresa = await tx.empresa.findUnique({
        where: { id: auth.empresaId },
      });

      if (!empresa) {
        throw new Error("Empresa não configurada");
      }

      // 3.5 Resolver utilizador responsável (da API Key ou primeiro admin da empresa)
      let responsavelId = auth.apiKey.utilizadorId;
      if (!responsavelId) {
        const adminUser = await tx.utilizador.findFirst({
          where: { empresaId: auth.empresaId, perfil: "ADMIN" }
        });
        if (!adminUser) {
          throw new Error("Não foi encontrado um utilizador responsável na empresa para associar ao documento");
        }
        responsavelId = adminUser.id;
      }

      // 4. Buscar último documento da série para encadear hash
      const ultimoDocSérie = await tx.documento.findFirst({
        where: {
          empresaId: auth.empresaId,
          serieId: serieId,
          estado: "EMITIDO"
        },
        orderBy: { numero: "desc" }
      });

      // 5. Incrementar número da série
      const novoNumero = serie.numeroAtual + 1;
      const numeroFormatado = `${serie.prefixo} ${serie.ano}/${String(novoNumero).padStart(5, "0")}`;

      // 6. Calcular totais e processar linhas (Servidor recalcula tudo, não confia no payload para valores monetários)
      let totalBase = 0;
      let totalIVA = 0;
      let totalDescontos = 0;

      const linhasCalculadas = await Promise.all(linhas.map(async (linha, index) => {
        let artigo = null;
        if (linha.artigoId) {
          artigo = await tx.artigo.findFirst({
            where: { id: linha.artigoId, empresaId: auth.empresaId },
            include: { taxaIVA: true }
          });
        }

        // Buscar taxa de IVA oficial do sistema para validar percentagem
        const taxaOficial = await tx.taxaIVA.findUnique({
          where: { id: linha.taxaIVAId }
        });

        if (!taxaOficial) {
          throw new Error(`Taxa de IVA inválida: ${linha.taxaIVAId}`);
        }

        const percentagemIVA = taxaOficial.taxa;
        const base = (linha.quantidade * linha.precoUnitario) - linha.desconto;
        const valorIVA = base * (percentagemIVA / 100);

        totalBase += base;
        totalIVA += valorIVA;
        totalDescontos += linha.desconto;

        return {
          artigoId: linha.artigoId || null,
          codigoArtigo: artigo?.codigo || linha.codigoArtigo || "N/A",
          descricaoArtigo: artigo?.descricao || linha.descricaoArtigo || "N/A",
          quantidade: linha.quantidade,
          precoUnitario: linha.precoUnitario,
          desconto: linha.desconto,
          taxaIVAId: taxaOficial.id,
          taxaIVAPercentagem: percentagemIVA,
          base,
          valorIVA,
          ordem: index + 1
        };
      }));

      const totalLiquido = totalBase + totalIVA;
      const dataEmissao = new Date();

      // 7. Requisitos Fiscais (Hash e ATCUD)
      const hash = calcularHashDocumento({
        dataEmissao,
        tipoDocumento: tipo,
        numeroDocumento: numeroFormatado,
        totalLiquido,
        hashAnterior: ultimoDocSérie?.hash || null
      });

      const atcud = serie.codigoValidacaoAT
        ? gerarATCUD(serie.codigoValidacaoAT, novoNumero)
        : null;

      // 8. Criar documento
      const documento = await tx.documento.create({
        data: {
          empresaId: auth.empresaId,
          numero: novoNumero,
          numeroFormatado,
          tipo: tipo as any,
          serieId,
          clienteId,
          utilizadorId: responsavelId,
          clienteNome: cliente.nome,
          clienteNif: cliente.nif,
          clienteMorada: cliente.morada,
          clienteCodigoPostal: cliente.codigoPostal,
          clienteLocalidade: cliente.localidade,
          empresaNome: empresa.nome,
          empresaNif: empresa.nif,
          empresaMorada: empresa.morada,
          empresaCodigoPostal: empresa.codigoPostal,
          empresaLocalidade: empresa.localidade,
          totalBase,
          totalIVA,
          totalDescontos,
          totalLiquido,
          estado: "EMITIDO",
          dataEmissao,
          hash,
          hashDocumentoAnterior: ultimoDocSérie?.hash || null,
          atcud,
          estadoPagamento: tipo === "FATURA_RECIBO" ? "PAGO" : "PENDENTE",
          metodoPagamento: metodoPagamento || null,
          observacoes: observacoes || null,
          linhas: {
            create: linhasCalculadas
          }
        },
        include: {
          linhas: true
        }
      });

      // 9. Atualizar série
      await tx.serie.update({
        where: { id: serieId },
        data: { numeroAtual: novoNumero, bloqueado: true }
      });

      return NextResponse.json(documento, { status: 201 });
    });
  } catch (error) {
    console.error("Erro na API v1 documentos POST:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Erro interno ao criar documento"
    }, { status: 500 });
  }
}
