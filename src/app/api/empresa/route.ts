import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Obter dados da empresa
export async function GET() {
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
