import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { obterArtigosStockBaixo } from "@/lib/stock";

// GET - Obter estatísticas para o dashboard
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = auth.user.empresaId;
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

    // Documentos emitidos hoje
    const documentosHoje = await db.documento.count({
      where: {
        empresaId,
        estado: "EMITIDO",
        dataEmissao: { gte: inicioHoje },
      },
    });

    // Total faturado no mês
    const documentosMes = await db.documento.aggregate({
      where: {
        empresaId,
        estado: "EMITIDO",
        dataEmissao: { gte: inicioMes },
      },
      _sum: { totalLiquido: true },
    });

    // Total faturado no mês anterior
    const documentosMesAnterior = await db.documento.aggregate({
      where: {
        empresaId,
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
      where: { empresaId, ativo: true },
    });

    // Documentos pendentes (rascunhos)
    const documentosPendentes = await db.documento.count({
      where: { empresaId, estado: "RASCUNHO" },
    });

    // Documentos recentes
    const documentosRecentes = await db.documento.findMany({
      where: { empresaId },
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
          empresaId,
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
      where: {
        empresaId,
        estado: "EMITIDO"
      },
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
        empresaId,
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
    const artigosStockBaixo = await obterArtigosStockBaixo(empresaId!);

    // Vendas por Cliente (Top 5)
    const vendasPorCliente = await db.documento.groupBy({
      by: ['clienteId', 'clienteNome'],
      where: {
        empresaId,
        estado: "EMITIDO"
      },
      _sum: { totalLiquido: true },
      orderBy: { _sum: { totalLiquido: 'desc' } },
      take: 5,
    });

    // Vendas por Artigo (Top 5)
    const vendasPorArtigo = await db.linhaDocumento.groupBy({
      by: ['artigoId', 'descricaoArtigo'],
      where: {
        documento: {
          empresaId,
          estado: "EMITIDO"
        }
      },
      _sum: { totalLiquido: true, quantidade: true },
      orderBy: { _sum: { totalLiquido: 'desc' } },
      take: 5,
    });

    // Fornecedores ativos
    let fornecedoresAtivos = 0;
    try {
      fornecedoresAtivos = await db.fornecedor.count({
        where: { empresaId, ativo: true },
      });
    } catch {
      // Tabela pode não existir
    }

    // Armazéns ativos
    let armazensAtivos = 0;
    try {
      armazensAtivos = await db.armazem.count({
        where: { empresaId, ativo: true },
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
