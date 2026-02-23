import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";
import { TipoDocumento, EstadoDocumento } from "@prisma/client";

/**
 * Endpoint para receber encomendas de e-commerce e criar rascunhos de fatura
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    const auth = await validateApiKey(apiKey);

    if (!auth.valid) {
      return NextResponse.json({ error: "API Key inválida" }, { status: 401 });
    }

    const payload = await request.json();
    const { orderId, customerNif, customerName, items, totalAmount } = payload;

    if (!customerNif || !items || items.length === 0) {
      return NextResponse.json({ error: "Dados da encomenda incompletos" }, { status: 400 });
    }

    // Buscar ou criar cliente
    let cliente = await db.cliente.findFirst({ where: { nif: customerNif } });
    if (!cliente) {
      // Gerar código
      const ultimo = await db.cliente.findFirst({ orderBy: { createdAt: "desc" } });
      const num = ultimo ? parseInt(ultimo.codigo.replace("C", "")) + 1 : 1;
      cliente = await db.cliente.create({
        data: {
          codigo: `C${String(num).padStart(3, "0")}`,
          nome: customerName || `Cliente ${customerNif}`,
          nif: customerNif,
        }
      });
    }

    // Selecionar série ativa para FATURA
    const serie = await db.serie.findFirst({
      where: { tipoDocumento: TipoDocumento.FATURA, ativo: true },
    });

    if (!serie) {
      return NextResponse.json({ error: "Nenhuma série de faturação ativa encontrada" }, { status: 500 });
    }

    const empresa = await db.empresa.findFirst();
    if (!empresa) return NextResponse.json({ error: "Dados da empresa não configurados" }, { status: 500 });

    const proximoNumero = serie.numeroAtual + 1;
    const numeroFormatado = `${serie.prefixo} ${serie.ano}/${String(proximoNumero).padStart(5, "0")}`;

    // Criar Rascunho de Documento
    const documento = await db.documento.create({
      data: {
        numero: proximoNumero,
        numeroFormatado,
        tipo: TipoDocumento.FATURA,
        serieId: serie.id,
        clienteId: cliente.id,
        utilizadorId: "system-ecommerce",
        clienteNome: cliente.nome,
        clienteNif: cliente.nif,
        empresaNome: empresa.nome,
        empresaNif: empresa.nif,
        empresaMorada: empresa.morada,
        empresaCodigoPostal: empresa.codigoPostal,
        empresaLocalidade: empresa.localidade,
        totalBase: totalAmount / 1.23, // Simplificado
        totalIVA: totalAmount - (totalAmount / 1.23),
        totalLiquido: totalAmount,
        estado: EstadoDocumento.RASCUNHO,
        observacoes: `Encomenda E-commerce #${orderId}`,
      }
    });

    // Atualizar número da série
    await db.serie.update({
      where: { id: serie.id },
      data: { numeroAtual: proximoNumero }
    });

    return NextResponse.json({
      success: true,
      documentoId: documento.id,
      numero: numeroFormatado
    }, { status: 201 });

  } catch (error) {
    console.error("Erro no Webhook Ecommerce:", error);
    return NextResponse.json({ error: "Erro interno ao processar encomenda" }, { status: 500 });
  }
}
