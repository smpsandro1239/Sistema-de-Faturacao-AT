import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    console.log("🌱 Iniciando seed via API...");

    // 1. Tentar criar tabelas se possível (funciona em alguns ambientes dev)
    // Mas em produção confiamos que o utilizador correu db push ou que o prisma lida bem.
    
    // 2. Criar Admin se não existir
    const passwordHash = await hashPassword("admin123");

    // Usamos um try/catch específico para a escrita
    try {
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
    } catch (writeError: any) {
       console.error("❌ Erro de escrita no Seed:", writeError);
       if (writeError.message?.includes("readonly") || writeError.message?.includes("Unable to open the database file")) {
         return NextResponse.json(
           { error: "O servidor está em modo de leitura. Use PostgreSQL (Neon/Supabase) para persistência no Vercel." },
           { status: 500 }
         );
       }
       throw writeError;
    }

    // 3. Empresa base
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
      message: "Sistema inicializado com sucesso! Pode entrar com admin@faturaat.pt / admin123",
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
    return NextResponse.json({
      hasData: false,
      error: error.message?.includes("Unable to open") ? "Erro de acesso ao ficheiro DB" : "Base de dados não detetada"
    });
  }
}
