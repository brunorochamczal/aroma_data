/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 */

import Clientes from './pages/Clientes';
import Dashboard from './pages/Dashboard';
import Fornecedores from './pages/Fornecedores';
import Produtos from './pages/Produtos';        // <-- VERIFIQUE SE ESTÁ AQUI
import Relatorios from './pages/Relatorios';    // <-- VERIFIQUE SE ESTÁ AQUI
import Vendas from './pages/Vendas';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Clientes": Clientes,
    "Dashboard": Dashboard,
    "Fornecedores": Fornecedores,
    "Produtos": Produtos,        // <-- DEVE ESTAR AQUI
    "Relatorios": Relatorios,    // <-- DEVE ESTAR AQUI
    "Vendas": Vendas,
}

export const pagesConfig = {
    mainPage: "Dashboard",  // <-- ALTERE PARA DASHBOARD
    Pages: PAGES,
    Layout: __Layout,
};
