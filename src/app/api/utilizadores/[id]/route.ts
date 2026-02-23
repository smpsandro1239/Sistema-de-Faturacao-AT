import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, temPermissao } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !temPermissao(auth.user!.perfil, "config")) {
      return NextResponse.json({ error: "Permissões insuficientes" }, { status: 403 });
    }

    const body = await request.json();
    const { ativo, perfil, nome } = body;

    const utilizador = await db.utilizador.update({
      where: { id },
      data: {
        ativo: ativo !== undefined ? ativo : undefined,
        perfil: perfil || undefined,
        nome: nome || undefined,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar utilizador" }, { status: 500 });
  }
}
