import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";

// Função para calcular hash SHA-256 do documento
function calcularHash(documento: {
  dataEmissao: Date;
  tipo: string;
  numero: number;
  totalLiquido: number;
}): string {
  const dados = `${documento.dataEmissao.toISOString()}${documento.tipo}${documento.numero}${documento.totalLiquido.toFixed(2)}`;
  return createHash("sha256").update(dados).digest("hex");
}

// Função para gerar ATCUD
function gerarATCUD(codigoValidacaoSerie: string, numeroDocumento: number): string {
  return `${codigoValidacaoSerie}-${numeroDocumento}`;
}

// GET - Listar todos os documentos
export async function GET() {
  try {
    const documentos = await db.documento.findMany({
      include: {
        cliente: true,
        serie: true,
        linhas: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(documentos);
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar documentos" },
      { status: 500 }
    );
  }
}

// POST - Criar novo documento
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serieId, clienteId, utilizadorId, tipo, linhas, observacoes, documentoOriginalId } = body;

    // Buscar série
    const serie = await db.serie.findUnique({
      where: { id: serieId },
    });

    if (!serie) {
      return NextResponse.json(
        { error: "Série não encontrada." },
        { status: 400 }
      );
    }

    // Buscar cliente
    const cliente = await db.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 400 }
      );
    }

    // Buscar empresa (assumindo que existe apenas uma)
    const empresa = await db.empresa.findFirst();

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não configurada." },
        { status: 400 }
      );
    }

    // Incrementar número da série
    const novoNumero = serie.numeroAtual + 1;
    const numeroFormatado = `${serie.prefixo} ${serie.ano}/${String(novoNumero).padStart(5, "0")}`;

    // Calcular totais das linhas
    let totalBase = 0;
    let totalIVA = 0;
    let totalDescontos = 0;

    const linhasCalculadas = linhas.map((linha: {
      codigoArtigo: string;
      descricaoArtigo: string;
      quantidade: number;
      precoUnitario: number;
      desconto: number;
      taxaIVAPercentagem: number;
      artigoId?: string;
    }) => {
      const base = linha.quantidade * linha.precoUnitario - linha.desconto;
      const valorIVA = base * (linha.taxaIVAPercentagem / 100);
      
      totalBase += base;
      totalIVA += valorIVA;
      totalDescontos += linha.desconto;

      return {
        ...linha,
        base,
        valorIVA,
      };
    });

    const totalLiquido = totalBase + totalIVA;

    // Criar documento
    const documento = await db.documento.create({
      data: {
        numero: novoNumero,
        numeroFormatado,
        tipo,
        serieId,
        clienteId,
        utilizadorId: utilizadorId || "default",
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
        documentoOriginalId: documentoOriginalId || null,
        observacoes: observacoes || null,
        linhas: {
          create: linhasCalculadas.map((linha: {
            codigoArtigo: string;
            descricaoArtigo: string;
            quantidade: number;
            precoUnitario: number;
            desconto: number;
            taxaIVAPercentagem: number;
            base: number;
            valorIVA: number;
            artigoId?: string;
            taxaIVAId?: string;
          }, index: number) => ({
            codigoArtigo: linha.codigoArtigo,
            descricaoArtigo: linha.descricaoArtigo,
            quantidade: linha.quantidade,
            precoUnitario: linha.precoUnitario,
            desconto: linha.desconto,
            taxaIVAId: linha.taxaIVAId || "default",
            taxaIVAPercentagem: linha.taxaIVAPercentagem,
            base: linha.base,
            valorIVA: linha.valorIVA,
            ordem: index + 1,
            artigoId: linha.artigoId || null,
          })),
        },
      },
      include: {
        linhas: true,
      },
    });

    // Atualizar número da série
    await db.serie.update({
      where: { id: serieId },
      data: { 
        numeroAtual: novoNumero,
        bloqueado: true, // Bloquear série após primeiro uso
      },
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar documento:", error);
    return NextResponse.json(
      { error: "Erro ao criar documento" },
      { status: 500 }
    );
  }
}

// PATCH - Emitir documento (calcular hash e ATCUD)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    // Buscar documento
    const documento = await db.documento.findUnique({
      where: { id },
      include: { serie: true },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado." },
        { status: 404 }
      );
    }

    if (documento.estado !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Documento já foi emitido." },
        { status: 400 }
      );
    }

    // Buscar documento anterior da mesma série para encadear hash
    const documentoAnterior = await db.documento.findFirst({
      where: {
        serieId: documento.serieId,
        estado: "EMITIDO",
        id: { not: id },
      },
      orderBy: { dataEmissao: "desc" },
    });

    const dataEmissao = new Date();
    
    // Calcular hash
    const hash = calcularHash({
      dataEmissao,
      tipo: documento.tipo,
      numero: documento.numero,
      totalLiquido: documento.totalLiquido,
    });

    // Gerar ATCUD
    const atcud = documento.serie.codigoValidacaoAT
      ? gerarATCUD(documento.serie.codigoValidacaoAT, documento.numero)
      : null;

    // Atualizar documento
    const documentoEmitido = await db.documento.update({
      where: { id },
      data: {
        estado: "EMITIDO",
        dataEmissao,
        hash,
        hashDocumentoAnterior: documentoAnterior?.hash || null,
        atcud,
      },
    });

    return NextResponse.json(documentoEmitido);
  } catch (error) {
    console.error("Erro ao emitir documento:", error);
    return NextResponse.json(
      { error: "Erro ao emitir documento" },
      { status: 500 }
    );
  }
}
