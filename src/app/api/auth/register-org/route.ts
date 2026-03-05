import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const registerOrgSchema = z.object({
  empresa: z.object({
    nome: z.string().min(2, "Nome da empresa muito curto"),
    nif: z.string().length(9, "NIF deve ter 9 dígitos"),
    morada: z.string().min(5, "Morada muito curta"),
    codigoPostal: z.string().min(4, "Código postal inválido"),
    localidade: z.string().min(2, "Localidade inválida"),
  }),
  admin: z.object({
    nome: z.string().min(2, "Nome do utilizador muito curto"),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Password deve ter pelo menos 8 caracteres"),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerOrgSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { empresa, admin } = validated.data;

    // Verificar se NIF já existe
    const empresaExistente = await db.empresa.findUnique({
      where: { nif: empresa.nif },
    });

    if (empresaExistente) {
      return NextResponse.json(
        { error: "Já existe uma empresa registada com este NIF." },
        { status: 400 }
      );
    }

    // Verificar se Email já existe
    const utilizadorExistente = await db.utilizador.findUnique({
      where: { email: admin.email },
    });

    if (utilizadorExistente) {
      return NextResponse.json(
        { error: "Já existe um utilizador registado com este email." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(admin.password);

    // Criar Empresa e Admin num único transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Criar Empresa
      const novaEmpresa = await tx.empresa.create({
        data: {
          nome: empresa.nome,
          nif: empresa.nif,
          morada: empresa.morada,
          codigoPostal: empresa.codigoPostal,
          localidade: empresa.localidade,
          configurado: true,
        },
      });

      // 2. Criar Utilizador Admin
      const novoAdmin = await tx.utilizador.create({
        data: {
          nome: admin.nome,
          email: admin.email,
          passwordHash,
          perfil: "ADMIN",
          empresaId: novaEmpresa.id,
        },
      });

      // 3. Criar Taxas de IVA padrão para a empresa (Opcional mas recomendado)
      // Note: createMany might have limitations in some SQLite environments,
      // but Prisma should handle it if it's within the same transaction.
      // We'll create them individually for safety in all environments.

      const taxas = [
        { codigo: "NOR", descricao: "Taxa Normal (23%)", percentagem: 23, empresaId: novaEmpresa.id },
        { codigo: "INT", descricao: "Taxa Intermédia (13%)", percentagem: 13, empresaId: novaEmpresa.id },
        { codigo: "RED", descricao: "Taxa Reduzida (6%)", percentagem: 6, empresaId: novaEmpresa.id },
        { codigo: "ISE", descricao: "Isento", percentagem: 0, empresaId: novaEmpresa.id },
      ];

      for (const taxa of taxas) {
        await tx.taxaIVA.create({ data: taxa });
      }

      return { empresa: novaEmpresa, admin: novoAdmin };
    });

    return NextResponse.json({
      success: true,
      empresaId: result.empresa.id,
      message: "Organização criada com sucesso.",
    }, { status: 201 });

  } catch (error) {
    console.error("Erro no registo de organização:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar o registo. Por favor, tente novamente." },
      { status: 500 }
    );
  }
}
