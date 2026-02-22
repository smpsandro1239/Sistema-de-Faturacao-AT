/**
 * Validação SAF-T (PT) - Schema 1.04_01
 * Validação completa de estrutura XML conforme requisitos da AT
 * Portaria n.º 302/2016 e especificações técnicas oficiais
 */

export interface ValidationResult {
  isValid: boolean;
  errors: SAFTError[];
  warnings: SAFTWarning[];
  stats: SAFTStats;
}

export interface SAFTError {
  code: string;
  message: string;
  location: string;
  severity: 'critical' | 'error';
}

export interface SAFTWarning {
  code: string;
  message: string;
  location: string;
}

export interface SAFTStats {
  headerTags: number;
  masterFilesTags: number;
  sourceDocsTags: number;
  invoices: number;
  customers: number;
  products: number;
  taxEntries: number;
}

// Tags obrigatórias do Header (SAF-T PT 1.04_01)
const REQUIRED_HEADER_TAGS = [
  'AuditFileVersion',
  'CompanyID',
  'TaxRegistrationNumber',
  'TaxEntity',
  'CompanyName',
  'CompanyAddress',
  'FiscalYear',
  'StartDate',
  'EndDate',
  'CurrencyCode',
  'DateCreated',
  'TaxAccountingBasis',
  'ProductCompanyTaxID',
  'SoftwareCertificateNumber',
  'ProductID',
  'ProductVersion',
];

// Tags obrigatórias em CompanyAddress
const REQUIRED_ADDRESS_TAGS = [
  'BuildingNumber',
  'StreetName',
  'AddressDetail',
  'City',
  'PostalCode',
  'Country',
];

// Tags obrigatórias nas faturas
const REQUIRED_INVOICE_TAGS = [
  'InvoiceNo',
  'ATCUD',
  'DocumentStatus',
  'Hash',
  'HashControl',
  'Period',
  'InvoiceDate',
  'InvoiceType',
  'SelfBillingIndicator',
  'SystemEntryDate',
  'CustomerID',
  'Line',
  'DocumentTotals',
];

// Tags obrigatórias em DocumentStatus
const REQUIRED_STATUS_TAGS = [
  'InvoiceStatus',
  'InvoiceStatusDate',
  'SourceID',
  'SourceBilling',
];

// Tags obrigatórias em cada Line
const REQUIRED_LINE_TAGS = [
  'LineNumber',
  'ProductCode',
  'ProductDescription',
  'Quantity',
  'UnitOfMeasure',
  'UnitPrice',
  'TaxPointDate',
  'Description',
  'Tax',
];

// Tags obrigatórias em Tax (linha)
const REQUIRED_LINE_TAX_TAGS = [
  'TaxType',
  'TaxCountryRegion',
  'TaxCode',
];

// Tags obrigatórias em DocumentTotals
const REQUIRED_TOTALS_TAGS = [
  'TaxPayable',
  'NetTotal',
  'GrossTotal',
];

// Tags obrigatórias em Customer
const REQUIRED_CUSTOMER_TAGS = [
  'CustomerId',
  'CustomerTaxID',
  'CompanyName',
  'BillingAddress',
  'SelfBillingIndicator',
];

// Tags obrigatórias em Product
const REQUIRED_PRODUCT_TAGS = [
  'ProductCode',
  'ProductDescription',
  'ProductNumberCode',
  'ProductType',
];

// Tags obrigatórias em TaxTableEntry
const REQUIRED_TAX_TAGS = [
  'TaxType',
  'TaxCountryRegion',
  'TaxCode',
  'Description',
];

// Tipos de documento válidos (InvoiceType)
const VALID_INVOICE_TYPES = [
  'FT',   // Fatura
  'FR',   // Fatura Recibo
  'NC',   // Nota de Crédito
  'ND',   // Nota de Débito
  'FS',   // Fatura Simplificada
  'RG',   // Recibo
  'NE',   // Nota de Encomenda
  'OU',   // Outro
  'GD',   // Guia de Devolução
  'GT',   // Guia de Transporte
  'GA',   // Guia de Movimentação de Ativos Próprios
  'GC',   // Guia de Consignação
  'GR',   // Guia de Receção
  'NS',   // Nota de Serviço
];

// Códigos de IVA válidos em Portugal
const VALID_TAX_CODES = [
  'NOR',  // Normal (23%)
  'INT',  // Intermediária (13%)
  'RED',  // Reduzida (6%)
  'ISE',  // Isento
  'MIN',  // Mínima
  'OUT',  // Outra
];

// Códigos de isenção válidos
const VALID_EXEMPTION_CODES = [
  'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10',
  'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19', 'M20',
  'M99',
];

// Códigos de país válidos (ISO 3166-1 alpha-2)
const VALID_COUNTRY_CODES = [
  'PT', 'ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'AT', 'BG', 'CY', 'CZ', 'DK',
  'EE', 'FI', 'GR', 'HR', 'HU', 'IE', 'LV', 'LT', 'LU', 'MT', 'PL', 'RO',
  'SK', 'SI', 'SE', 'GB', 'US', 'BR', 'AO', 'MZ', 'CV', 'GW', 'TL', 'MO',
  'ST', 'CH', 'NO', 'IS', 'LI', 'MC', 'AD', 'SM', 'VA',
];

/**
 * Extrai o valor de uma tag XML
 */
function extractTagValue(xml: string, tagName: string, startIndex: number = 0): string | null {
  const regex = new RegExp(`<${tagName}>([^<]*)</${tagName}>`, 'g');
  regex.lastIndex = startIndex;
  const match = regex.exec(xml);
  return match ? match[1] : null;
}

/**
 * Extrai todas as ocorrências de uma tag
 */
function extractAllTagValues(xml: string, tagName: string): string[] {
  const values: string[] = [];
  const regex = new RegExp(`<${tagName}>([^<]*)</${tagName}>`, 'g');
  let match;
  while ((match = regex.exec(xml)) !== null) {
    values.push(match[1]);
  }
  return values;
}

/**
 * Conta ocorrências de uma tag
 */
function countTag(xml: string, tagName: string): number {
  const regex = new RegExp(`<${tagName}>`, 'g');
  const matches = xml.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Valida se é um NIF português válido
 */
export function validateNIF(nif: string): boolean {
  if (!/^\d{9}$/.test(nif)) return false;
  
  const firstDigit = parseInt(nif[0]);
  if (![1, 2, 3, 5, 6, 8, 9].includes(firstDigit)) return false;
  
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(nif[i]) * (9 - i);
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(nif[8]) === checkDigit;
}

/**
 * Valida formato de data (YYYY-MM-DD)
 */
export function validateDateFormat(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Valida formato de data/hora (ISO 8601)
 */
function validateDateTimeFormat(dateTimeStr: string): boolean {
  // Aceita formatos: YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DDTHH:mm:ss.sssZ
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
  return regex.test(dateTimeStr);
}

/**
 * Valida hash SHA-256
 */
function validateHash(hash: string): { isValid: boolean; error?: string } {
  if (!hash || hash.length === 0) {
    return { isValid: false, error: 'Hash vazio' };
  }
  
  if (hash.length !== 64) {
    return { isValid: false, error: `Hash com ${hash.length} caracteres (esperado: 64)` };
  }
  
  if (!/^[A-Fa-f0-9]+$/.test(hash)) {
    return { isValid: false, error: 'Hash contém caracteres inválidos (deve ser hexadecimal)' };
  }
  
  return { isValid: true };
}

/**
 * Valida ATCUD (CódigoValidaçãoSérie-NúmeroDocumento)
 */
function validateATCUD(atcud: string): { isValid: boolean; error?: string } {
  if (!atcud || atcud.length === 0) {
    return { isValid: false, error: 'ATCUD vazio' };
  }
  
  // Formato: CodigoValidacao-Número (ex: ABC123-1)
  if (!/^.+-.+$/.test(atcud)) {
    return { isValid: false, error: 'Formato inválido (deve ser CodigoValidacao-Numero)' };
  }
  
  return { isValid: true };
}

/**
 * Valida valor monetário
 */
function validateMonetaryValue(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
}

/**
 * Valida a estrutura básica do XML SAF-T
 */
export function validateSAFTStructure(xmlContent: string): ValidationResult {
  const errors: SAFTError[] = [];
  const warnings: SAFTWarning[] = [];
  const stats: SAFTStats = {
    headerTags: 0,
    masterFilesTags: 0,
    sourceDocsTags: 0,
    invoices: 0,
    customers: 0,
    products: 0,
    taxEntries: 0,
  };

  // ========================================
  // 1. Validações de Estrutura Global
  // ========================================
  
  // Verificar declaração XML
  if (!xmlContent.startsWith('<?xml')) {
    errors.push({
      code: 'XML001',
      message: 'Falta declaração XML no início do ficheiro',
      location: 'Início do ficheiro',
      severity: 'critical',
    });
  }

  // Verificar encoding UTF-8
  if (!xmlContent.includes('encoding="UTF-8"') && !xmlContent.includes("encoding='UTF-8'")) {
    warnings.push({
      code: 'XML002',
      message: 'Encoding UTF-8 não especificado na declaração XML',
      location: 'Declaração XML',
    });
  }

  // Verificar elemento raiz
  if (!xmlContent.includes('<AuditFile')) {
    errors.push({
      code: 'XML003',
      message: 'Elemento raiz <AuditFile> não encontrado',
      location: 'Estrutura global',
      severity: 'critical',
    });
    return { isValid: false, errors, warnings, stats };
  }

  // Verificar namespace oficial
  if (!xmlContent.includes('xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01"')) {
    errors.push({
      code: 'XML004',
      message: 'Namespace SAF-T PT 1.04_01 não encontrado ou incorreto. Deve ser: urn:OECD:StandardAuditFile-Tax:PT_1.04_01',
      location: 'Elemento AuditFile',
      severity: 'critical',
    });
  }

  // Verificar referência ao XSD (opcional mas recomendado)
  if (!xmlContent.includes('xsi:schemaLocation')) {
    warnings.push({
      code: 'XML005',
      message: 'Referência ao XSD não encontrada (xsi:schemaLocation)',
      location: 'Elemento AuditFile',
    });
  }

  // ========================================
  // 2. Validações do Header
  // ========================================
  
  const headerStart = xmlContent.indexOf('<Header>');
  const headerEnd = xmlContent.indexOf('</Header>');
  
  if (headerStart === -1) {
    errors.push({
      code: 'HDR001',
      message: 'Secção <Header> não encontrada',
      location: 'Estrutura global',
      severity: 'critical',
    });
  } else {
    const headerContent = xmlContent.substring(headerStart, headerEnd + 9);
    stats.headerTags = countTag(headerContent, '') - 2; // Descontar Header
    
    // Verificar cada tag obrigatória do Header
    REQUIRED_HEADER_TAGS.forEach(tag => {
      if (!headerContent.includes(`<${tag}>`)) {
        errors.push({
          code: 'HDR002',
          message: `Tag obrigatória <${tag}> não encontrada no Header`,
          location: 'Header',
          severity: 'error',
        });
      }
    });

    // Validar AuditFileVersion
    const version = extractTagValue(headerContent, 'AuditFileVersion');
    if (version && version !== '1.04_01') {
      warnings.push({
        code: 'HDR003',
        message: `Versão do SAF-T: ${version}. Recomendado: 1.04_01`,
        location: 'Header/AuditFileVersion',
      });
    }

    // Validar TaxRegistrationNumber (NIF)
    const nif = extractTagValue(headerContent, 'TaxRegistrationNumber');
    if (nif) {
      if (!validateNIF(nif)) {
        errors.push({
          code: 'HDR004',
          message: `NIF inválido: ${nif}`,
          location: 'Header/TaxRegistrationNumber',
          severity: 'error',
        });
      }
    }

    // Validar CompanyID
    const companyId = extractTagValue(headerContent, 'CompanyID');
    if (companyId && !validateNIF(companyId)) {
      errors.push({
        code: 'HDR005',
        message: `CompanyID (NIF) inválido: ${companyId}`,
        location: 'Header/CompanyID',
        severity: 'error',
      });
    }

    // Validar datas
    const startDate = extractTagValue(headerContent, 'StartDate');
    const endDate = extractTagValue(headerContent, 'EndDate');
    
    if (startDate && !validateDateFormat(startDate)) {
      errors.push({
        code: 'HDR006',
        message: `StartDate com formato inválido: ${startDate}`,
        location: 'Header/StartDate',
        severity: 'error',
      });
    }
    
    if (endDate && !validateDateFormat(endDate)) {
      errors.push({
        code: 'HDR007',
        message: `EndDate com formato inválido: ${endDate}`,
        location: 'Header/EndDate',
        severity: 'error',
      });
    }

    // Validar FiscalYear
    const fiscalYear = extractTagValue(headerContent, 'FiscalYear');
    if (fiscalYear) {
      const year = parseInt(fiscalYear);
      const currentYear = new Date().getFullYear();
      if (year < 2000 || year > currentYear + 1) {
        warnings.push({
          code: 'HDR008',
          message: `FiscalYear suspeito: ${year}`,
          location: 'Header/FiscalYear',
        });
      }
    }

    // Validar DateCreated
    const dateCreated = extractTagValue(headerContent, 'DateCreated');
    if (dateCreated && !validateDateTimeFormat(dateCreated)) {
      warnings.push({
        code: 'HDR009',
        message: `DateCreated pode não estar no formato ISO 8601: ${dateCreated}`,
        location: 'Header/DateCreated',
      });
    }

    // Validar TaxAccountingBasis
    const taxAccountingBasis = extractTagValue(headerContent, 'TaxAccountingBasis');
    if (taxAccountingBasis && !['F', 'C', 'S', 'M'].includes(taxAccountingBasis)) {
      warnings.push({
        code: 'HDR010',
        message: `TaxAccountingBasis inválido: ${taxAccountingBasis}. Valores válidos: F (Faturação), C (Contabilidade), S (Sociedades), M (Movimento de Mercadorias)`,
        location: 'Header/TaxAccountingBasis',
      });
    }

    // Validar CompanyAddress
    if (headerContent.includes('<CompanyAddress>')) {
      const addrStart = headerContent.indexOf('<CompanyAddress>');
      const addrEnd = headerContent.indexOf('</CompanyAddress>');
      const addrContent = headerContent.substring(addrStart, addrEnd + 16);
      
      REQUIRED_ADDRESS_TAGS.forEach(tag => {
        if (!addrContent.includes(`<${tag}>`)) {
          errors.push({
            code: 'HDR011',
            message: `Tag obrigatória <${tag}> não encontrada em CompanyAddress`,
            location: 'Header/CompanyAddress',
            severity: 'error',
          });
        }
      });

      // Validar Country
      const country = extractTagValue(addrContent, 'Country');
      if (country && !VALID_COUNTRY_CODES.includes(country)) {
        warnings.push({
          code: 'HDR012',
          message: `Código de país inválido: ${country}. Deve ser ISO 3166-1 alpha-2`,
          location: 'Header/CompanyAddress/Country',
        });
      }
    }

    // Validar SoftwareCertificateNumber
    const certNumber = extractTagValue(headerContent, 'SoftwareCertificateNumber');
    if (!certNumber || certNumber.trim() === '') {
      errors.push({
        code: 'HDR013',
        message: 'SoftwareCertificateNumber é obrigatório para software certificado',
        location: 'Header/SoftwareCertificateNumber',
        severity: 'error',
      });
    }

    // Validar ProductCompanyTaxID (NIF do desenvolvedor)
    const productTaxId = extractTagValue(headerContent, 'ProductCompanyTaxID');
    if (productTaxId && !validateNIF(productTaxId)) {
      warnings.push({
        code: 'HDR014',
        message: `ProductCompanyTaxID inválido: ${productTaxId}`,
        location: 'Header/ProductCompanyTaxID',
      });
    }
  }

  // ========================================
  // 3. Validações do MasterFiles
  // ========================================
  
  const mfStart = xmlContent.indexOf('<MasterFiles>');
  const mfEnd = xmlContent.indexOf('</MasterFiles>');
  
  if (mfStart === -1) {
    warnings.push({
      code: 'MF001',
      message: 'Secção <MasterFiles> não encontrada',
      location: 'Estrutura global',
    });
  } else {
    const mfContent = xmlContent.substring(mfStart, mfEnd + 14);
    stats.masterFilesTags = countTag(mfContent, '') - 2;

    // Validar Customer
    if (mfContent.includes('<Customer>')) {
      const customerEntries = mfContent.split('<CustomerEntry>');
      stats.customers = customerEntries.length - 1;
      
      // Verificar NumberOfEntries
      const numEntries = extractTagValue(mfContent, 'NumberOfEntries');
      if (numEntries) {
        const expected = parseInt(numEntries);
        const actual = stats.customers;
        // Contar CustomerEntry corretamente
        const actualCustomers = countTag(mfContent, 'CustomerEntry');
        if (expected !== actualCustomers) {
          errors.push({
            code: 'MF002',
            message: `Customer/NumberOfEntries (${expected}) não corresponde ao número de CustomerEntry (${actualCustomers})`,
            location: 'MasterFiles/Customer',
            severity: 'error',
          });
        }
      }

      // Validar cada CustomerEntry
      const customerRegex = /<CustomerEntry>([\s\S]*?)<\/CustomerEntry>/g;
      let customerMatch;
      let customerIndex = 0;
      while ((customerMatch = customerRegex.exec(mfContent)) !== null) {
        customerIndex++;
        const customerContent = customerMatch[1];
        
        REQUIRED_CUSTOMER_TAGS.forEach(tag => {
          if (!customerContent.includes(`<${tag}>`)) {
            errors.push({
              code: 'MF003',
              message: `Tag obrigatória <${tag}> não encontrada no CustomerEntry #${customerIndex}`,
              location: `MasterFiles/Customer/CustomerEntry[${customerIndex}]`,
              severity: 'error',
            });
          }
        });

        // Validar NIF do cliente
        const customerTaxId = extractTagValue(customerContent, 'CustomerTaxID');
        if (customerTaxId && customerTaxId !== '999999990') {
          // 999999990 é consumidor final
          if (!validateNIF(customerTaxId) && !/^\d{9}$/.test(customerTaxId)) {
            warnings.push({
              code: 'MF004',
              message: `NIF de cliente pode ser inválido: ${customerTaxId}`,
              location: `MasterFiles/Customer/CustomerEntry[${customerIndex}]/CustomerTaxID`,
            });
          }
        }

        // Validar SelfBillingIndicator
        const sbi = extractTagValue(customerContent, 'SelfBillingIndicator');
        if (sbi && !['0', '1'].includes(sbi)) {
          errors.push({
            code: 'MF005',
            message: `SelfBillingIndicator inválido: ${sbi}. Deve ser 0 ou 1`,
            location: `MasterFiles/Customer/CustomerEntry[${customerIndex}]/SelfBillingIndicator`,
            severity: 'error',
          });
        }
      }
    }

    // Validar Product
    if (mfContent.includes('<Product>')) {
      const productEntries = mfContent.split('<ProductEntry>');
      stats.products = productEntries.length - 1;
      
      // Verificar NumberOfEntries
      const numEntries = extractTagValue(mfContent, 'NumberOfEntries');
      
      const actualProducts = countTag(mfContent, 'ProductEntry');
      if (actualProducts > 0) {
        // Validar cada ProductEntry
        const productRegex = /<ProductEntry>([\s\S]*?)<\/ProductEntry>/g;
        let productMatch;
        let productIndex = 0;
        while ((productMatch = productRegex.exec(mfContent)) !== null) {
          productIndex++;
          const productContent = productMatch[1];
          
          REQUIRED_PRODUCT_TAGS.forEach(tag => {
            if (!productContent.includes(`<${tag}>`)) {
              errors.push({
                code: 'MF006',
                message: `Tag obrigatória <${tag}> não encontrada no ProductEntry #${productIndex}`,
                location: `MasterFiles/Product/ProductEntry[${productIndex}]`,
                severity: 'error',
              });
            }
          });

          // Validar ProductType
          const productType = extractTagValue(productContent, 'ProductType');
          if (productType && !['P', 'S', 'O'].includes(productType)) {
            errors.push({
              code: 'MF007',
              message: `ProductType inválido: ${productType}. Deve ser P (Produto), S (Serviço) ou O (Outro)`,
              location: `MasterFiles/Product/ProductEntry[${productIndex}]/ProductType`,
              severity: 'error',
            });
          }
        }
      }
    }

    // Validar TaxTable
    if (mfContent.includes('<TaxTable>')) {
      const taxEntries = countTag(mfContent, 'TaxTableEntry');
      stats.taxEntries = taxEntries;
      
      // Validar cada TaxTableEntry
      const taxRegex = /<TaxTableEntry>([\s\S]*?)<\/TaxTableEntry>/g;
      let taxMatch;
      let taxIndex = 0;
      while ((taxMatch = taxRegex.exec(mfContent)) !== null) {
        taxIndex++;
        const taxContent = taxMatch[1];
        
        REQUIRED_TAX_TAGS.forEach(tag => {
          if (!taxContent.includes(`<${tag}>`)) {
            errors.push({
              code: 'MF008',
              message: `Tag obrigatória <${tag}> não encontrada no TaxTableEntry #${taxIndex}`,
              location: `MasterFiles/TaxTable/TaxTableEntry[${taxIndex}]`,
              severity: 'error',
            });
          }
        });

        // Validar TaxCode
        const taxCode = extractTagValue(taxContent, 'TaxCode');
        if (taxCode && !VALID_TAX_CODES.includes(taxCode) && !taxCode.startsWith('M')) {
          warnings.push({
            code: 'MF009',
            message: `TaxCode não reconhecido: ${taxCode}. Códigos válidos: ${VALID_TAX_CODES.join(', ')}`,
            location: `MasterFiles/TaxTable/TaxTableEntry[${taxIndex}]/TaxCode`,
          });
        }

        // Validar TaxPercentage
        const taxPercentage = extractTagValue(taxContent, 'TaxPercentage');
        if (taxPercentage) {
          const percentage = parseFloat(taxPercentage);
          if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            errors.push({
              code: 'MF010',
              message: `TaxPercentage inválido: ${taxPercentage}`,
              location: `MasterFiles/TaxTable/TaxTableEntry[${taxIndex}]/TaxPercentage`,
              severity: 'error',
            });
          }
        }
      }
    }
  }

  // ========================================
  // 4. Validações do SourceDocuments
  // ========================================
  
  const sdStart = xmlContent.indexOf('<SourceDocuments>');
  const sdEnd = xmlContent.indexOf('</SourceDocuments>');
  
  if (sdStart === -1) {
    warnings.push({
      code: 'SD001',
      message: 'Secção <SourceDocuments> não encontrada',
      location: 'Estrutura global',
    });
  } else {
    const sdContent = xmlContent.substring(sdStart, sdEnd + 17);
    stats.sourceDocsTags = countTag(sdContent, '') - 2;

    // Validar SalesInvoices
    if (sdContent.includes('<SalesInvoices>')) {
      stats.invoices = countTag(sdContent, 'Invoice');
      
      // Verificar NumberOfEntries
      const numEntries = extractTagValue(sdContent, 'NumberOfEntries');
      if (numEntries) {
        const expected = parseInt(numEntries);
        if (expected !== stats.invoices) {
          errors.push({
            code: 'SD002',
            message: `SalesInvoices/NumberOfEntries (${expected}) não corresponde ao número de Invoice (${stats.invoices})`,
            location: 'SourceDocuments/SalesInvoices',
            severity: 'error',
          });
        }
      }

      // Validar TotalDebit e TotalCredit
      const totalDebit = extractTagValue(sdContent, 'TotalDebit');
      const totalCredit = extractTagValue(sdContent, 'TotalCredit');
      
      if (totalDebit && !validateMonetaryValue(totalDebit)) {
        errors.push({
          code: 'SD003',
          message: `TotalDebit com valor inválido: ${totalDebit}`,
          location: 'SourceDocuments/SalesInvoices/TotalDebit',
          severity: 'error',
        });
      }
      
      if (totalCredit && !validateMonetaryValue(totalCredit)) {
        errors.push({
          code: 'SD004',
          message: `TotalCredit com valor inválido: ${totalCredit}`,
          location: 'SourceDocuments/SalesInvoices/TotalCredit',
          severity: 'error',
        });
      }

      // Validar cada Invoice
      const invoiceRegex = /<Invoice>([\s\S]*?)<\/Invoice>/g;
      let invoiceMatch;
      let invoiceIndex = 0;
      
      while ((invoiceMatch = invoiceRegex.exec(sdContent)) !== null) {
        invoiceIndex++;
        const invoiceContent = invoiceMatch[1];
        
        // Verificar tags obrigatórias
        REQUIRED_INVOICE_TAGS.forEach(tag => {
          if (!invoiceContent.includes(`<${tag}>`)) {
            errors.push({
              code: 'SD005',
              message: `Tag obrigatória <${tag}> não encontrada na Invoice #${invoiceIndex}`,
              location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]`,
              severity: 'error',
            });
          }
        });

        // Validar InvoiceNo
        const invoiceNo = extractTagValue(invoiceContent, 'InvoiceNo');
        if (invoiceNo) {
          // Formato esperado: Série-Número (ex: F2024-1)
          if (!/.+-.+/.test(invoiceNo)) {
            warnings.push({
              code: 'SD006',
              message: `InvoiceNo pode não seguir o formato Série-Número: ${invoiceNo}`,
              location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/InvoiceNo`,
            });
          }
        }

        // Validar ATCUD
        const atcud = extractTagValue(invoiceContent, 'ATCUD');
        if (atcud) {
          const atcudValidation = validateATCUD(atcud);
          if (!atcudValidation.isValid) {
            errors.push({
              code: 'SD007',
              message: `ATCUD inválido: ${atcudValidation.error}`,
              location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/ATCUD`,
              severity: 'error',
            });
          }
        } else {
          errors.push({
            code: 'SD007',
            message: 'ATCUD é obrigatório',
            location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/ATCUD`,
            severity: 'error',
          });
        }

        // Validar Hash
        const hash = extractTagValue(invoiceContent, 'Hash');
        if (hash) {
          const hashValidation = validateHash(hash);
          if (!hashValidation.isValid) {
            errors.push({
              code: 'SD008',
              message: `Hash inválido: ${hashValidation.error}`,
              location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/Hash`,
              severity: 'error',
            });
          }
        } else {
          errors.push({
            code: 'SD008',
            message: 'Hash é obrigatório',
            location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/Hash`,
            severity: 'error',
          });
        }

        // Validar InvoiceType
        const invoiceType = extractTagValue(invoiceContent, 'InvoiceType');
        if (invoiceType && !VALID_INVOICE_TYPES.includes(invoiceType)) {
          errors.push({
            code: 'SD009',
            message: `InvoiceType inválido: ${invoiceType}. Tipos válidos: ${VALID_INVOICE_TYPES.join(', ')}`,
            location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/InvoiceType`,
            severity: 'error',
          });
        }

        // Validar InvoiceDate
        const invoiceDate = extractTagValue(invoiceContent, 'InvoiceDate');
        if (invoiceDate && !validateDateFormat(invoiceDate)) {
          errors.push({
            code: 'SD010',
            message: `InvoiceDate com formato inválido: ${invoiceDate}`,
            location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/InvoiceDate`,
            severity: 'error',
          });
        }

        // Validar DocumentStatus
        if (invoiceContent.includes('<DocumentStatus>')) {
          const statusStart = invoiceContent.indexOf('<DocumentStatus>');
          const statusEnd = invoiceContent.indexOf('</DocumentStatus>');
          const statusContent = invoiceContent.substring(statusStart, statusEnd + 17);
          
          REQUIRED_STATUS_TAGS.forEach(tag => {
            if (!statusContent.includes(`<${tag}>`)) {
              errors.push({
                code: 'SD011',
                message: `Tag obrigatória <${tag}> não encontrada em DocumentStatus`,
                location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/DocumentStatus`,
                severity: 'error',
              });
            }
          });

          // Validar InvoiceStatus
          const invoiceStatus = extractTagValue(statusContent, 'InvoiceStatus');
          if (invoiceStatus && !['N', 'A', 'S', 'F', 'R', 'D', 'C', 'M', 'X'].includes(invoiceStatus)) {
            errors.push({
              code: 'SD012',
              message: `InvoiceStatus inválido: ${invoiceStatus}`,
              location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/DocumentStatus/InvoiceStatus`,
              severity: 'error',
            });
          }

          // Validar InvoiceStatusDate
          const statusDate = extractTagValue(statusContent, 'InvoiceStatusDate');
          if (statusDate && !validateDateTimeFormat(statusDate)) {
            warnings.push({
              code: 'SD013',
              message: `InvoiceStatusDate pode não estar no formato ISO 8601: ${statusDate}`,
              location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/DocumentStatus/InvoiceStatusDate`,
            });
          }
        }

        // Validar SelfBillingIndicator
        const sbi = extractTagValue(invoiceContent, 'SelfBillingIndicator');
        if (sbi && !['0', '1'].includes(sbi)) {
          errors.push({
            code: 'SD014',
            message: `SelfBillingIndicator inválido: ${sbi}`,
            location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/SelfBillingIndicator`,
            severity: 'error',
          });
        }

        // Validar Lines
        const lineCount = countTag(invoiceContent, 'Line');
        if (lineCount === 0) {
          errors.push({
            code: 'SD015',
            message: 'Invoice deve ter pelo menos uma Line',
            location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]`,
            severity: 'error',
          });
        } else {
          // Validar cada Line
          const lineRegex = /<Line>([\s\S]*?)<\/Line>/g;
          let lineMatch;
          let lineIndex = 0;
          
          while ((lineMatch = lineRegex.exec(invoiceContent)) !== null) {
            lineIndex++;
            const lineContent = lineMatch[1];
            
            REQUIRED_LINE_TAGS.forEach(tag => {
              if (!lineContent.includes(`<${tag}>`)) {
                errors.push({
                  code: 'SD016',
                  message: `Tag obrigatória <${tag}> não encontrada na Line #${lineIndex}`,
                  location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/Line[${lineIndex}]`,
                  severity: 'error',
                });
              }
            });

            // Validar Quantity
            const quantity = extractTagValue(lineContent, 'Quantity');
            if (quantity && isNaN(parseFloat(quantity))) {
              errors.push({
                code: 'SD017',
                message: `Quantity com valor inválido: ${quantity}`,
                location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/Line[${lineIndex}]/Quantity`,
                severity: 'error',
              });
            }

            // Validar UnitPrice
            const unitPrice = extractTagValue(lineContent, 'UnitPrice');
            if (unitPrice && !validateMonetaryValue(unitPrice)) {
              errors.push({
                code: 'SD018',
                message: `UnitPrice com valor inválido: ${unitPrice}`,
                location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/Line[${lineIndex}]/UnitPrice`,
                severity: 'error',
              });
            }

            // Validar Tax
            if (lineContent.includes('<Tax>')) {
              const taxStart = lineContent.indexOf('<Tax>');
              const taxEnd = lineContent.indexOf('</Tax>');
              const taxContent = lineContent.substring(taxStart, taxEnd + 6);
              
              REQUIRED_LINE_TAX_TAGS.forEach(tag => {
                if (!taxContent.includes(`<${tag}>`)) {
                  errors.push({
                    code: 'SD019',
                    message: `Tag obrigatória <${tag}> não encontrada em Tax`,
                    location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/Line[${lineIndex}]/Tax`,
                    severity: 'error',
                  });
                }
              });

              // Validar TaxCode
              const lineTaxCode = extractTagValue(taxContent, 'TaxCode');
              if (lineTaxCode && !VALID_TAX_CODES.includes(lineTaxCode) && !VALID_EXEMPTION_CODES.some(e => lineTaxCode.startsWith(e))) {
                warnings.push({
                  code: 'SD020',
                  message: `TaxCode não reconhecido: ${lineTaxCode}`,
                  location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/Line[${lineIndex}]/Tax/TaxCode`,
                });
              }
            }
          }
        }

        // Validar DocumentTotals
        if (invoiceContent.includes('<DocumentTotals>')) {
          const totalsStart = invoiceContent.indexOf('<DocumentTotals>');
          const totalsEnd = invoiceContent.indexOf('</DocumentTotals>');
          const totalsContent = invoiceContent.substring(totalsStart, totalsEnd + 17);
          
          REQUIRED_TOTALS_TAGS.forEach(tag => {
            if (!totalsContent.includes(`<${tag}>`)) {
              errors.push({
                code: 'SD021',
                message: `Tag obrigatória <${tag}> não encontrada em DocumentTotals`,
                location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/DocumentTotals`,
                severity: 'error',
              });
            }
          });

          // Validar valores monetários
          const taxPayable = extractTagValue(totalsContent, 'TaxPayable');
          const netTotal = extractTagValue(totalsContent, 'NetTotal');
          const grossTotal = extractTagValue(totalsContent, 'GrossTotal');

          if (taxPayable && !validateMonetaryValue(taxPayable)) {
            errors.push({
              code: 'SD022',
              message: `TaxPayable com valor inválido: ${taxPayable}`,
              location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/DocumentTotals/TaxPayable`,
              severity: 'error',
            });
          }

          if (netTotal && !validateMonetaryValue(netTotal)) {
            errors.push({
              code: 'SD023',
              message: `NetTotal com valor inválido: ${netTotal}`,
              location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/DocumentTotals/NetTotal`,
              severity: 'error',
            });
          }

          if (grossTotal && !validateMonetaryValue(grossTotal)) {
            errors.push({
              code: 'SD024',
              message: `GrossTotal com valor inválido: ${grossTotal}`,
              location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/DocumentTotals/GrossTotal`,
              severity: 'error',
            });
          }

          // Validar consistência: NetTotal + TaxPayable = GrossTotal
          if (taxPayable && netTotal && grossTotal) {
            const tp = parseFloat(taxPayable);
            const nt = parseFloat(netTotal);
            const gt = parseFloat(grossTotal);
            const calculated = nt + tp;
            const diff = Math.abs(calculated - gt);
            if (diff > 0.01) {
              warnings.push({
                code: 'SD025',
                message: `DocumentTotals inconsistente: NetTotal (${nt}) + TaxPayable (${tp}) = ${calculated}, mas GrossTotal = ${gt}`,
                location: `SourceDocuments/SalesInvoices/Invoice[${invoiceIndex}]/DocumentTotals`,
              });
            }
          }
        }
      }
    }
  }

  // ========================================
  // 5. Validações de Hash Encadeado
  // ========================================
  
  const hashes = extractAllTagValues(xmlContent, 'Hash');
  if (hashes.length > 1) {
    // Verificar se todos os hashes têm o mesmo comprimento e formato
    const firstHash = hashes[0];
    hashes.forEach((hash, index) => {
      if (hash.length !== firstHash.length) {
        errors.push({
          code: 'HSH001',
          message: `Hash #${index + 1} tem comprimento diferente dos demais`,
          location: `Invoice[${index + 1}]/Hash`,
          severity: 'error',
        });
      }
    });
  }

  // ========================================
  // 6. Estatísticas Finais
  // ========================================
  
  return {
    isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'error').length === 0,
    errors,
    warnings,
    stats,
  };
}

/**
 * Resumo da validação SAF-T
 */
export function getSAFTValidationSummary(xmlContent: string): {
  status: 'valid' | 'invalid' | 'warnings';
  summary: string;
  details: ValidationResult;
  recommendations: string[];
} {
  const result = validateSAFTStructure(xmlContent);
  const recommendations: string[] = [];
  
  // Gerar recomendações baseadas nos erros/warnings
  if (result.errors.length > 0) {
    const criticalErrors = result.errors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      recommendations.push('Corrigir erros críticos antes de submeter à AT');
    }
  }
  
  if (result.warnings.some(w => w.code === 'XML005')) {
    recommendations.push('Adicionar referência ao XSD oficial para validação completa');
  }
  
  if (result.stats.invoices > 0 && !xmlContent.includes('<Hash>')) {
    recommendations.push('Verificar implementação do hash encadeado');
  }
  
  if (result.errors.length === 0 && result.warnings.length === 0) {
    return {
      status: 'valid',
      summary: 'SAF-T válido. Todos os requisitos estruturais foram verificados com sucesso.',
      details: result,
      recommendations: ['O ficheiro pode ser submetido à AT para validação oficial'],
    };
  }
  
  if (result.errors.length > 0) {
    const errorCount = result.errors.length;
    const criticalCount = result.errors.filter(e => e.severity === 'critical').length;
    
    return {
      status: 'invalid',
      summary: `SAF-T inválido. ${errorCount} erro(s) encontrado(s)${criticalCount > 0 ? ` (${criticalCount} crítico(s))` : ''}.`,
      details: result,
      recommendations,
    };
  }
  
  return {
    status: 'warnings',
    summary: `SAF-T válido com avisos. ${result.warnings.length} aviso(s) encontrado(s).`,
    details: result,
    recommendations,
  };
}

/**
 * Valida um ficheiro SAF-T completo (entry point)
 */
export function validateSAFTFile(xmlContent: string): ValidationResult {
  return validateSAFTStructure(xmlContent);
}
