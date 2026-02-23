#!/usr/bin/env bun
/**
 * Script de Seed - Sistema de Faturação AT
 * 
 * Uso:
 *   bun run seed                  # Ver estado da base de dados
 *   bun run seed --init           # Criar dados básicos (sem documentos)
 *   bun run seed --full           # Criar dados completos com 20 documentos
 *   bun run seed --full --docs 50 # Criar dados com 50 documentos
 *   bun run seed --clear          # Limpar base de dados
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// Cores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function clearDatabase() {
  log("\n🗑️  Limpando base de dados...", colors.yellow);
  
  try {
    await prisma.auditoria.deleteMany();
    await prisma.linhaDocumento.deleteMany();
    await prisma.documento.deleteMany();
    await prisma.pagamento.deleteMany();
    await prisma.artigo.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.serie.deleteMany();
    await prisma.isencaoIVA.deleteMany();
    await prisma.taxaIVA.deleteMany();
    await prisma.utilizador.deleteMany();
    await prisma.empresa.deleteMany();
    
    log("✅ Base de dados limpa!", colors.green);
  } catch (error) {
    log(`❌ Erro ao limpar: ${error}`, colors.red);
    throw error;
  }
}

async function showStatus() {
  log("\n📊 Estado da Base de Dados", colors.cyan);
  log("━".repeat(40), colors.cyan);
  
  const counts = {
    "Utilizadores": await prisma.utilizador.count(),
    "Empresa": await prisma.empresa.count(),
    "Clientes": await prisma.cliente.count(),
    "Artigos": await prisma.artigo.count(),
    "Taxas IVA": await prisma.taxaIVA.count(),
    "Isenções IVA": await prisma.isencaoIVA.count(),
    "Séries": await prisma.serie.count(),
    "Documentos": await prisma.documento.count(),
    "Linhas Documento": await prisma.linhaDocumento.count(),
    "Registos Auditoria": await prisma.auditoria.count(),
  };

  let total = 0;
  for (const [name, count] of Object.entries(counts)) {
    const icon = count > 0 ? "✓" : "○";
    const color = count > 0 ? colors.green : colors.yellow;
    log(`  ${icon} ${name}: ${count}`, color);
    total += count;
  }
  
  log("━".repeat(40), colors.cyan);
  log(`  Total de registos: ${total}`, colors.blue);
  
  const hasData = total > 0;
  if (!hasData) {
    log("\n💡 Use 'bun run seed --init' para criar dados de demonstração", colors.yellow);
  }
  
  return counts;
}

async function createSeedData(includeDocuments: boolean = false, docCount: number = 20) {
  log("\n🌱 Iniciando seed da base de dados...\n", colors.cyan);

  // 1. UTILIZADORES
  log("👤 Criando utilizadores...", colors.blue);
  
  const adminPasswordHash = await hashPassword("admin123");
  const admin = await prisma.utilizador.upsert({
    where: { id: "utilizador-admin" },
    update: {},
    create: {
      id: "utilizador-admin",
      nome: "Administrador",
      email: "admin@faturaat.pt",
      passwordHash: adminPasswordHash,
      perfil: "ADMIN",
      ativo: true,
    },
  });

  const gestorPasswordHash = await hashPassword("gestor123");
  const gestor = await prisma.utilizador.upsert({
    where: { id: "utilizador-gestor" },
    update: {},
    create: {
      id: "utilizador-gestor",
      nome: "Gestor Comercial",
      email: "gestor@faturaat.pt",
      passwordHash: gestorPasswordHash,
      perfil: "GESTOR",
      ativo: true,
    },
  });

  const operadorPasswordHash = await hashPassword("operador123");
  const operador = await prisma.utilizador.upsert({
    where: { id: "utilizador-operador" },
    update: {},
    create: {
      id: "utilizador-operador",
      nome: "Operador",
      email: "operador@faturaat.pt",
      passwordHash: operadorPasswordHash,
      perfil: "OPERADOR",
      ativo: true,
    },
  });

  log(`   ✓ 3 utilizadores criados`, colors.green);

  // 2. EMPRESA
  log("🏢 Criando empresa...", colors.blue);
  
  const empresa = await prisma.empresa.upsert({
    where: { id: "empresa-1" },
    update: {},
    create: {
      id: "empresa-1",
      nome: "FaturaAT Demo Lda",
      nif: "509123456",
      morada: "Rua da Faturação Eletrónica, 123",
      codigoPostal: "1000-001",
      localidade: "Lisboa",
      telefone: "211234567",
      email: "geral@faturaat.pt",
      website: "https://faturaat.pt",
      certificadoAT: "AT/DEMO/2024",
    },
  });

  log(`   ✓ Empresa criada: ${empresa.nome}`, colors.green);

  // 3. TAXAS DE IVA
  log("📊 Criando taxas de IVA...", colors.blue);
  
  const taxasIVA = await Promise.all([
    prisma.taxaIVA.upsert({
      where: { id: "iva-normal" },
      update: {},
      create: { id: "iva-normal", codigo: "NOR", descricao: "Taxa Normal - Continente", taxa: 23, tipo: "NOR" },
    }),
    prisma.taxaIVA.upsert({
      where: { id: "iva-intermedia" },
      update: {},
      create: { id: "iva-intermedia", codigo: "INT", descricao: "Taxa Intermédia - Continente", taxa: 13, tipo: "INT" },
    }),
    prisma.taxaIVA.upsert({
      where: { id: "iva-reduzida" },
      update: {},
      create: { id: "iva-reduzida", codigo: "RED", descricao: "Taxa Reduzida - Continente", taxa: 6, tipo: "RED" },
    }),
  ]);

  log(`   ✓ ${taxasIVA.length} taxas de IVA criadas`, colors.green);

  // 4. ISENÇÕES
  log("📋 Criando isenções de IVA...", colors.blue);
  
  const isencoes = await Promise.all([
    prisma.isencaoIVA.upsert({
      where: { id: "isencao-m01" },
      update: {},
      create: { id: "isencao-m01", codigo: "M01", descricao: "Não sujeito - Art. 2.º CIVA", motivo: "Operação não sujeita" },
    }),
    prisma.isencaoIVA.upsert({
      where: { id: "isencao-m02" },
      update: {},
      create: { id: "isencao-m02", codigo: "M02", descricao: "Isento - Art. 6.º CIVA", motivo: "Isenção Art. 6.º" },
    }),
    prisma.isencaoIVA.upsert({
      where: { id: "isencao-m99" },
      update: {},
      create: { id: "isencao-m99", codigo: "M99", descricao: "Isento - Outras isenções", motivo: "Outras isenções" },
    }),
  ]);

  log(`   ✓ ${isencoes.length} isenções criadas`, colors.green);

  // 5. SÉRIES
  log("📁 Criando séries de documentos...", colors.blue);
  
  const series = await Promise.all([
    prisma.serie.upsert({
      where: { id: "serie-faturas-2024" },
      update: {},
      create: {
        id: "serie-faturas-2024",
        codigo: "F2024",
        descricao: "Faturas 2024",
        tipoDocumento: "FATURA",
        prefixo: "F",
        numeroAtual: 0,
        codigoValidacaoAT: "DEMO123",
        ano: 2024,
        dataInicio: new Date("2024-01-01"),
        ativo: true,
      },
    }),
    prisma.serie.upsert({
      where: { id: "serie-faturas-recibo-2024" },
      update: {},
      create: {
        id: "serie-faturas-recibo-2024",
        codigo: "FR2024",
        descricao: "Faturas-Recibo 2024",
        tipoDocumento: "FATURA_RECIBO",
        prefixo: "FR",
        numeroAtual: 0,
        codigoValidacaoAT: "DEMO456",
        ano: 2024,
        dataInicio: new Date("2024-01-01"),
        ativo: true,
      },
    }),
    prisma.serie.upsert({
      where: { id: "serie-nc-2024" },
      update: {},
      create: {
        id: "serie-nc-2024",
        codigo: "NC2024",
        descricao: "Notas de Crédito 2024",
        tipoDocumento: "NOTA_CREDITO",
        prefixo: "NC",
        numeroAtual: 0,
        codigoValidacaoAT: "DEMO789",
        ano: 2024,
        dataInicio: new Date("2024-01-01"),
        ativo: true,
      },
    }),
  ]);

  log(`   ✓ ${series.length} séries criadas`, colors.green);

  // 5.5 ARMAZÉNS
  log("🏭 Criando armazéns...", colors.blue);
  
  const armazens = await Promise.all([
    prisma.armazem.upsert({
      where: { id: "armazem-principal" },
      update: {},
      create: {
        id: "armazem-principal",
        codigo: "ARM001",
        nome: "Armazém Principal",
        morada: "Rua do Armazém, 1",
        codigoPostal: "1000-001",
        localidade: "Lisboa",
        principal: true,
        ativo: true,
      },
    }),
    prisma.armazem.upsert({
      where: { id: "armazem-porto" },
      update: {},
      create: {
        id: "armazem-porto",
        codigo: "ARM002",
        nome: "Armazém Porto",
        morada: "Av. Industrial, 50",
        codigoPostal: "4000-001",
        localidade: "Porto",
        principal: false,
        ativo: true,
      },
    }),
  ]);

  log(`   ✓ ${armazens.length} armazéns criados`, colors.green);

  // 5.6 FORNECEDORES
  log("🚚 Criando fornecedores...", colors.blue);
  
  const fornecedoresData = [
    { codigo: "FRN001", nome: "Tech Supplies Lda", nif: "501234567", morada: "Polígono Industrial, Lote 10", codigoPostal: "4700-200", localidade: "Braga", telefone: "253123456", email: "vendas@techsupplies.pt", iban: "PT50001234567890123456789" },
    { codigo: "FRN002", nome: "Distribuidora Nacional SA", nif: "502345678", morada: "Centro Logístico, Bloco B", codigoPostal: "2800-001", localidade: "Almada", telefone: "212345678", email: "comercial@distnacional.pt" },
    { codigo: "FRN003", nome: "Importadora Global Lda", nif: "503456789", morada: "Porto de Lisboa, Armazém 5", codigoPostal: "1100-001", localidade: "Lisboa", telefone: "213456789", email: "importacoes@global.pt" },
  ];

  const fornecedores = await Promise.all(
    fornecedoresData.map((fornecedor, index) =>
      prisma.fornecedor.upsert({
        where: { id: `fornecedor-${index + 1}` },
        update: {},
        create: { id: `fornecedor-${index + 1}`, ...fornecedor },
      })
    )
  );

  log(`   ✓ ${fornecedores.length} fornecedores criados`, colors.green);

  // 6. CLIENTES
  log("👥 Criando clientes...", colors.blue);
  
  const clientesData = [
    { codigo: "C001", nome: "Empresa ABC Lda", nif: "509123456", morada: "Rua das Flores, 123", codigoPostal: "1000-001", localidade: "Lisboa", pais: "PT" },
    { codigo: "C002", nome: "Comercial XYZ SA", nif: "508765432", morada: "Av. Principal, 45", codigoPostal: "4000-001", localidade: "Porto", pais: "PT" },
    { codigo: "C003", nome: "Tecnologias Web Lda", nif: "507111222", morada: "Rua dos Programadores, 78", codigoPostal: "3000-001", localidade: "Coimbra", pais: "PT" },
    { codigo: "C004", nome: "Consultores Financeiros SA", nif: "506333444", morada: "Av. da Liberdade, 200", codigoPostal: "1250-001", localidade: "Lisboa", pais: "PT" },
    { codigo: "C005", nome: "Indústrias Creative Lda", nif: "505555666", morada: "Parque Industrial, Lote 5", codigoPostal: "4700-001", localidade: "Braga", pais: "PT" },
    { codigo: "C006", nome: "Serviços Expresso SA", nif: "504777888", morada: "Rua Comercial, 50", codigoPostal: "8000-001", localidade: "Faro", pais: "PT" },
    { codigo: "C007", nome: "Global Solutions Lda", nif: "503999000", morada: "Centro Empresarial, Bloco A", codigoPostal: "4400-001", localidade: "Vila Nova de Gaia", pais: "PT" },
    { codigo: "C008", nome: "StartUp Innovation SA", nif: "502111333", morada: "Hub de Startups, Sala 10", codigoPostal: "1600-001", localidade: "Lisboa", pais: "PT" },
    { codigo: "C009", nome: "Comércio Tradicional Lda", nif: "501444555", morada: "Rua Histórica, 25", codigoPostal: "9600-001", localidade: "Ponta Delgada", pais: "PT" },
    { codigo: "C010", nome: "Cliente Consumidor Final", nif: "999999990", morada: "Consumidor Final", codigoPostal: "0000-000", localidade: "Portugal", pais: "PT" },
  ];

  const clientes = await Promise.all(
    clientesData.map((cliente, index) =>
      prisma.cliente.upsert({
        where: { id: `cliente-${index + 1}` },
        update: {},
        create: { id: `cliente-${index + 1}`, ...cliente },
      })
    )
  );

  log(`   ✓ ${clientes.length} clientes criados`, colors.green);

  // 7. ARTIGOS
  log("📦 Criando artigos...", colors.blue);
  
  const artigosData = [
    { codigo: "A001", descricao: "Consultoria Técnica", tipo: "SERVICO" as const, precoUnitario: 75.00, unidade: "H", taxaIVAId: "iva-normal" },
    { codigo: "A002", descricao: "Desenvolvimento de Software", tipo: "SERVICO" as const, precoUnitario: 85.00, unidade: "H", taxaIVAId: "iva-normal" },
    { codigo: "A003", descricao: "Formação Profissional", tipo: "SERVICO" as const, precoUnitario: 50.00, unidade: "H", taxaIVAId: "iva-reduzida" },
    { codigo: "A004", descricao: "Suporte Técnico", tipo: "SERVICO" as const, precoUnitario: 45.00, unidade: "H", taxaIVAId: "iva-normal" },
    { codigo: "A005", descricao: "Análise de Sistemas", tipo: "SERVICO" as const, precoUnitario: 90.00, unidade: "H", taxaIVAId: "iva-normal" },
    { codigo: "A006", descricao: "Implementação de Software", tipo: "SERVICO" as const, precoUnitario: 120.00, unidade: "H", taxaIVAId: "iva-normal" },
    { codigo: "A007", descricao: "Licença de Software", tipo: "SERVICO" as const, precoUnitario: 500.00, unidade: "UNI", taxaIVAId: "iva-normal" },
    { codigo: "A008", descricao: "Manutenção Preventiva", tipo: "SERVICO" as const, precoUnitario: 150.00, unidade: "MÊS", taxaIVAId: "iva-normal" },
    { codigo: "A009", descricao: "Equipamento Informático", tipo: "PRODUTO" as const, precoUnitario: 850.00, unidade: "UNI", taxaIVAId: "iva-normal" },
    { codigo: "A010", descricao: "Acessórios de Computador", tipo: "PRODUTO" as const, precoUnitario: 35.00, unidade: "UNI", taxaIVAId: "iva-normal" },
  ];

  const artigos = await Promise.all(
    artigosData.map((artigo, index) =>
      prisma.artigo.upsert({
        where: { id: `artigo-${index + 1}` },
        update: {},
        create: { id: `artigo-${index + 1}`, ...artigo },
      })
    )
  );

  log(`   ✓ ${artigos.length} artigos criados`, colors.green);
  // 7.1 STOCK INICIAL
  log("📦 Criando stock inicial...", colors.blue);

  const stocksIniciais = [];
  for (const artigo of artigos) {
    if (artigo.tipo === "PRODUTO") {
      await prisma.artigo.update({
        where: { id: artigo.id },
        data: { controlaStock: true, stockMinimo: 5, stockMaximo: 100 }
      });

      const stock = await prisma.artigoArmazemStock.upsert({
        where: {
          artigoId_armazemId: {
            artigoId: artigo.id,
            armazemId: armazens[0].id
          }
        },
        update: {},
        create: {
          artigoId: artigo.id,
          armazemId: armazens[0].id,
          quantidade: Math.floor(Math.random() * 20) + 2,
          quantidadeReservada: 0
        }
      });
      stocksIniciais.push(stock);
    }
  }
  log(`   ✓ ${stocksIniciais.length} registos de stock criados`, colors.green);

  // 8. DOCUMENTOS (opcional)
  let documentosCount = 0;
  
  if (includeDocuments) {
    log(`📄 Criando ${docCount} documentos...`, colors.blue);
    
    const serieFaturas = await prisma.serie.findUnique({ where: { id: "serie-faturas-2024" } });
    
    if (serieFaturas) {
      let hashAnterior = "";
      
      for (let i = 0; i < docCount; i++) {
        const cliente = clientes[i % (clientes.length - 1)];
        const artigo = artigos[i % artigos.length];
        
        const quantidade = Math.floor(Math.random() * 10) + 1;
        const precoUnitario = Number(artigo.precoUnitario) || 50;
        const totalBase = quantidade * precoUnitario;
        const taxaIVA = artigo.taxaIVAId === "iva-reduzida" ? 6 : 23;
        const totalIVA = totalBase * (taxaIVA / 100);
        const totalLiquido = totalBase + totalIVA;

        const numero = i + 1;
        const numeroFormatado = `F2024-${numero.toString().padStart(4, "0")}`;
        const atcud = `DEMO123-${numero}`;

        // Hash simples para demonstração
        const hashInput = `${numeroFormatado}|${totalLiquido}|${hashAnterior}`;
        const hash = Buffer.from(hashInput).toString("base64").substring(0, 64);

        const dataEmissao = new Date();
        dataEmissao.setDate(dataEmissao.getDate() - Math.floor(Math.random() * 30));

        await prisma.documento.create({
          data: {
            numero,
            numeroFormatado,
            tipo: "FATURA",
            serieId: serieFaturas.id,
            clienteId: cliente.id,
            utilizadorId: admin.id,
            clienteNome: cliente.nome,
            clienteNif: cliente.nif,
            clienteMorada: cliente.morada,
            clienteCodigoPostal: cliente.codigoPostal,
            clienteLocalidade: cliente.localidade,
            empresaNome: empresa.nome,
            empresaNif: empresa.nif,
            empresaMorada: empresa.morada,
            empresaCodigoPostal: empresa.codigoPostal,
            empresaLocalidade: empresa.localidade,
            totalBase,
            totalIVA,
            totalLiquido,
            hash,
            hashDocumentoAnterior: hashAnterior || null,
            atcud,
            dataEmissao,
            dataCriacao: dataEmissao,
            estado: "EMITIDO",
            linhas: {
              create: {
                ordem: 1,
                codigoArtigo: artigo.codigo,
                descricaoArtigo: artigo.descricao,
                quantidade,
                precoUnitario,
                taxaIVAId: artigo.taxaIVAId || "iva-normal",
                taxaIVAPercentagem: taxaIVA,
                valorIVA: totalIVA,
                base: totalBase,
              },
            },
          },
        });

        hashAnterior = hash;
        documentosCount++;
      }

      await prisma.serie.update({
        where: { id: serieFaturas.id },
        data: { numeroAtual: docCount },
      });
    }

    log(`   ✓ ${documentosCount} documentos criados`, colors.green);
  }

  // 9. AUDITORIA
  log("📝 Registando auditoria...", colors.blue);
  
  await prisma.auditoria.create({
    data: {
      acao: "CREATE",
      entidade: "SISTEMA",
      entidadeId: "seed-script",
      utilizadorId: admin.id,
      valorNovo: JSON.stringify({ documentos: documentosCount }),
    },
  });

  log("\n✅ Seed concluído com sucesso!\n", colors.green);
  
  log("━".repeat(50), colors.cyan);
  log("📋 CREDENCIAIS DE ACESSO:", colors.cyan);
  log("━".repeat(50), colors.cyan);
  log("  Admin:   admin@faturaat.pt / admin123", colors.yellow);
  log("  Gestor:  gestor@faturaat.pt / gestor123", colors.yellow);
  log("  Operador: operador@faturaat.pt / operador123", colors.yellow);
  log("━".repeat(50), colors.cyan);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes("--clear")) {
      await clearDatabase();
    } else if (args.includes("--full")) {
      const docsIndex = args.indexOf("--docs");
      const docCount = docsIndex > -1 ? parseInt(args[docsIndex + 1]) || 20 : 20;
      await createSeedData(true, docCount);
    } else if (args.includes("--init")) {
      await createSeedData(false);
    } else {
      await showStatus();
    }
  } catch (error) {
    log(`\n❌ Erro: ${error}`, colors.red);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
