/**
 * Biblioteca para Suporte a Faturação Eletrónica Estruturada (CIUS-PT / UBL 2.1)
 * Requisito para contratos públicos (B2G) em Portugal.
 */

interface DocumentoUBL {
  id: string;
  tipo: string;
  data: string;
  emissor: {
    nif: string;
    nome: string;
  };
  recetor: {
    nif: string;
    nome: string;
  };
  linhas: Array<{
    descricao: string;
    quantidade: number;
    preco: number;
    taxa: number;
  }>;
  totalLiquido: number;
}

/**
 * Gera o XML estruturado em formato UBL 2.1
 */
export function gerarUBL21(data: DocumentoUBL): string {
  // Simplificação inicial para estrutura XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:feap.pt:cius-pt:v1.0</cbc:CustomizationID>
    <cbc:ID>${data.id}</cbc:ID>
    <cbc:IssueDate>${data.data}</cbc:IssueDate>
    <cbc:InvoiceTypeCode>${data.tipo === 'FATURA' ? '380' : '381'}</cbc:InvoiceTypeCode>

    <cac:AccountingSupplierParty>
        <cac:Party>
            <cbc:EndpointID schemeID="0088">${data.emissor.nif}</cbc:EndpointID>
            <cac:PartyName><cbc:Name>${data.emissor.nome}</cbc:Name></cac:PartyName>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyName><cbc:Name>${data.recetor.nome}</cbc:Name></cac:PartyName>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${data.recetor.nif}</cbc:CompanyID>
                <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:LegalMonetaryTotal>
        <cbc:PayableAmount currencyID="EUR">${data.totalLiquido.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>

    ${data.linhas.map((l, i) => `
    <cac:InvoiceLine>
        <cbc:ID>${i + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="UN">${l.quantidade}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="EUR">${(l.quantidade * l.preco).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Description>${l.descricao}</cbc:Description>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="EUR">${l.preco.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    `).join('')}
</Invoice>`;

  return xml;
}
