/**
 * pages.config.js - Page routing configuration
 */

import Clientes from './pages/Clientes';
import Dashboard from './pages/Dashboard';
import Fornecedores from './pages/Fornecedores';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import Vendas from './pages/Vendas';
import __Layout from './Layout.jsx';

// Log para debug (vai aparecer no console do navegador)
console.log('📄 Páginas importadas:', {
  Clientes: !!Clientes,
  Dashboard: !!Dashboard,
  Fornecedores: !!Fornecedores,
  Produtos: !!Produtos,
  Relatorios: !!Relatorios,
  Vendas: !!Vendas
});

export const PAGES = {
    "Clientes": Clientes,
    "Dashboard": Dashboard,
    "Fornecedores": Fornecedores,
    "Produtos": Produtos,
    "Relatorios": Relatorios,
    "Vendas": Vendas,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};

// Para debug no console
if (typeof window !== 'undefined') {
    window.pagesConfig = pagesConfig;
}
