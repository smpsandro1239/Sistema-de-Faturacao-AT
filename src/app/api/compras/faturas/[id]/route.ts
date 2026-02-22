import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fatura = await db.faturaCompra.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        linhas: true,
        pagamentos: true,
      },
    });

    if (!fatura) {
      return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    }

    return NextResponse.json(fatura);
  } catch (error) {
    console.error("Erro ao procurar fatura:", error);
    return NextResponse.json({ error: "Erro ao procurar fatura" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const fatura = await db.faturaCompra.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(fatura);
  } catch (error) {
    console.error("Erro ao atualizar fatura:", error);
    return NextResponse.json({ error: "Erro ao atualizar fatura" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.faturaCompra.delete({ where: { id } });
    return NextResponse.json({ message: "Fatura eliminada" });
  } catch (error) {
    console.error("Erro ao eliminar fatura:", error);
    return NextResponse.json({ error: "Erro ao eliminar fatura" }, { status: 500 });
  }
}
