import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

// GET - Listar encomendas de cliente
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");
    const estado = searchParams.get("estado");

    const encomendas = await db.encomendaCliente.findMany({
      where: {
        clienteId: clienteId || undefined,
        estado: (estado as any) || undefined,
      },
      include: {
        cliente: true,
        linhas: true,
      },
      orderBy: { dataEncomenda: "desc" },
    });

    return NextResponse.json(encomendas);
  } catch (error) {
    console.error("Erro ao procurar encomendas:", error);
    return NextResponse.json({ error: "Erro ao procurar encomendas" }, { status: 500 });
  }
}

// POST - Criar nova encomenda de cliente
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { clienteId, dataEntregaPrevista, linhas, observacoes, utilizadorId } = body;

    if (!clienteId || !linhas || linhas.length === 0) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    // Obter último número
    const ultimaEncomenda = await db.encomendaCliente.findFirst({
      orderBy: { numero: "desc" },
    });
    const novoNumero = (ultimaEncomenda?.numero || 0) + 1;
    const ano = new Date().getFullYear();
    const numeroFormatado = `ENC ${ano}/${String(novoNumero).padStart(5, "0")}`;

    // Calcular totais
    let totalBase = 0;
    let totalIVA = 0;

    const linhasFormatadas = linhas.map((l: any, idx: number) => {
      const base = l.quantidade * l.precoUnitario - (l.desconto || 0);
      const valorIVA = base * (l.taxaIVAPercentagem / 100);
      totalBase += base;
      totalIVA += valorIVA;
      return {
        artigoId: l.artigoId || null,
        codigoArtigo: l.codigoArtigo,
        descricaoArtigo: l.descricaoArtigo,
        quantidade: l.quantidade,
        precoUnitario: l.precoUnitario,
        desconto: l.desconto || 0,
        taxaIVAId: l.taxaIVAId,
        taxaIVAPercentagem: l.taxaIVAPercentagem,
        base,
        valorIVA,
        ordem: idx + 1,
      };
    });

    const encomenda = await db.encomendaCliente.create({
      data: {
        numero: novoNumero,
        numeroFormatado,
        clienteId,
        clienteNome: cliente.nome,
        clienteNif: cliente.nif,
        dataEncomenda: new Date(),
        dataEntregaPrevista: dataEntregaPrevista ? new Date(dataEntregaPrevista) : null,
        totalBase,
        totalIVA,
        totalLiquido: totalBase + totalIVA,
        observacoes,
        utilizadorId: utilizadorId || "system",
        linhas: {
          create: linhasFormatadas,
        },
      },
      include: {
        linhas: true,
      },
    });

    return NextResponse.json(encomenda, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar encomenda:", error);
    return NextResponse.json({ error: "Erro ao criar encomenda" }, { status: 500 });
  }
}
