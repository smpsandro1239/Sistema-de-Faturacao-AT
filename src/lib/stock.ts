/**
 * Biblioteca de Gestão de Stock
 * Sistema de Faturação Certificado pela AT
 * 
 * Funções para gerir movimentos de stock, verificar disponibilidade
 * e manter o controlo de inventário.
 */

import { db } from "@/lib/db";
import { TipoMovimentoStock, OrigemMovimentoStock } from "@prisma/client";

// ============================================
// INTERFACES
// ============================================

interface MovimentoStockParams {
  artigoId: string;
  armazemId: string;
  armazemDestinoId?: string; // Para transferências
  quantidade: number;
  tipo: TipoMovimentoStock;
  origem: OrigemMovimentoStock;
  precoUnitario?: number;
  documentoId?: string;
  encomendaCompraId?: string;
  utilizadorId: string;
  observacoes?: string;
}

interface VerificarStockParams {
  artigoId: string;
  armazemId: string;
  quantidade: number;
}

interface StockInfo {
  artigoId: string;
  armazemId: string;
  quantidade: number;
  quantidadeReservada: number;
  stockDisponivel: number;
  stockMinimo: number | null;
  stockMaximo: number | null;
  abaixoMinimo: boolean;
  acimaMaximo: boolean;
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Obter stock atual de um artigo num armazém
 */
export async function obterStockArtigo(artigoId: string, armazemId: string): Promise<StockInfo | null> {
  const stock = await db.artigoArmazemStock.findUnique({
    where: {
      artigoId_armazemId: { artigoId, armazemId },
    },
    include: {
      artigo: {
        select: { stockMinimo: true, stockMaximo: true },
      },
    },
  });

  if (!stock) {
    return null;
  }

  const stockDisponivel = stock.quantidade - stock.quantidadeReservada;

  return {
    artigoId: stock.artigoId,
    armazemId: stock.armazemId,
    quantidade: stock.quantidade,
    quantidadeReservada: stock.quantidadeReservada,
    stockDisponivel,
    stockMinimo: stock.artigo.stockMinimo,
    stockMaximo: stock.artigo.stockMaximo,
    abaixoMinimo: stock.artigo.stockMinimo !== null && stock.quantidade < stock.artigo.stockMinimo,
    acimaMaximo: stock.artigo.stockMaximo !== null && stock.quantidade > stock.artigo.stockMaximo,
  };
}

/**
 * Verificar se há stock disponível
 */
export async function verificarStockDisponivel(params: VerificarStockParams): Promise<boolean> {
  const stock = await obterStockArtigo(params.artigoId, params.armazemId);
  
  if (!stock) {
    return false;
  }

  return stock.stockDisponivel >= params.quantidade;
}

/**
 * Verificar stock para múltiplos artigos
 */
export async function verificarStockMultiplo(
  itens: VerificarStockParams[]
): Promise<{ artigoId: string; armazemId: string; disponivel: boolean; stockAtual: number; necessario: number }[]> {
  const resultados = await Promise.all(
    itens.map(async (item) => {
      const stock = await obterStockArtigo(item.artigoId, item.armazemId);
      return {
        artigoId: item.artigoId,
        armazemId: item.armazemId,
        disponivel: stock ? stock.stockDisponivel >= item.quantidade : false,
        stockAtual: stock?.stockDisponivel ?? 0,
        necessario: item.quantidade,
      };
    })
  );

  return resultados;
}

/**
 * Registar movimento de stock
 */
export async function registarMovimentoStock(params: MovimentoStockParams, tx?: any) {
  const prisma = tx || db;

  // Validar quantidade positiva
  if (params.quantidade <= 0) {
    throw new Error("A quantidade deve ser maior que zero");
  }

  // Obter ou criar registo de stock
  let stock = await prisma.artigoArmazemStock.findUnique({
    where: {
      artigoId_armazemId: {
        artigoId: params.artigoId,
        armazemId: params.armazemId,
      },
    },
  });

  if (!stock) {
    stock = await prisma.artigoArmazemStock.create({
      data: {
        artigoId: params.artigoId,
        armazemId: params.armazemId,
        quantidade: 0,
        quantidadeReservada: 0,
      },
    });
  }

  const quantidadeAnterior = stock.quantidade;
  let quantidadeFinal: number;

  // Calcular nova quantidade conforme tipo de movimento
  switch (params.tipo) {
    case "ENTRADA":
      quantidadeFinal = quantidadeAnterior + params.quantidade;
      break;
    case "SAIDA":
      if (quantidadeAnterior < params.quantidade) {
        throw new Error(`Stock insuficiente. Disponível: ${quantidadeAnterior}, Necessário: ${params.quantidade}`);
      }
      quantidadeFinal = quantidadeAnterior - params.quantidade;
      break;
    case "TRANSFERENCIA":
      if (quantidadeAnterior < params.quantidade) {
        throw new Error(`Stock insuficiente para transferência. Disponível: ${quantidadeAnterior}`);
      }
      quantidadeFinal = quantidadeAnterior - params.quantidade;
      break;
    default:
      throw new Error(`Tipo de movimento inválido: ${params.tipo}`);
  }

  // Calcular valor total
  const valorTotal = params.precoUnitario
    ? params.quantidade * params.precoUnitario
    : null;

  // Executar lógica
  const executar = async (currentPrisma: any) => {
    // Criar movimento
    const movimento = await currentPrisma.movimentoStock.create({
      data: {
        artigoId: params.artigoId,
        armazemId: params.armazemId,
        armazemDestinoId: params.armazemDestinoId,
        tipo: params.tipo,
        origem: params.origem,
        quantidade: params.quantidade,
        quantidadeAnterior,
        quantidadeFinal,
        precoUnitario: params.precoUnitario,
        valorTotal,
        documentoId: params.documentoId,
        encomendaCompraId: params.encomendaCompraId,
        observacoes: params.observacoes,
        utilizadorId: params.utilizadorId,
      },
    });

    // Atualizar stock no armazém de origem
    await currentPrisma.artigoArmazemStock.update({
      where: { id: stock!.id },
      data: { quantidade: quantidadeFinal },
    });

    // Se for transferência, atualizar armazém de destino
    if (params.tipo === "TRANSFERENCIA" && params.armazemDestinoId) {
      const stockDestino = await currentPrisma.artigoArmazemStock.findUnique({
        where: {
          artigoId_armazemId: {
            artigoId: params.artigoId,
            armazemId: params.armazemDestinoId,
          },
        },
      });

      const quantidadeDestinoAnterior = stockDestino?.quantidade ?? 0;
      const quantidadeDestinoFinal = quantidadeDestinoAnterior + params.quantidade;

      if (stockDestino) {
        await currentPrisma.artigoArmazemStock.update({
          where: { id: stockDestino.id },
          data: { quantidade: quantidadeDestinoFinal },
        });
      } else {
        await currentPrisma.artigoArmazemStock.create({
          data: {
            artigoId: params.artigoId,
            armazemId: params.armazemDestinoId,
            quantidade: params.quantidade,
            quantidadeReservada: 0,
          },
        });
      }
    }

    return movimento;
  };

  // Se já estamos numa transação, não abrir outra
  if (tx) {
    return executar(tx);
  } else {
    return db.$transaction(executar);
  }
}

/**
 * Saída de stock na emissão de fatura
 */
export async function saidaStockFatura(params: {
  linhas: { artigoId: string; quantidade: number; precoUnitario: number }[];
  armazemId: string;
  documentoId: string;
  utilizadorId: string;
}, tx?: any) {
  const prisma = tx || db;
  const resultados = [];

  for (const linha of params.linhas) {
    // Verificar se o artigo controla stock
    const artigo = await prisma.artigo.findUnique({
      where: { id: linha.artigoId },
      select: { controlaStock: true, tipo: true },
    });

    if (!artigo || !artigo.controlaStock || artigo.tipo === "SERVICO") {
      continue; // Ignorar artigos que não controlam stock ou serviços
    }

    const movimento = await registarMovimentoStock({
      artigoId: linha.artigoId,
      armazemId: params.armazemId,
      quantidade: linha.quantidade,
      tipo: "SAIDA",
      origem: "FATURA",
      precoUnitario: linha.precoUnitario,
      documentoId: params.documentoId,
      utilizadorId: params.utilizadorId,
      observacoes: "Saída por emissão de documento",
    }, tx);

    resultados.push(movimento);
  }

  return resultados;
}

/**
 * Entrada de stock na nota de crédito
 */
export async function entradaStockNotaCredito(params: {
  linhas: { artigoId: string; quantidade: number; precoUnitario: number }[];
  armazemId: string;
  documentoId: string;
  utilizadorId: string;
}, tx?: any) {
  const prisma = tx || db;
  const resultados = [];

  for (const linha of params.linhas) {
    // Verificar se o artigo controla stock
    const artigo = await prisma.artigo.findUnique({
      where: { id: linha.artigoId },
      select: { controlaStock: true, tipo: true },
    });

    if (!artigo || !artigo.controlaStock || artigo.tipo === "SERVICO") {
      continue;
    }

    const movimento = await registarMovimentoStock({
      artigoId: linha.artigoId,
      armazemId: params.armazemId,
      quantidade: linha.quantidade,
      tipo: "ENTRADA",
      origem: "NOTA_CREDITO",
      precoUnitario: linha.precoUnitario,
      documentoId: params.documentoId,
      utilizadorId: params.utilizadorId,
      observacoes: "Entrada por nota de crédito",
    }, tx);

    resultados.push(movimento);
  }

  return resultados;
}

/**
 * Entrada de stock por receção de compra
 */
export async function entradaStockRececao(params: {
  linhas: { artigoId: string; quantidade: number; precoUnitario: number }[];
  armazemId: string;
  encomendaCompraId: string;
  utilizadorId: string;
}, tx?: any) {
  const resultados = [];

  for (const linha of params.linhas) {
    const movimento = await registarMovimentoStock({
      artigoId: linha.artigoId,
      armazemId: params.armazemId,
      quantidade: linha.quantidade,
      tipo: "ENTRADA",
      origem: "ENCOMENDA_COMPRA",
      precoUnitario: linha.precoUnitario,
      encomendaCompraId: params.encomendaCompraId,
      utilizadorId: params.utilizadorId,
      observacoes: "Entrada por receção de encomenda de compra",
    }, tx);

    resultados.push(movimento);
  }

  return resultados;
}

/**
 * Obter artigos com stock baixo
 */
export async function obterArtigosStockBaixo(): Promise<{
  artigoId: string;
  artigoCodigo: string;
  artigoDescricao: string;
  armazemId: string;
  armazemNome: string;
  quantidadeAtual: number;
  stockMinimo: number;
}[]> {
  const stocks = await db.artigoArmazemStock.findMany({
    where: {
      quantidade: { gt: 0 }, // Apenas artigos com stock
    },
    include: {
      artigo: {
        select: {
          codigo: true,
          descricao: true,
          stockMinimo: true,
          controlaStock: true,
        },
      },
      armazem: {
        select: { nome: true, ativo: true },
      },
    },
  });

  // Filtrar artigos com stock abaixo do mínimo
  const artigosStockBaixo = stocks
    .filter((s) => 
      s.artigo.controlaStock &&
      s.artigo.stockMinimo !== null &&
      s.quantidade < s.artigo.stockMinimo &&
      s.armazem.ativo
    )
    .map((s) => ({
      artigoId: s.artigoId,
      artigoCodigo: s.artigo.codigo,
      artigoDescricao: s.artigo.descricao,
      armazemId: s.armazemId,
      armazemNome: s.armazem.nome,
      quantidadeAtual: s.quantidade,
      stockMinimo: s.artigo.stockMinimo!,
    }));

  return artigosStockBaixo;
}

/**
 * Obter histórico de movimentos
 */
export async function obterHistoricoMovimentos(params: {
  artigoId?: string;
  armazemId?: string;
  tipo?: TipoMovimentoStock;
  dataInicio?: Date;
  dataFim?: Date;
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where = {
    ...(params.artigoId && { artigoId: params.artigoId }),
    ...(params.armazemId && { armazemId: params.armazemId }),
    ...(params.tipo && { tipo: params.tipo }),
    ...(params.dataInicio && { createdAt: { gte: params.dataInicio } }),
    ...(params.dataFim && { createdAt: { lte: params.dataFim } }),
  };

  const [movimentos, total] = await Promise.all([
    db.movimentoStock.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        artigo: {
          select: { codigo: true, descricao: true },
        },
        armazem: {
          select: { codigo: true, nome: true },
        },
        armazemDestino: {
          select: { codigo: true, nome: true },
        },
        utilizador: {
          select: { nome: true },
        },
      },
    }),
    db.movimentoStock.count({ where }),
  ]);

  return {
    movimentos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Obter stock total por artigo (todos os armazéns)
 */
export async function obterStockTotalArtigo(artigoId: string): Promise<{
  artigoId: string;
  quantidadeTotal: number;
  quantidadeReservada: number;
  stockDisponivel: number;
  porArmazem: { armazemId: string; armazemNome: string; quantidade: number }[];
}> {
  const stocks = await db.artigoArmazemStock.findMany({
    where: { artigoId },
    include: {
      armazem: { select: { nome: true } },
    },
  });

  const quantidadeTotal = stocks.reduce((sum, s) => sum + s.quantidade, 0);
  const quantidadeReservada = stocks.reduce((sum, s) => sum + s.quantidadeReservada, 0);

  return {
    artigoId,
    quantidadeTotal,
    quantidadeReservada,
    stockDisponivel: quantidadeTotal - quantidadeReservada,
    porArmazem: stocks.map((s) => ({
      armazemId: s.armazemId,
      armazemNome: s.armazem.nome,
      quantidade: s.quantidade,
    })),
  };
}

/**
 * Reservar stock para uma encomenda
 */
export async function reservarStock(params: {
  artigoId: string;
  armazemId: string;
  quantidade: number;
}, tx?: any) {
  const prisma = tx || db;
  const stock = await prisma.artigoArmazemStock.findUnique({
    where: { artigoId_armazemId: { artigoId: params.artigoId, armazemId: params.armazemId } }
  });

  if (!stock) {
    throw new Error("Registo de stock não encontrado para reserva");
  }

  return prisma.artigoArmazemStock.update({
    where: { id: stock.id },
    data: {
      quantidadeReservada: stock.quantidadeReservada + params.quantidade
    }
  });
}

/**
 * Libertar stock reservado
 */
export async function libertarStock(params: {
  artigoId: string;
  armazemId: string;
  quantidade: number;
}, tx?: any) {
  const prisma = tx || db;
  const stock = await prisma.artigoArmazemStock.findUnique({
    where: { artigoId_armazemId: { artigoId: params.artigoId, armazemId: params.armazemId } }
  });

  if (!stock) return;

  const novaReserva = Math.max(0, stock.quantidadeReservada - params.quantidade);

  return prisma.artigoArmazemStock.update({
    where: { id: stock.id },
    data: {
      quantidadeReservada: novaReserva
    }
  });
}
