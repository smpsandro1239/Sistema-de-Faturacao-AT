import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoEncomendaCliente } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const clienteId = searchParams.get("clienteId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where = {
      ...(estado && { estado: estado as EstadoEncomendaCliente }),
      ...(clienteId && { clienteId }),
      ...(search && {
        OR: [
          { numeroFormatado: { contains: search } },
          { clienteNome: { contains: search } },
        ],
      }),
    };

    const [encomendas, total] = await Promise.all([
      db.encomendaCliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          cliente: {
            select: { id: true, codigo: true, nome: true, nif: true },
          },
        },
      }),
      db.encomendaCliente.count({ where }),
    ]);

    return NextResponse.json({
      encomendas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar encomendas de cliente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar encomendas de cliente" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clienteId,
      dataEntregaPrevista,
      observacoes,
      linhas,
      utilizadorId,
    } = body;

    if (!clienteId || !linhas || linhas.length === 0) {
      return NextResponse.json(
        { error: "Cliente e linhas são obrigatórios" },
        { status: 400 }
      );
    }

    const cliente = await db.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    // Obter próximo número
    const anoAtual = new Date().getFullYear();
    const ultimaEncomenda = await db.encomendaCliente.findFirst({
      where: { numeroFormatado: { contains: `${anoAtual}` } },
      orderBy: { numero: "desc" },
    });

    const proximoNumero = (ultimaEncomenda?.numero || 0) + 1;
    const numeroFormatado = `ENC ${anoAtual}/${String(proximoNumero).padStart(5, "0")}`;

    // Calcular totais
    let totalBase = 0;
    let totalIVA = 0;

    const linhasProcessadas = linhas.map((linha: any, index: number) => {
      const base = (linha.quantidade * linha.precoUnitario) - (linha.desconto || 0);
      const valorIVA = base * (linha.taxaIVAPercentagem / 100);

      totalBase += base;
      totalIVA += valorIVA;

      return {
        artigoId: linha.artigoId || null,
        codigoArtigo: linha.codigoArtigo || "",
        descricaoArtigo: linha.descricaoArtigo || "",
        quantidade: parseFloat(linha.quantidade),
        precoUnitario: parseFloat(linha.precoUnitario),
        desconto: parseFloat(linha.desconto || 0),
        taxaIVAId: linha.taxaIVAId,
        taxaIVAPercentagem: parseFloat(linha.taxaIVAPercentagem),
        base,
        valorIVA,
        ordem: index + 1,
      };
    });

    const encomenda = await db.encomendaCliente.create({
      data: {
        numero: proximoNumero,
        numeroFormatado,
        clienteId,
        clienteNome: cliente.nome,
        clienteNif: cliente.nif,
        clienteMorada: cliente.morada,
        clienteCodigoPostal: cliente.codigoPostal,
        clienteLocalidade: cliente.localidade,
        dataEntregaPrevista: dataEntregaPrevista ? new Date(dataEntregaPrevista) : null,
        totalBase,
        totalIVA,
        totalLiquido: totalBase + totalIVA,
        observacoes,
        utilizadorId: utilizadorId || "system",
        linhas: {
          create: linhasProcessadas,
        },
      },
      include: {
        linhas: true,
      },
    });

    return NextResponse.json(encomenda, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar encomenda de cliente:", error);
    return NextResponse.json(
      { error: "Erro ao criar encomenda" },
      { status: 500 }
    );
  }
}
