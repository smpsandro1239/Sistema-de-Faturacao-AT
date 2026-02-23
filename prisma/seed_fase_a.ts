import { PrismaClient, TipoDocumento, EstadoOrcamento, EstadoEncomendaCompra } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de validação da FASE A...");

  // 1. Popular ArtigoArmazemStock
  console.log("📦 Populando ArtigoArmazemStock...");
  const artigos = await prisma.artigo.findMany();
  const armazens = await prisma.armazem.findMany();

  for (const artigo of artigos) {
    for (const armazem of armazens) {
      await prisma.artigoArmazemStock.upsert({
        where: {
          artigoId_armazemId: {
            artigoId: artigo.id,
            armazemId: armazem.id,
          },
        },
        update: {},
        create: {
          artigoId: artigo.id,
          armazemId: armazem.id,
          quantidade: artigo.controlaStock ? Math.floor(Math.random() * 50) : 0,
        },
      });
    }
  }

  // 2. Criar Orçamentos
  console.log("📑 Criando orçamentos de exemplo...");
  const clientes = await prisma.cliente.findMany();
  const utilizador = await prisma.utilizador.findFirst();

  if (clientes.length > 0 && utilizador) {
    for (let i = 1; i <= 3; i++) {
      const cliente = clientes[i % clientes.length];
      const numero = i;
      const numeroFormatado = `ORC 2024/${String(numero).padStart(5, "0")}`;

      await prisma.orcamento.create({
        data: {
          numero,
          numeroFormatado,
          clienteId: cliente.id,
          clienteNome: cliente.nome,
          clienteNif: cliente.nif,
          dataOrcamento: new Date(),
          estado: i === 1 ? EstadoOrcamento.RASCUNHO : i === 2 ? EstadoOrcamento.ENVIADO : EstadoOrcamento.ACEITE,
          totalBase: 100 * i,
          totalIVA: 23 * i,
          totalLiquido: 123 * i,
          utilizadorId: utilizador.id,
          linhas: {
            create: {
              codigoArtigo: artigos[0].codigo,
              descricaoArtigo: artigos[0].descricao,
              quantidade: i,
              precoUnitario: 100,
              taxaIVAId: artigos[0].taxaIVAId,
              taxaIVAPercentagem: 23,
              base: 100 * i,
              valorIVA: 23 * i,
              ordem: 1,
            },
          },
        },
      });
    }
  }

  // 3. Criar Encomendas de Compra
  console.log("🛒 Criando encomendas de compra...");
  const fornecedores = await prisma.fornecedor.findMany();

  if (fornecedores.length > 0 && utilizador) {
    for (let i = 1; i <= 2; i++) {
      const fornecedor = fornecedores[i % fornecedores.length];
      const numero = i;
      const numeroFormatado = `EC 2024/${String(numero).padStart(5, "0")}`;

      await prisma.encomendaCompra.create({
        data: {
          numero,
          numeroFormatado,
          fornecedorId: fornecedor.id,
          fornecedorNome: fornecedor.nome,
          fornecedorNif: fornecedor.nif,
          dataEncomenda: new Date(),
          estado: i === 1 ? EstadoEncomendaCompra.RASCUNHO : EstadoEncomendaCompra.ENVIADA,
          totalBase: 500 * i,
          totalIVA: 115 * i,
          totalLiquido: 615 * i,
          utilizadorId: utilizador.id,
          linhas: {
            create: {
              codigoArtigo: artigos[i % artigos.length].codigo,
              descricaoArtigo: artigos[i % artigos.length].descricao,
              quantidade: 10 * i,
              precoUnitario: 50,
              taxaIVAId: artigos[i % artigos.length].taxaIVAId,
              taxaIVAPercentagem: 23,
              base: 500 * i,
              valorIVA: 115 * i,
              ordem: 1,
            },
          },
        },
      });
    }
  }

  console.log("✅ Seed da FASE A concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
