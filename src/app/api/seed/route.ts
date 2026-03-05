import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execPromise = promisify(exec);

export async function POST() {
  try {
    console.log("🌱 Iniciando seed/init via API...");

    // Se estivermos na Vercel e o ficheiro não existir ou estiver vazio, tentamos inicializar o schema
    if (process.env.VERCEL) {
      try {
        console.log("Detectada Vercel. Tentando inicializar schema em /tmp/dev.db...");
        // O Prisma CLI não está necessariamente disponível no runtime da Vercel de forma fácil.
        // Uma alternativa é tentar correr um script que execute as queries SQL brutas ou usar o prisma db push se o binário existir.

        // No entanto, correr 'npx prisma db push' pode demorar e exceder timeouts.
        // Vamos primeiro tentar o seed normal e ver se falha por falta de tabelas.
      } catch (e) {
        console.warn("Falha na tentativa de inicialização de schema:", e);
      }
    }

    const passwordHash = await hashPassword("admin123");

    try {
      // Tentar operação simples para ver se tabelas existem
      await db.utilizador.count();
    } catch (dbError: any) {
      console.error("❌ Tabelas não encontradas ou erro de DB:", dbError.message);

      if (dbError.message.includes("does not exist") || dbError.message.includes("no such table")) {
        return NextResponse.json(
          {
            error: "A base de dados não tem tabelas.",
            details: "No Vercel com SQLite, o ficheiro /tmp/dev.db começa vazio. É altamente recomendado configurar um DATABASE_URL (Postgres) nas variáveis de ambiente da Vercel.",
            suggestion: "Para demonstração, tente correr 'npx prisma db push' localmente apontando para uma DB remota."
          },
          { status: 500 }
        );
      }
      throw dbError;
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
             msg.includes("Unable to open") ? "Erro de acesso ao ficheiro DB (Vercel Read-only)" :
             "Base de dados não detetada"
    });
  }
}
