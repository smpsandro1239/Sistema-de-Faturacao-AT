import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { calcularHashDocumento } from "@/lib/hash";

/**
 * Script de Seed via API para inicialização fácil em produção/vercel
 */
export async function POST() {
  try {
    console.log("🌱 Iniciando seed da base de dados...");

    // Verificar se já existem utilizadores
    const count = await db.utilizador.count().catch(() => -1);
    
    if (count > 0) {
      return NextResponse.json(
        { error: "A base de dados já contém dados. Limpe-a primeiro se desejar reiniciar." },
        { status: 400 }
      );
    }

    if (count === -1) {
       // Se der erro ao contar, a tabela pode não existir
       return NextResponse.json(
         { error: "Erro ao aceder às tabelas. Verifique se executou 'npx prisma db push' ou se a DATABASE_URL está correta." },
         { status: 500 }
       );
    }

    console.log("👤 Criando utilizadores...");
    const passwordHash = await hashPassword("admin123");
    const admin = await db.utilizador.upsert({
      where: { email: "admin@faturaat.pt" },
      update: {},
      create: {
        id: "admin-1",
        nome: "Administrador",
        email: "admin@faturaat.pt",
        passwordHash,
        perfil: "ADMIN",
        ativo: true,
      },
    });

    const gestorHash = await hashPassword("gestor123");
    await db.utilizador.upsert({
      where: { email: "gestor@faturaat.pt" },
      update: {},
      create: {
        id: "gestor-1",
        nome: "Gestor Comercial",
        email: "gestor@faturaat.pt",
        passwordHash: gestorHash,
        perfil: "GESTOR",
        ativo: true,
      },
    });

    console.log("🏢 Criando empresa...");
    const empresa = await db.empresa.upsert({
      where: { nif: "500123456" },
      update: {},
      create: {
        id: "empresa-1",
        nome: "Minha Empresa Lda",
        nif: "500123456",
        morada: "Rua da Tecnologia, 123",
        codigoPostal: "1000-001",
        localidade: "Lisboa",
        email: "geral@minhaempresa.pt",
        telefone: "210000000",
        conservatoria: "CRC Lisboa",
        capitalSocial: "5000.00",
        configurado: true,
      },
    });

    console.log("📊 Criando taxas de IVA...");
    const taxasIVA = [
      { id: "iva-normal", descricao: "IVA Normal (23%)", percentagem: 23, codigo: "NOR", ativo: true },
      { id: "iva-intermedia", descricao: "IVA Intermédio (13%)", percentagem: 13, codigo: "INT", ativo: true },
      { id: "iva-reduzida", descricao: "IVA Reduzido (6%)", percentagem: 6, codigo: "RED", ativo: true },
      { id: "iva-isento", descricao: "Isento", percentagem: 0, codigo: "ISE", ativo: true },
    ];

    for (const taxa of taxasIVA) {
      await db.taxaIVA.upsert({
        where: { id: taxa.id },
        update: {},
        create: taxa,
      });
    }

    console.log("📋 Criando séries...");
    await db.serie.upsert({
      where: { id: "serie-2024" },
      update: {},
      create: {
        id: "serie-2024",
        nome: "Série 2024",
        prefixo: "FT ",
        ano: 2024,
        numeroAtual: 0,
        tipoDocumento: "FATURA",
        ativa: true,
        principal: true,
        codigoValidacaoAT: "DEMO123",
      },
    });

    console.log("✅ Seed concluído com sucesso!");

    return NextResponse.json({
      success: true,
      message: "Dados de demonstração criados com sucesso!",
      counts: {
        utilizadores: 2,
        empresa: 1,
        taxasIVA: taxasIVA.length,
      }
    });
  } catch (error) {
    console.error("❌ Erro no seed:", error);
    let message = "Erro ao criar dados de demonstração";

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      message = "Erro de configuração: Variável de ambiente DATABASE_URL não encontrada no servidor.";
    }

    return NextResponse.json(
      { error: message, details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const counts = {
      utilizadores: await db.utilizador.count(),
      hasData: false,
    };
    counts.hasData = counts.utilizadores > 0;

    return NextResponse.json(counts);
  } catch (error) {
    return NextResponse.json(
      { hasData: false, error: "Base de dados não inicializada ou inacessível." },
      { status: 200 } // Retornamos 200 para que a UI possa lidar com o erro amigavelmente
    );
  }
}
