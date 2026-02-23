import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { calcularHashDocumento } from "@/lib/hash";

// POST - Inicializar dados completos de demonstração
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const incluirDocumentos = searchParams.get("documentos") === "true";
    const quantidadeDocumentos = parseInt(searchParams.get("quantidade") || "10");

    console.log("🌱 Iniciando seed da base de dados...");

    // ========================================
    // 1. UTILIZADORES
    // ========================================
    console.log("👤 Criando utilizadores...");
    
    const adminPasswordHash = await hashPassword("admin123");
    const admin = await db.utilizador.upsert({
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
    const gestor = await db.utilizador.upsert({
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
    const operador = await db.utilizador.upsert({
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

    // ========================================
    // 2. EMPRESA
    // ========================================
    console.log("🏢 Criando empresa...");
    
    const empresa = await db.empresa.upsert({
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
        numeroCertificado: "0000",
      },
    });

    // ========================================
    // 3. TAXAS DE IVA
    // ========================================
    console.log("📊 Criando taxas de IVA...");
    
    const taxasIVA = await Promise.all([
      db.taxaIVA.upsert({
        where: { id: "iva-normal" },
        update: {},
        create: {
          id: "iva-normal",
          codigo: "NOR",
          descricao: "Taxa Normal - Continente",
          taxa: 23,
          tipo: "NOR",
        },
      }),
      db.taxaIVA.upsert({
        where: { id: "iva-intermedia" },
        update: {},
        create: {
          id: "iva-intermedia",
          codigo: "INT",
          descricao: "Taxa Intermédia - Continente",
          taxa: 13,
          tipo: "INT",
        },
      }),
      db.taxaIVA.upsert({
        where: { id: "iva-reduzida" },
        update: {},
        create: {
          id: "iva-reduzida",
          codigo: "RED",
          descricao: "Taxa Reduzida - Continente",
          taxa: 6,
          tipo: "RED",
        },
      }),
      db.taxaIVA.upsert({
        where: { id: "iva-normal-madeira" },
        update: {},
        create: {
          id: "iva-normal-madeira",
          codigo: "NOR_MA",
          descricao: "Taxa Normal - Madeira",
          taxa: 22,
          tipo: "NOR",
        },
      }),
      db.taxaIVA.upsert({
        where: { id: "iva-normal-acores" },
        update: {},
        create: {
          id: "iva-normal-acores",
          codigo: "NOR_AC",
          descricao: "Taxa Normal - Açores",
          taxa: 18,
          tipo: "NOR",
        },
      }),
    ]);

    // ========================================
    // 4. ISENÇÕES DE IVA
    // ========================================
    console.log("📋 Criando isenções de IVA...");
    
    const isencoes = await Promise.all([
      db.isencaoIVA.upsert({
        where: { id: "isencao-m01" },
        update: {},
        create: {
          id: "isencao-m01",
          codigo: "M01",
          descricao: "Não sujeito - Art. 2.º CIVA",
          motivo: "Operação não sujeita a IVA",
        },
      }),
      db.isencaoIVA.upsert({
        where: { id: "isencao-m02" },
        update: {},
        create: {
          id: "isencao-m02",
          codigo: "M02",
          descricao: "Isento - Art. 6.º CIVA",
          motivo: "Isenção prevista no Art. 6.º do CIVA",
        },
      }),
      db.isencaoIVA.upsert({
        where: { id: "isencao-m04" },
        update: {},
        create: {
          id: "isencao-m04",
          codigo: "M04",
          descricao: "Isento - Art. 13.º CIVA",
          motivo: "Isenção prevista no Art. 13.º do CIVA",
        },
      }),
      db.isencaoIVA.upsert({
        where: { id: "isencao-m07" },
        update: {},
        create: {
          id: "isencao-m07",
          codigo: "M07",
          descricao: "Isento - Regime de não sujeição",
          motivo: "Regime particular de não sujeição",
        },
      }),
      db.isencaoIVA.upsert({
        where: { id: "isencao-m15" },
        update: {},
        create: {
          id: "isencao-m15",
          codigo: "M15",
          descricao: "Isento - Exportação",
          motivo: "Exportação de bens e serviços",
        },
      }),
      db.isencaoIVA.upsert({
        where: { id: "isencao-m99" },
        update: {},
        create: {
          id: "isencao-m99",
          codigo: "M99",
          descricao: "Isento - Outras isenções",
          motivo: "Outras isenções não especificadas",
        },
      }),
    ]);

    // ========================================
    // 5. SÉRIES DE DOCUMENTOS
    // ========================================
    console.log("📁 Criando séries de documentos...");
    
    const series = await Promise.all([
      db.serie.upsert({
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
      db.serie.upsert({
        where: { id: "serie-faturas-2025" },
        update: {},
        create: {
          id: "serie-faturas-2025",
          codigo: "F2025",
          descricao: "Faturas 2025",
          tipoDocumento: "FATURA",
          prefixo: "F",
          numeroAtual: 0,
          codigoValidacaoAT: "DEMO124",
          ano: 2025,
          dataInicio: new Date("2025-01-01"),
          ativo: true,
        },
      }),
      db.serie.upsert({
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
      db.serie.upsert({
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
      db.serie.upsert({
        where: { id: "serie-nd-2024" },
        update: {},
        create: {
          id: "serie-nd-2024",
          codigo: "ND2024",
          descricao: "Notas de Débito 2024",
          tipoDocumento: "NOTA_DEBITO",
          prefixo: "ND",
          numeroAtual: 0,
          codigoValidacaoAT: "DEMO101",
          ano: 2024,
          dataInicio: new Date("2024-01-01"),
          ativo: true,
        },
      }),
      db.serie.upsert({
        where: { id: "serie-recibos-2024" },
        update: {},
        create: {
          id: "serie-recibos-2024",
          codigo: "R2024",
          descricao: "Recibos 2024",
          tipoDocumento: "RECIBO",
          prefixo: "R",
          numeroAtual: 0,
          codigoValidacaoAT: "DEMO202",
          ano: 2024,
          dataInicio: new Date("2024-01-01"),
          ativo: true,
        },
      }),
    ]);

    // ========================================
    // 6. CLIENTES
    // ========================================
    console.log("👥 Criando clientes...");
    
    const clientesData = [
      { codigo: "C001", nome: "Empresa ABC Lda", nif: "509123456", morada: "Rua das Flores, 123", codigoPostal: "1000-001", localidade: "Lisboa", pais: "PT", telefone: "211234567", email: "contabilidade@abc.pt" },
      { codigo: "C002", nome: "Comercial XYZ SA", nif: "508765432", morada: "Av. Principal, 45", codigoPostal: "4000-001", localidade: "Porto", pais: "PT", telefone: "229876543", email: "geral@xyz.pt" },
      { codigo: "C003", nome: "Tecnologias Web Lda", nif: "507111222", morada: "Rua dos Programadores, 78", codigoPostal: "3000-001", localidade: "Coimbra", pais: "PT", telefone: "239111222", email: "info@techweb.pt" },
      { codigo: "C004", nome: "Consultores Financeiros SA", nif: "506333444", morada: "Av. da Liberdade, 200", codigoPostal: "1250-001", localidade: "Lisboa", pais: "PT", telefone: "213334444", email: "finance@consult.pt" },
      { codigo: "C005", nome: "Indústrias Creative Lda", nif: "505555666", morada: "Parque Industrial, Lote 5", codigoPostal: "4700-001", localidade: "Braga", pais: "PT", telefone: "253555666", email: "geral@creative.pt" },
      { codigo: "C006", nome: "Serviços Expresso SA", nif: "504777888", morada: "Rua Comercial, 50", codigoPostal: "8000-001", localidade: "Faro", pais: "PT", telefone: "289777888", email: "expreso@serv.pt" },
      { codigo: "C007", nome: "Global Solutions Lda", nif: "503999000", morada: "Centro Empresarial, Bloco A", codigoPostal: "4400-001", localidade: "Vila Nova de Gaia", pais: "PT", telefone: "22999000", email: "contact@global.pt" },
      { codigo: "C008", nome: "StartUp Innovation SA", nif: "502111333", morada: "Hub de Startups, Sala 10", codigoPostal: "1600-001", localidade: "Lisboa", pais: "PT", telefone: "21111333", email: "hello@startup.pt" },
      { codigo: "C009", nome: "Comércio Tradicional Lda", nif: "501444555", morada: "Rua Histórica, 25", codigoPostal: "9600-001", localidade: "Ponta Delgada", pais: "PT", telefone: "296444555", email: "tradicional@comercio.pt" },
      { codigo: "C010", nome: "Cliente Consumidor Final", nif: "999999990", morada: "Consumidor Final", codigoPostal: "0000-000", localidade: "Portugal", pais: "PT", telefone: "", email: "" },
    ];

    const clientes = await Promise.all(
      clientesData.map((cliente, index) =>
        db.cliente.upsert({
          where: { id: `cliente-${index + 1}` },
          update: {},
          create: {
            id: `cliente-${index + 1}`,
            ...cliente,
          },
        })
      )
    );

    // ========================================
    // 7. ARTIGOS
    // ========================================
    console.log("📦 Criando artigos...");
    
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
      { codigo: "A011", descricao: "Livros Técnicos", tipo: "PRODUTO" as const, precoUnitario: 45.00, unidade: "UNI", taxaIVAId: "iva-reduzida" },
      { codigo: "A012", descricao: "Serviço de Hosting", tipo: "SERVICO" as const, precoUnitario: 29.90, unidade: "MÊS", taxaIVAId: "iva-normal" },
      { codigo: "A013", descricao: "Serviço de Cloud", tipo: "SERVICO" as const, precoUnitario: 99.00, unidade: "MÊS", taxaIVAId: "iva-normal" },
      { codigo: "A014", descricao: "Consultoria Financeira", tipo: "SERVICO" as const, precoUnitario: 100.00, unidade: "H", taxaIVAId: "iva-intermedia" },
      { codigo: "A015", descricao: "Auditoria de Sistemas", tipo: "SERVICO" as const, precoUnitario: 150.00, unidade: "H", taxaIVAId: "iva-normal" },
    ];

    const artigos = await Promise.all(
      artigosData.map((artigo, index) =>
        db.artigo.upsert({
          where: { id: `artigo-${index + 1}` },
          update: {},
          create: {
            id: `artigo-${index + 1}`,
            ...artigo,
          },
        })
      )
    );

    // ========================================
    // 8. DOCUMENTOS (opcional)
    // ========================================
    let documentos: unknown[] = [];
    
    if (incluirDocumentos) {
      console.log(`📄 Criando ${quantidadeDocumentos} documentos...`);
      
      const serieFaturas = await db.serie.findUnique({ where: { id: "serie-faturas-2024" } });
      const serieFR = await db.serie.findUnique({ where: { id: "serie-faturas-recibo-2024" } });
      
      if (serieFaturas && serieFR) {
        let hashAnterior = "";
        let numeroFatura = 1;
        let numeroFR = 1;

        for (let i = 0; i < quantidadeDocumentos; i++) {
          // Alternar entre séries e clientes
          const serie = i % 3 === 0 ? serieFR : serieFaturas;
          const cliente = clientes[i % (clientes.length - 1)]; // Excluir consumidor final
          const artigo = artigos[i % artigos.length];
          
          const quantidade = Math.floor(Math.random() * 10) + 1;
          const precoUnitario = artigo.precoUnitario?.toNumber() || 50;
          const totalBase = quantidade * precoUnitario;
          const taxaIVA = artigos.find(a => a.id === artigo.id)?.taxaIVAId === "iva-reduzida" ? 6 : 23;
          const totalIVA = totalBase * (taxaIVA / 100);
          const totalLiquido = totalBase + totalIVA;

          // Determinar número do documento
          const numero = serie.tipoDocumento === "FATURA_RECIBO" ? numeroFR++ : numeroFatura++;
          const numeroFormatado = `${serie.prefixo}${serie.ano}-${numero.toString().padStart(4, "0")}`;
          const atcud = `${serie.codigoValidacaoAT}-${numero}`;

          // Calcular hash
          const hash = calcularHashDocumento({
            numeroDocumento: numeroFormatado, dataCriacao: new Date(),
            dataEmissao: new Date(),
            totalLiquido,
            hashAnterior,
          });

          // Data aleatória nos últimos 30 dias
          const dataEmissao = new Date();
          dataEmissao.setDate(dataEmissao.getDate() - Math.floor(Math.random() * 30));

          const documento = await db.documento.create({
            data: {
              numero,
              numeroFormatado,
              tipo: serie.tipoDocumento,
              serieId: serie.id,
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
                  numero: 1,
                  artigoId: artigo.id,
                  descricaoArtigo: artigo.descricao,
                  quantidade,
                  precoUnitario,
                  taxaIVA,
                  valorIVA: totalIVA,
                  base: totalBase,
                  total: totalLiquido,
                },
              },
            },
          });

          hashAnterior = hash;
          documentos.push(documento);

          // Atualizar número atual da série
          await db.serie.update({
            where: { id: serie.id },
            data: { numeroAtual: numero },
          });
        }
      }
    }

    // ========================================
    // 9. REGISTAR AUDITORIA
    // ========================================
    console.log("📝 Registando auditoria...");
    
    await db.auditoria.create({
      data: {
        acao: "SEED",
        entidade: "SISTEMA",
        entidadeId: "seed-inicial",
        utilizadorId: admin.id,
        descricao: "Inicialização de dados de demonstração",
        valoresNovos: {
          taxasIVA: taxasIVA.length,
          isencoes: isencoes.length,
          series: series.length,
          clientes: clientes.length,
          artigos: artigos.length,
          documentos: documentos.length,
        },
      },
    });

    console.log("✅ Seed concluído com sucesso!");

    return NextResponse.json({
      success: true,
      message: "Dados de demonstração criados com sucesso!",
      data: {
        utilizadores: 3,
        empresa: 1,
        taxasIVA: taxasIVA.length,
        isencoes: isencoes.length,
        series: series.length,
        clientes: clientes.length,
        artigos: artigos.length,
        documentos: documentos.length,
        credenciais: {
          admin: { email: "admin@faturaat.pt", password: "admin123" },
          gestor: { email: "gestor@faturaat.pt", password: "gestor123" },
          operador: { email: "operador@faturaat.pt", password: "operador123" },
        },
      },
    });
  } catch (error) {
    console.error("❌ Erro no seed:", error);
    return NextResponse.json(
      { error: "Erro ao criar dados de demonstração", details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Ver status da base de dados
export async function GET() {
  try {
    const counts = {
      utilizadores: await db.utilizador.count(),
      empresa: await db.empresa.count(),
      clientes: await db.cliente.count(),
      artigos: await db.artigo.count(),
      taxasIVA: await db.taxaIVA.count(),
      isencoes: await db.isencaoIVA.count(),
      series: await db.serie.count(),
      documentos: await db.documento.count(),
      linhasDocumento: await db.linhaDocumento.count(),
      auditoria: await db.auditoria.count(),
    };

    return NextResponse.json({
      status: "ok",
      counts,
      hasData: Object.values(counts).some(c => c > 0),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao verificar estado da base de dados" },
      { status: 500 }
    );
  }
}

// DELETE - Limpar base de dados
export async function DELETE() {
  try {
    console.log("🗑️ Limpando base de dados...");

    // Apagar por ordem de dependências
    await db.auditoria.deleteMany();
    await db.linhaDocumento.deleteMany();
    await db.documento.deleteMany();
    await db.pagamento.deleteMany();
    await db.artigo.deleteMany();
    await db.cliente.deleteMany();
    await db.serie.deleteMany();
    await db.isencaoIVA.deleteMany();
    await db.taxaIVA.deleteMany();
    await db.utilizador.deleteMany();
    await db.empresa.deleteMany();

    console.log("✅ Base de dados limpa!");

    return NextResponse.json({
      success: true,
      message: "Base de dados limpa com sucesso!",
    });
  } catch (error) {
    console.error("❌ Erro ao limpar base de dados:", error);
    return NextResponse.json(
      { error: "Erro ao limpar base de dados" },
      { status: 500 }
    );
  }
}
