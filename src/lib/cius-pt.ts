/**
 * Biblioteca para suporte ao formato CIUS-PT (UBL 2.1)
 * Faturação Eletrónica Estruturada B2G (Business-to-Government)
 * Obrigatório progressivo em Portugal a partir de 2027
 */

interface CIUSDocument {
  numero: string;
  data: Date;
  tipo: string;
  moeda: string;
  emissor: {
    nif: string;
    nome: string;
    morada: string;
    cpostal: string;
    localidade: string;
  };
  receptor: {
    nif: string;
    nome: string;
    morada?: string;
    cpostal?: string;
    localidade?: string;
  };
  linhas: Array<{
    descricao: string;
    quantidade: number;
    precoUnitario: number;
    taxaIVA: number;
    base: number;
  }>;
  totalBase: number;
  totalIVA: number;
  totalLiquido: number;
}

/**
 * Gera o XML no formato UBL 2.1 (Base para CIUS-PT)
 * Nota: Implementação simplificada para preparação técnica
 */
export function gerarXMLCiusPT(doc: CIUSDocument): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:feap.pt:cius-pt:v1.0</cbc:CustomizationID>
    <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
    <cbc:ID>${doc.numero}</cbc:ID>
    <cbc:IssueDate>${doc.data.toISOString().split('T')[0]}</cbc:IssueDate>
    <cbc:DueDate>${new Date(doc.data.getTime() + 30*24*60*60*1000).toISOString().split('T')[0]}</cbc:DueDate>
    <cbc:InvoiceTypeCode>${doc.tipo === 'FATURA' ? '380' : '381'}</cbc:InvoiceTypeCode>
    <cbc:Note>Processado por programa certificado</cbc:Note>
    <cbc:DocumentCurrencyCode>${doc.moeda || 'EUR'}</cbc:DocumentCurrencyCode>
    <cbc:BuyerReference>ReferenciaComprador123</cbc:BuyerReference>

    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${doc.emissor.nome}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${doc.emissor.morada}</cbc:StreetName>
                <cbc:CityName>${doc.emissor.localidade}</cbc:CityName>
                <cbc:PostalZone>${doc.emissor.cpostal}</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>PT</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>PT${doc.emissor.nif}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${doc.emissor.nome}</cbc:RegistrationName>
                <cbc:CompanyID>PT${doc.emissor.nif}</cbc:CompanyID>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${doc.receptor.nome}</cbc:Name>
            </cac:PartyName>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>PT${doc.receptor.nif}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="EUR">${doc.totalIVA.toFixed(2)}</cbc:TaxAmount>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="EUR">${doc.totalBase.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="EUR">${doc.totalBase.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="EUR">${doc.totalLiquido.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="EUR">${doc.totalLiquido.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>

    ${doc.linhas.map((l, i) => `
    <cac:InvoiceLine>
        <cbc:ID>${i + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="UNIT">${l.quantidade}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="EUR">${l.base.toFixed(2)}</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Name>${l.descricao}</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>${l.taxaIVA}</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="EUR">${l.precoUnitario.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    `).join('')}
</Invoice>`;
  return xml;
}
