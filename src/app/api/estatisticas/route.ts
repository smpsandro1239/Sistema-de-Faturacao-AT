import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Stock baixo - função local para evitar problemas de importação
async function obterArtigosStockBaixo() {
  try {
    const stocks = await db.artigoArmazemStock.findMany({
      where: {
        quantidade: { gt: 0 },
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

    return stocks
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
  } catch {
    // Retornar array vazio se a tabela não existir ainda
    return [];
  }
}

// GET - Obter estatísticas para o dashboard
export async function GET() {
  try {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

    // Documentos emitidos hoje
    const documentosHoje = await db.documento.count({
      where: {
        estado: "EMITIDO",
        dataEmissao: { gte: inicioHoje },
      },
    });

    // Total faturado no mês
    const documentosMes = await db.documento.aggregate({
      where: {
        estado: "EMITIDO",
        dataEmissao: { gte: inicioMes },
      },
      _sum: { totalLiquido: true },
    });

    // Total faturado no mês anterior
    const documentosMesAnterior = await db.documento.aggregate({
      where: {
        estado: "EMITIDO",
        dataEmissao: { 
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
      },
      _sum: { totalLiquido: true },
    });

    // Clientes ativos
    const clientesAtivos = await db.cliente.count({
      where: { ativo: true },
    });

    // Documentos pendentes (rascunhos)
    const documentosPendentes = await db.documento.count({
      where: { estado: "RASCUNHO" },
    });

    // Documentos recentes
    const documentosRecentes = await db.documento.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    // Calcular variação percentual
    const totalMesAtual = documentosMes._sum.totalLiquido || 0;
    const totalMesAnterior = documentosMesAnterior._sum.totalLiquido || 0;
    const variacaoMensal = totalMesAnterior > 0 
      ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100 
      : 0;

    // Dados para gráfico de vendas mensais (últimos 6 meses)
    const vendasMensais = [];
    for (let i = 5; i >= 0; i--) {
      const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0);
      
      const total = await db.documento.aggregate({
        where: {
          estado: "EMITIDO",
          dataEmissao: {
            gte: dataInicio,
            lte: dataFim,
          },
        },
        _sum: { totalLiquido: true },
      });

      const nomeMes = dataInicio.toLocaleDateString('pt-PT', { month: 'short' });
      vendasMensais.push({
        mes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
        total: total._sum.totalLiquido || 0,
      });
    }

    // Dados para gráfico por tipo de documento
    const documentosPorTipo = await db.documento.groupBy({
      by: ['tipo'],
      where: { estado: "EMITIDO" },
      _count: { id: true },
      _sum: { totalLiquido: true },
    });

    const tipoLabels: Record<string, string> = {
      FATURA: "Faturas",
      FATURA_RECIBO: "Faturas-Recibo",
      NOTA_CREDITO: "Notas de Crédito",
      NOTA_DEBITO: "Notas de Débito",
    };

    const vendasPorTipo = documentosPorTipo.map(item => ({
      tipo: tipoLabels[item.tipo] || item.tipo,
      quantidade: item._count.id,
      total: item._sum.totalLiquido || 0,
    }));

    // Dados para gráfico de IVA
    const documentosComIVA = await db.documento.findMany({
      where: {
        estado: "EMITIDO",
        dataEmissao: { gte: inicioMes },
      },
      include: {
        linhas: {
          select: {
            taxaIVAPercentagem: true,
            base: true,
            valorIVA: true,
          },
        },
      },
    });

    // Agrupar IVA por taxa
    const ivaPorTaxa: Record<number, { base: number; iva: number }> = {};
    documentosComIVA.forEach(doc => {
      doc.linhas.forEach(linha => {
        if (!ivaPorTaxa[linha.taxaIVAPercentagem]) {
          ivaPorTaxa[linha.taxaIVAPercentagem] = { base: 0, iva: 0 };
        }
        ivaPorTaxa[linha.taxaIVAPercentagem].base += linha.base;
        ivaPorTaxa[linha.taxaIVAPercentagem].iva += linha.valorIVA;
      });
    });

    const ivaResumo = Object.entries(ivaPorTaxa)
      .map(([taxa, valores]) => ({
        taxa: `${taxa}%`,
        base: valores.base,
        iva: valores.iva,
      }))
      .sort((a, b) => parseFloat(b.taxa) - parseFloat(a.taxa));

    // Stock baixo
    const artigosStockBaixo = await obterArtigosStockBaixo();

    // Vendas por Cliente (Top 5)
    const vendasPorCliente = await db.documento.groupBy({
      by: ['clienteId', 'clienteNome'],
      where: { estado: "EMITIDO" },
      _sum: { totalLiquido: true },
      orderBy: { _sum: { totalLiquido: 'desc' } },
      take: 5,
    });

    // Vendas por Artigo (Top 5)
    const vendasPorArtigo = await db.linhaDocumento.groupBy({
      by: ['artigoId', 'descricaoArtigo'],
      where: { documento: { estado: "EMITIDO" } },
      _sum: { totalLiquido: true, quantidade: true },
      orderBy: { _sum: { totalLiquido: 'desc' } },
      take: 5,
    });

    // Fornecedores ativos
    let fornecedoresAtivos = 0;
    try {
      fornecedoresAtivos = await db.fornecedor.count({
        where: { ativo: true },
      });
    } catch {
      // Tabela pode não existir
    }

    // Armazéns ativos
    let armazensAtivos = 0;
    try {
      armazensAtivos = await db.armazem.count({
        where: { ativo: true },
      });
    } catch {
      // Tabela pode não existir
    }

    return NextResponse.json({
      faturasHoje: documentosHoje,
      totalFaturadoMes: totalMesAtual,
      variacaoMensal: variacaoMensal.toFixed(1),
      clientesAtivos,
      documentosPendentes,
      documentosRecentes: documentosRecentes.map(doc => ({
        id: doc.numeroFormatado,
        cliente: doc.clienteNome,
        valor: doc.totalLiquido,
        estado: doc.estado,
        data: doc.dataEmissao ? doc.dataEmissao.toISOString().split("T")[0] : null,
      })),
      vendasMensais,
      vendasPorTipo,
      vendasPorCliente: vendasPorCliente.map(c => ({
        nome: c.clienteNome,
        total: c._sum.totalLiquido || 0,
      })),
      vendasPorArtigo: vendasPorArtigo.map(a => ({
        nome: a.descricaoArtigo,
        quantidade: a._sum.quantidade || 0,
        total: a._sum.totalLiquido || 0,
      })),
      ivaResumo,
      stockBaixo: artigosStockBaixo,
      fornecedoresAtivos,
      armazensAtivos,
    });
  } catch (error) {
    console.error("Erro ao obter estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao obter estatísticas" },
      { status: 500 }
    );
  }
}
