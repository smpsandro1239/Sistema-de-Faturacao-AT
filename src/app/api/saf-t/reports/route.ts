import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Listar relatórios SAF-T gerados
export async function GET() {
  try {
    // Buscar todos os documentos emitidos agrupados por mês/ano
    const documentos = await db.documento.findMany({
      where: {
        estado: "EMITIDO",
      },
      select: {
        dataEmissao: true,
        totalLiquido: true,
      },
      orderBy: {
        dataEmissao: "desc",
      },
    });

    // Agrupar por mês/ano
    const relatorios: Map<string, {
      id: string;
      periodo: string;
      ano: number;
      mes: number;
      totalDocumentos: number;
      totalFaturado: number;
      dataGeracao: string;
    }> = new Map();

    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    documentos.forEach((doc) => {
      if (doc.dataEmissao) {
        const data = new Date(doc.dataEmissao);
        const ano = data.getFullYear();
        const mes = data.getMonth() + 1;
        const chave = `${ano}-${mes.toString().padStart(2, '0')}`;

        if (!relatorios.has(chave)) {
          relatorios.set(chave, {
            id: chave,
            periodo: `${nomesMeses[mes - 1]} ${ano}`,
            ano,
            mes,
            totalDocumentos: 0,
            totalFaturado: 0,
            dataGeracao: data.toISOString().split('T')[0],
          });
        }

        const relatorio = relatorios.get(chave)!;
        relatorio.totalDocumentos++;
        relatorio.totalFaturado += doc.totalLiquido?.toNumber() || 0;
      }
    });

    // Converter para array e ordenar por data
    const resultado = Array.from(relatorios.values())
      .sort((a, b) => {
        if (a.ano !== b.ano) return b.ano - a.ano;
        return b.mes - a.mes;
      })
      .map(r => ({
        ...r,
        status: 'validado' as const,
      }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar relatórios SAF-T:", error);
    return NextResponse.json(
      { error: "Erro ao buscar relatórios" },
      { status: 500 }
    );
  }
}
