import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const encomenda = await db.encomendaCliente.findUnique({
      where: { id },
      include: {
        cliente: true,
        linhas: true,
      },
    });

    if (!encomenda) return NextResponse.json({ error: "Encomenda não encontrada" }, { status: 404 });

    return NextResponse.json(encomenda);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar encomenda" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const encomenda = await db.encomendaCliente.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(encomenda);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar encomenda" }, { status: 500 });
  }
}
