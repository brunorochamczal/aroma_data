import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Função para combinar classes CSS (já existente)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Função para verificar se está em iframe
export const isIframe = typeof window !== 'undefined' ? window.self !== window.top : false;

// Função para criar URLs das páginas (NOVA)
export const createPageUrl = (pageName) => {
  // Converte para minúsculas e remove espaços
  const formattedPage = pageName.toLowerCase().replace(/\s+/g, '');
  return `/${formattedPage}`;
};

// Função para formatar data (opcional, útil)
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
};

// Função para formatar moeda (opcional, útil)
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
