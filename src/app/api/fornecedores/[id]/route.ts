import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Obter fornecedor por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const fornecedor = await db.fornecedor.findUnique({
      where: { id },
      include: {
        encomendasCompra: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { encomendasCompra: true },
        },
      },
    });

    if (!fornecedor) {
      return NextResponse.json(
        { error: "Fornecedor não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(fornecedor);
  } catch (error) {
    console.error("Erro ao obter fornecedor:", error);
    return NextResponse.json(
      { error: "Erro ao obter fornecedor" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar fornecedor
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Validar NIF se fornecido
    if (data.nif && !/^\d{9}$/.test(data.nif)) {
      return NextResponse.json(
        { error: "NIF inválido. Deve conter 9 dígitos." },
        { status: 400 }
      );
    }

    // Verificar duplicados (exceto o próprio)
    if (data.nif || data.codigo) {
      const existente = await db.fornecedor.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.nif ? [{ nif: data.nif }] : []),
                ...(data.codigo ? [{ codigo: data.codigo }] : []),
              ],
            },
          ],
        },
      });

      if (existente) {
        return NextResponse.json(
          { error: "Já existe outro fornecedor com este NIF ou código." },
          { status: 400 }
        );
      }
    }

    const fornecedor = await db.fornecedor.update({
      where: { id },
      data: {
        codigo: data.codigo,
        nome: data.nome,
        nif: data.nif,
        morada: data.morada || null,
        codigoPostal: data.codigoPostal || null,
        localidade: data.localidade || null,
        pais: data.pais || "PT",
        telefone: data.telefone || null,
        email: data.email || null,
        website: data.website || null,
        iban: data.iban || null,
        contactoNome: data.contactoNome || null,
        observacoes: data.observacoes || null,
        ativo: data.ativo,
      },
    });

    return NextResponse.json(fornecedor);
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar fornecedor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar fornecedor
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se tem encomendas associadas
    const encomendas = await db.encomendaCompra.count({
      where: { fornecedorId: id },
    });

    if (encomendas > 0) {
      return NextResponse.json(
        { error: "Não é possível eliminar fornecedor com encomendas associadas." },
        { status: 400 }
      );
    }

    await db.fornecedor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao eliminar fornecedor:", error);
    return NextResponse.json(
      { error: "Erro ao eliminar fornecedor" },
      { status: 500 }
    );
  }
}
