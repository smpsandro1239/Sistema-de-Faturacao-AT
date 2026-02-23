import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSAFTStructure, getSAFTValidationSummary } from "@/lib/saft-validation";
import { authenticateRequest, temPermissao } from "@/lib/auth";

// GET - Gerar SAF-T XML ou validar
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !temPermissao(auth.user!.perfil, "export")) {
      return NextResponse.json({ error: "Permissões insuficientes para exportar SAF-T" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get("mes") || "1");
    const ano = parseInt(searchParams.get("ano") || new Date().getFullYear().toString());
    const validate = searchParams.get("validate") === "true";

    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59);

    // Buscar empresa
    const empresa = await db.empresa.findFirst();
    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não configurada." },
        { status: 400 }
      );
    }

    // Buscar documentos do período
    const documentos = await db.documento.findMany({
      where: {
        dataEmissao: {
          gte: dataInicio,
          lte: dataFim,
        },
        estado: "EMITIDO",
      },
      include: {
        cliente: true,
        linhas: true,
        serie: true,
      },
    });

    // Buscar clientes únicos
    const clientesUnicos = [...new Set(documentos.map(d => d.clienteId))];
    const clientes = await db.cliente.findMany({
      where: { id: { in: clientesUnicos } },
    });

    // Buscar artigos únicos
    const artigosIds = [...new Set(documentos.flatMap(d => d.linhas.map(l => l.artigoId)).filter(Boolean))] as string[];
    const artigos = await db.artigo.findMany({
      where: { id: { in: artigosIds } },
      include: { taxaIVA: true },
    });

    // Buscar taxas de IVA
    const taxasIVA = await db.taxaIVA.findMany();

    // Gerar XML SAF-T
    const xml = gerarSAFTXML({
      empresa,
      documentos,
      clientes,
      artigos,
      taxasIVA,
      dataInicio,
      dataFim,
    });

    // Se solicitado, retornar validação
    if (validate) {
      const validation = getSAFTValidationSummary(xml);
      return NextResponse.json({
        validation,
        xmlPreview: xml.substring(0, 2000) + "...",
        stats: {
          documentos: documentos.length,
          clientes: clientes.length,
          artigos: artigos.length,
        },
      });
    }

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="SAF-T_${ano}_${mes}.xml"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar SAF-T:", error);
    return NextResponse.json(
      { error: "Erro ao gerar SAF-T" },
      { status: 500 }
    );
  }
}

// POST - Validar SAF-T XML
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !temPermissao(auth.user!.perfil, "export")) {
      return NextResponse.json({ error: "Permissões insuficientes para validar SAF-T" }, { status: 403 });
    }

    const body = await request.json();
    const { xmlContent } = body;

    if (!xmlContent) {
      return NextResponse.json(
        { error: "Conteúdo XML não fornecido." },
        { status: 400 }
      );
    }

    const validation = getSAFTValidationSummary(xmlContent);
    
    return NextResponse.json(validation);
  } catch (error) {
    console.error("Erro ao validar SAF-T:", error);
    return NextResponse.json(
      { error: "Erro ao validar SAF-T" },
      { status: 500 }
    );
  }
}

interface SAFTData {
  empresa: {
    nome: string;
    nif: string;
    morada: string;
    codigoPostal: string;
    localidade: string;
  };
  documentos: Array<{
    id: string;
    numeroFormatado: string;
    tipo: string;
    dataEmissao: Date | null;
    hash: string | null;
    atcud: string | null;
    totalBase: number;
    totalIVA: number;
    totalLiquido: number;
    clienteNome: string;
    clienteNif: string;
    linhas: Array<{
      codigoArtigo: string;
      descricaoArtigo: string;
      quantidade: number;
      precoUnitario: number;
      base: number;
      valorIVA: number;
      taxaIVAPercentagem: number;
    }>;
  }>;
  clientes: Array<{
    id: string;
    codigo: string;
    nome: string;
    nif: string;
    morada: string | null;
    codigoPostal: string | null;
    localidade: string | null;
    pais: string;
  }>;
  artigos: Array<{
    id: string;
    codigo: string;
    descricao: string;
    tipo: string;
    precoUnitario: number;
    unidade: string;
  }>;
  taxasIVA: Array<{
    id: string;
    codigo: string;
    descricao: string;
    taxa: number;
  }>;
  dataInicio: Date;
  dataFim: Date;
}

function gerarSAFTXML(data: SAFTData): string {
  const { empresa, documentos, clientes, artigos, taxasIVA, dataInicio, dataFim } = data;

  const formatarData = (data: Date): string => {
    return data.toISOString().split("T")[0];
  };

  const formatarDataHora = (data: Date): string => {
    return data.toISOString();
  };

  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <AuditFileVersion>1.04_01</AuditFileVersion>
    <CompanyID>${empresa.nif}</CompanyID>
    <TaxRegistrationNumber>${empresa.nif}</TaxRegistrationNumber>
    <TaxEntity>Global</TaxEntity>
    <CompanyName>${escapeXML(empresa.nome)}</CompanyName>
    <CompanyAddress>
      <BuildingNumber>1</BuildingNumber>
      <StreetName>${escapeXML(empresa.morada)}</StreetName>
      <AddressDetail>${escapeXML(empresa.morada)}</AddressDetail>
      <City>${escapeXML(empresa.localidade)}</City>
      <PostalCode>${empresa.codigoPostal}</PostalCode>
      <Country>PT</Country>
    </CompanyAddress>
    <FiscalYear>${dataInicio.getFullYear()}</FiscalYear>
    <StartDate>${formatarData(dataInicio)}</StartDate>
    <EndDate>${formatarData(dataFim)}</EndDate>
    <CurrencyCode>EUR</CurrencyCode>
    <DateCreated>${formatarDataHora(new Date())}</DateCreated>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <ProductCompanyTaxID>509123456</ProductCompanyTaxID>
    <SoftwareCertificateNumber>AT/DEMO/2024</SoftwareCertificateNumber>
    <ProductID>FaturaAT - Sistema de Faturação Certificado</ProductID>
    <ProductVersion>1.0.0</ProductVersion>
  </Header>
  
  <MasterFiles>
    <GeneralLedgerAccounts>
      <NumberOfEntries>0</NumberOfEntries>
    </GeneralLedgerAccounts>
    
    <Customer>
      <NumberOfEntries>${clientes.length}</NumberOfEntries>
      ${clientes.map(cliente => `
      <CustomerEntry>
        <CustomerId>${cliente.codigo}</CustomerId>
        <CustomerTaxID>${cliente.nif}</CustomerTaxID>
        <CompanyName>${escapeXML(cliente.nome)}</CompanyName>
        <BillingAddress>
          <AddressDetail>${escapeXML(cliente.morada || "N/A")}</AddressDetail>
          <City>${escapeXML(cliente.localidade || "N/A")}</City>
          <PostalCode>${cliente.codigoPostal || "0000-000"}</PostalCode>
          <Country>${cliente.pais}</Country>
        </BillingAddress>
        <SelfBillingIndicator>0</SelfBillingIndicator>
      </CustomerEntry>`).join("")}
    </Customer>
    
    <Product>
      <NumberOfEntries>${artigos.length}</NumberOfEntries>
      ${artigos.map(artigo => `
      <ProductEntry>
        <ProductCode>${artigo.codigo}</ProductCode>
        <ProductDescription>${escapeXML(artigo.descricao)}</ProductDescription>
        <ProductNumberCode>${artigo.codigo}</ProductNumberCode>
        <ProductType>${artigo.tipo === "SERVICO" ? "S" : "P"}</ProductType>
      </ProductEntry>`).join("")}
    </Product>
    
    <TaxTable>
      <NumberOfEntries>${taxasIVA.length}</NumberOfEntries>
      ${taxasIVA.map(taxa => `
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>PT</TaxCountryRegion>
        <TaxCode>${taxa.codigo}</TaxCode>
        <Description>${escapeXML(taxa.descricao)}</Description>
        <TaxPercentage>${taxa.taxa}</TaxPercentage>
      </TaxTableEntry>`).join("")}
    </TaxTable>
  </MasterFiles>
  
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>${documentos.length}</NumberOfEntries>
      <TotalDebit>0.00</TotalDebit>
      <TotalCredit>${documentos.reduce((sum, d) => sum + d.totalLiquido, 0).toFixed(2)}</TotalCredit>
      ${documentos.map(doc => `
      <Invoice>
        <InvoiceNo>${doc.numeroFormatado}</InvoiceNo>
        <ATCUD>${doc.atcud || ""}</ATCUD>
        <DocumentStatus>
          <InvoiceStatus>N</InvoiceStatus>
          <InvoiceStatusDate>${formatarDataHora(doc.dataEmissao || new Date())}</InvoiceStatusDate>
          <SourceID>System</SourceID>
          <SourceBilling>P</SourceBilling>
        </DocumentStatus>
        <Hash>${doc.hash || ""}</Hash>
        <HashControl>1</HashControl>
        <Period>${dataInicio.getMonth() + 1}</Period>
        <InvoiceDate>${formatarData(doc.dataEmissao || new Date())}</InvoiceDate>
        <InvoiceType>${doc.tipo === "FATURA" ? "FT" : doc.tipo === "NOTA_CREDITO" ? "NC" : "FT"}</InvoiceType>
        <SelfBillingIndicator>0</SelfBillingIndicator>
        <SystemEntryDate>${formatarDataHora(doc.dataEmissao || new Date())}</SystemEntryDate>
        <CustomerID>${doc.clienteNif}</CustomerID>
        <Line>
          <LineNumber>1</LineNumber>
          <ProductCode>GERAL</ProductCode>
          <ProductDescription>Produtos/Serviços</ProductDescription>
          <Quantity>1</Quantity>
          <UnitOfMeasure>UNI</UnitOfMeasure>
          <UnitPrice>${doc.totalBase.toFixed(2)}</UnitPrice>
          <TaxPointDate>${formatarData(doc.dataEmissao || new Date())}</TaxPointDate>
          <Description>Produtos/Serviços</Description>
          <DebitAmount>0.00</DebitAmount>
          <Tax>
            <TaxType>IVA</TaxType>
            <TaxCountryRegion>PT</TaxCountryRegion>
            <TaxCode>NOR</TaxCode>
            <TaxPercentage>23.00</TaxPercentage>
          </Tax>
        </Line>
        <DocumentTotals>
          <TaxPayable>${doc.totalIVA.toFixed(2)}</TaxPayable>
          <NetTotal>${doc.totalBase.toFixed(2)}</NetTotal>
          <GrossTotal>${doc.totalLiquido.toFixed(2)}</GrossTotal>
        </DocumentTotals>
      </Invoice>`).join("")}
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`;
}
