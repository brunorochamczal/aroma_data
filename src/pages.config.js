/**
 * pages.config.js - Page routing configuration
 */

import Clientes from './pages/Clientes';
import Dashboard from './pages/Dashboard';
import Fornecedores from './pages/Fornecedores';
import Produtos from './pages/Produtos';        // DEVE ESTAR AQUI
import Relatorios from './pages/Relatorios';    // DEVE ESTAR AQUI
import Vendas from './pages/Vendas';            // DEVE ESTAR AQUI
import __Layout from './Layout.jsx';

// LOG DETALHADO
console.log('📦 Importação de páginas:');
console.log('   - Clientes:', Clientes ? '✅' : '❌');
console.log('   - Dashboard:', Dashboard ? '✅' : '❌');
console.log('   - Fornecedores:', Fornecedores ? '✅' : '❌');
console.log('   - Produtos:', Produtos ? '✅' : '❌');
console.log('   - Relatorios:', Relatorios ? '✅' : '❌');
console.log('   - Vendas:', Vendas ? '✅' : '❌');

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

// EXPOR PARA DEBUG
if (typeof window !== 'undefined') {
    window.pagesConfig = pagesConfig;
    console.log('✅ pagesConfig exposto em window.pagesConfig');
}
