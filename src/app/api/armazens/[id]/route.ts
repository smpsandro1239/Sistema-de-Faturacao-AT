import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Obter armazém por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const armazem = await db.armazem.findUnique({
      where: { id },
      include: {
        stocks: {
          include: {
            artigo: {
              select: {
                id: true,
                codigo: true,
                descricao: true,
                unidade: true,
              },
            },
          },
          take: 50,
          orderBy: { artigo: { descricao: "asc" } },
        },
        _count: {
          select: { stocks: true, movimentosOrigem: true },
        },
      },
    });

    if (!armazem) {
      return NextResponse.json(
        { error: "Armazém não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(armazem);
  } catch (error) {
    console.error("Erro ao obter armazém:", error);
    return NextResponse.json(
      { error: "Erro ao obter armazém" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar armazém
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Verificar código duplicado
    if (data.codigo) {
      const existente = await db.armazem.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { codigo: data.codigo },
          ],
        },
      });

      if (existente) {
        return NextResponse.json(
          { error: "Já existe outro armazém com este código." },
          { status: 400 }
        );
      }
    }

    // Se for principal, remover flag dos outros
    if (data.principal) {
      await db.armazem.updateMany({
        where: { principal: true, id: { not: id } },
        data: { principal: false },
      });
    }

    const armazem = await db.armazem.update({
      where: { id },
      data: {
        codigo: data.codigo,
        nome: data.nome,
        morada: data.morada || null,
        codigoPostal: data.codigoPostal || null,
        localidade: data.localidade || null,
        principal: data.principal,
        observacoes: data.observacoes || null,
        ativo: data.ativo,
      },
    });

    return NextResponse.json(armazem);
  } catch (error) {
    console.error("Erro ao atualizar armazém:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar armazém" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar armazém
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se tem stock associado
    const stocks = await db.artigoArmazemStock.count({
      where: { armazemId: id, quantidade: { gt: 0 } },
    });

    if (stocks > 0) {
      return NextResponse.json(
        { error: "Não é possível eliminar armazém com stock associado." },
        { status: 400 }
      );
    }

    // Eliminar stocks vazios
    await db.artigoArmazemStock.deleteMany({
      where: { armazemId: id },
    });

    await db.armazem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao eliminar armazém:", error);
    return NextResponse.json(
      { error: "Erro ao eliminar armazém" },
      { status: 500 }
    );
  }
}
