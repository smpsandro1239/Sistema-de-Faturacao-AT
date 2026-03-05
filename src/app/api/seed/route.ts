import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    console.log("🌱 Iniciando seed via API...");

    const passwordHash = await hashPassword("admin123");

    try {
      // Tentar operação simples para ver se tabelas existem
      await db.utilizador.count();
    } catch (dbError: any) {
      console.error("❌ Tabelas não encontradas ou erro de DB:", dbError.message);

      return NextResponse.json(
        {
          error: "A base de dados não está configurada ou sincronizada.",
          details: dbError.message,
          suggestion: "Certifique-se que executou 'npx prisma db push' no ambiente de produção ou que a DATABASE_URL é válida."
        },
        { status: 500 }
      );
    }

    // Se as tabelas existem, procedemos com o seed de dados
    await db.utilizador.upsert({
      where: { email: "admin@faturaat.pt" },
      update: {},
      create: {
        id: "admin-default",
        nome: "Administrador Demo",
        email: "admin@faturaat.pt",
        passwordHash,
        perfil: "ADMIN",
        ativo: true,
      },
    });

    await db.empresa.upsert({
      where: { nif: "500111222" },
      update: {},
      create: {
        id: "empresa-demo",
        nome: "Empresa de Demonstração Lda",
        nif: "500111222",
        morada: "Avenida da Liberdade, 1",
        codigoPostal: "1000-001",
        localidade: "Lisboa",
        configurado: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sistema inicializado com sucesso!",
    });

  } catch (error: any) {
    console.error("❌ Erro Geral no Seed:", error);
    return NextResponse.json(
      { error: "Falha ao inicializar sistema.", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const count = await db.utilizador.count();
    return NextResponse.json({ hasData: count > 0 });
  } catch (error: any) {
    const msg = error.message || "";
    return NextResponse.json({
      hasData: false,
      error: msg.includes("does not exist") ? "Base de dados sem tabelas (Schema não inicializado)" :
             "Erro de ligação à base de dados ou configuração pendente."
    });
  }
}
