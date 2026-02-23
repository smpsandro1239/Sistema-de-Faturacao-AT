import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCSRF, authenticateRequest, verificarPermissao } from "@/lib/auth";
import { clientSchema } from "@/lib/validations";

// GET - Listar todos os clientes
export async function GET(request: Request) {
  try {
    const { authenticated, user, error } = await authenticateRequest(request);
    if (!authenticated || !user?.empresaId) {
      return NextResponse.json({ error: error || "Não autorizado" }, { status: 401 });
    }

    const permission = await verificarPermissao(user.perfil, "clientes.read");
    if (!permission.authorized) {
      return NextResponse.json({ error: permission.error }, { status: 403 });
    }

    const clientes = await db.cliente.findMany({
      where: {
        empresaId: user.empresaId,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar clientes" },
      { status: 500 }
    );
  }
}

// POST - Criar novo cliente
export async function POST(request: Request) {
  try {
    const { authenticated, user, error: authError } = await authenticateRequest(request);
    if (!authenticated || !user?.empresaId) {
      return NextResponse.json({ error: authError || "Não autorizado" }, { status: 401 });
    }

    const permission = await verificarPermissao(user.perfil, "clientes.create");
    if (!permission.authorized) {
      return NextResponse.json({ error: permission.error }, { status: 403 });
    }

    if (!validateCSRF(request)) {
      return NextResponse.json({ error: "Pedido inválido (CSRF)" }, { status: 403 });
    }

    const body = await request.json();

    // Validação com Zod
    const validation = clientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { nome, nif, morada, codigoPostal, localidade, telefone, email } = validation.data;
    const { pais } = body; // pais não está no schema simplificado mas pode vir no body

    // Verificar se NIF já existe nesta empresa
    const clienteExistente = await db.cliente.findFirst({
      where: {
        nif,
        empresaId: user.empresaId
      },
    });

    if (clienteExistente) {
      return NextResponse.json(
        { error: "Já existe um cliente com este NIF." },
        { status: 400 }
      );
    }

    // Gerar código automático por empresa
    const ultimoCliente = await db.cliente.findFirst({
      where: { empresaId: user.empresaId },
      orderBy: { createdAt: "desc" },
    });

    const numeroSequencial = ultimoCliente
      ? parseInt(ultimoCliente.codigo.replace("C", "")) + 1
      : 1;

    const codigo = `C${String(numeroSequencial).padStart(3, "0")}`;

    const cliente = await db.cliente.create({
      data: {
        empresaId: user.empresaId,
        codigo,
        nome,
        nif,
        morada: morada || null,
        codigoPostal: codigoPostal || null,
        localidade: localidade || null,
        pais: pais || "PT",
        telefone: telefone || null,
        email: email || null,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}
