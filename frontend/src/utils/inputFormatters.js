/**
 * Utilitários para formatação de campos de input
 */

/**
 * Formata entrada de CPF
 * @param {string} value Valor do input
 * @returns {string} CPF formatado (ex: 123.456.789-00)
 */
export const formatCpfInput = (value) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara XXX.XXX.XXX-XX
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }
};

/**
 * Formata entrada de telefone
 * @param {string} value Valor do input
 * @returns {string} Telefone formatado (ex: (71) 99999-9999)
 */
export const formatPhoneInput = (value) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (numbers.length <= 2) {
    return numbers.length ? `(${numbers}` : '';
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
};

/**
 * Formata entrada de CEP
 * @param {string} value Valor do input
 * @returns {string} CEP formatado (ex: 12345-678)
 */
export const formatCepInput = (value) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara XXXXX-XXX
  if (numbers.length <= 5) {
    return numbers;
  } else {
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  }
};

/**
 * Formata entrada de CNPJ
 * @param {string} value Valor do input
 * @returns {string} CNPJ formatado (ex: 12.345.678/0001-90)
 */
export const formatCnpjInput = (value) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara XX.XXX.XXX/XXXX-XX
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }
};

/**
 * Formata entrada de valor monetário
 * @param {string} value Valor do input
 * @returns {string} Valor formatado (ex: 1.234,56)
 */
export const formatCurrencyInput = (value) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Converte para centavos e formata
  const amount = Number(numbers) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}; 