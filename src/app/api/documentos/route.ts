import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCSRF } from "@/lib/auth";
import { fireWebhooks } from "@/lib/webhooks";
import { calcularHashDocumento, gerarATCUD } from "@/lib/hash";

// GET - Listar todos os documentos
export async function GET(request: Request) {
  try {
    const { authenticated, user, error } = await authenticateRequest(request);
    if (!authenticated || !user?.empresaId) {
      return NextResponse.json({ error: error || "Não autorizado" }, { status: 401 });
    }

    const permission = await verificarPermissao(user.perfil, "documentos.read");
    if (!permission.authorized) {
      return NextResponse.json({ error: permission.error }, { status: 403 });
    }

    const documentos = await db.documento.findMany({
      where: {
        empresaId: user.empresaId,
      },
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
    const { authenticated, user, error: authError } = await authenticateRequest(request);
    if (!authenticated || !user?.empresaId) {
      return NextResponse.json({ error: authError || "Não autorizado" }, { status: 401 });
    }

    const permission = await verificarPermissao(user.perfil, "documentos.create");
    if (!permission.authorized) {
      return NextResponse.json({ error: permission.error }, { status: 403 });
    }

    if (!validateCSRF(request)) {
      return NextResponse.json({ error: "Pedido inválido (CSRF)" }, { status: 403 });
    }

    const body = await request.json();
    const {
      serieId,
      clienteId,
      utilizadorId,
      tipo,
      linhas,
      observacoes,
      documentoOriginalId,
      metodoPagamento
    } = body;

    // Buscar série
    const serie = await db.serie.findFirst({
      where: {
        id: serieId,
        empresaId: user.empresaId
      },
    });

    if (!serie) {
      return NextResponse.json(
        { error: "Série não encontrada." },
        { status: 400 }
      );
    }

    // Buscar cliente
    const cliente = await db.cliente.findFirst({
      where: {
        id: clienteId,
        empresaId: user.empresaId
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 400 }
      );
    }

    // Buscar empresa do utilizador
    const empresa = await db.empresa.findUnique({
      where: { id: user.empresaId },
    });

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

    // Se for FATURA_RECIBO, o estado de pagamento deve ser PAGO por defeito
    const estadoPagamento = tipo === "FATURA_RECIBO" ? "PAGO" : "PENDENTE";

    // Criar documento
    const documento = await db.documento.create({
      data: {
        empresaId: user.empresaId,
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
        empresaMorada: empresa.morada || "",
        empresaCodigoPostal: empresa.codigoPostal || "",
        empresaLocalidade: empresa.localidade || "",
        totalBase,
        totalIVA,
        totalDescontos,
        totalLiquido,
        estadoPagamento,
        metodoPagamento: metodoPagamento || null,
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
    const { authenticated, user, error: authError } = await authenticateRequest(request);
    if (!authenticated || !user?.empresaId) {
      return NextResponse.json({ error: authError || "Não autorizado" }, { status: 401 });
    }

    const permission = await verificarPermissao(user.perfil, "documentos.emit");
    if (!permission.authorized) {
      return NextResponse.json({ error: permission.error }, { status: 403 });
    }

    if (!validateCSRF(request)) {
      return NextResponse.json({ error: "Pedido inválido (CSRF)" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    // Buscar documento
    const documento = await db.documento.findFirst({
      where: {
        id,
        empresaId: user.empresaId
      },
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
        empresaId: user.empresaId,
        serieId: documento.serieId,
        estado: "EMITIDO",
        id: { not: id },
      },
      orderBy: { dataEmissao: "desc" },
    });

    const dataEmissao = new Date();
    const dataCriacao = new Date(); // Data da gravação/emissão
    
    // Calcular hash
    const hash = calcularHashDocumento({
      dataEmissao,
      dataCriacao,
      numeroDocumento: documento.numeroFormatado,
      totalLiquido: documento.totalLiquido,
      hashAnterior: documentoAnterior?.hash || null,
    });

    // Gerar ATCUD
    const atcud = gerarATCUD(documento.serie.codigoValidacaoAT || "", documento.numero);

    // Atualizar documento
    const documentoEmitido = await db.documento.update({
      where: { id },
      data: {
        estado: "EMITIDO",
        dataEmissao,
        dataCriacao,
        hash,
        hashDocumentoAnterior: documentoAnterior?.hash || null,
        atcud,
      },
      include: {
        cliente: true,
        linhas: true,
      }

      return doc;
    });

    // Disparar Webhooks
    fireWebhooks("DOCUMENTO.EMITIDO", documentoEmitido).catch(console.error);

    // Envio Automático de Email se configurado no cliente
    if (documentoEmitido.cliente.envioEmailAutomatico && documentoEmitido.cliente.email) {
      enviarEmailDocumento(documentoEmitido, documentoEmitido.cliente.email)
        .then(res => {
          if (res.success) console.log(`Email automático enviado para ${documentoEmitido.cliente.email}`);
          else console.error(`Erro no email automático:`, res.error);
        })
        .catch(console.error);
    }

    return NextResponse.json(documentoEmitido);
  } catch (error) {
    console.error("Erro ao emitir documento:", error);
    return NextResponse.json(
      { error: "Erro ao emitir documento" },
      { status: 500 }
    );
  }
}
