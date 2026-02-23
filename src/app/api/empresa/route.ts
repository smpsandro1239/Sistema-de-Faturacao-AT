import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, temPermissao } from "@/lib/auth";

// GET - Obter dados da empresa
export async function GET(request: Request) {
  try {
    const empresa = await db.empresa.findFirst();
    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao obter empresa:", error);
    return NextResponse.json(
      { error: "Erro ao obter dados da empresa" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar dados da empresa
export async function PUT(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !temPermissao(auth.user!.perfil, "config")) {
      return NextResponse.json({ error: "Permissões insuficientes para configurar empresa" }, { status: 403 });
    }

    const body = await request.json();
    const {
      nome,
      nif,
      morada,
      codigoPostal,
      localidade,
      telefone,
      email,
      website,
      conservatoria,
      matricula,
      capitalSocial,
      certificadoAT,
      logo,
    } = body;

    // Buscar empresa existente
    let empresa = await db.empresa.findFirst();

    if (empresa) {
      // Atualizar empresa existente
      empresa = await db.empresa.update({
        where: { id: empresa.id },
        data: {
          nome,
          nif,
          morada,
          codigoPostal,
          localidade,
          telefone,
          email,
          website,
          conservatoria,
          matricula,
          capitalSocial,
          certificadoAT,
          logo,
        },
      });
    } else {
      // Criar nova empresa
      empresa = await db.empresa.create({
        data: {
          nome,
          nif,
          morada,
          codigoPostal,
          localidade,
          telefone,
          email,
          website,
          conservatoria,
          matricula,
          capitalSocial,
          certificadoAT,
          logo,
        },
      });
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar dados da empresa" },
      { status: 500 }
    );
  }
}
