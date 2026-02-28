import React, { useState, useEffect } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Receipt,
  Loader2
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import SalesChart from "@/components/dashboard/SalesChart";
import TopProductsList from "@/components/dashboard/TopProductsList";
import TopClientsList from "@/components/dashboard/TopClientsList";
import LowStockAlert from "@/components/dashboard/LowStockAlert";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVendas: 0,
    valorTotal: 0,
    lucro: 0,
    ticketMedio: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ['vendas-dashboard'],
    queryFn: () => base44.entities.Venda.list('-created_date', 500),
  });

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos-dashboard'],
    queryFn: () => base44.entities.Produto.list(),
  });

  useEffect(() => {
    calculateStats();
    generateChartData();
    calculateTopProducts();
    calculateTopClients();
    checkLowStock();
  }, [vendas, produtos]);

  const calculateStats = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const vendasMes = vendas.filter(v => {
      if (v.cancelada) return false;
      const vendaDate = new Date(v.created_date);
      return vendaDate >= monthStart && vendaDate <= monthEnd;
    });

    const valorTotal = vendasMes.reduce((acc, v) => acc + (v.valor_final || v.valor_total || 0), 0);
    
    // Calcular lucro baseado nos preços de custo
    let lucro = 0;
    vendasMes.forEach(venda => {
      if (venda.itens) {
        venda.itens.forEach(item => {
          const produto = produtos.find(p => p.id === item.produto_id);
          if (produto) {
            const custoTotal = (produto.preco_custo || 0) * item.quantidade;
            const vendaTotal = item.subtotal || (item.preco_unitario * item.quantidade);
            lucro += vendaTotal - custoTotal;
          }
        });
      }
    });

    setStats({
      totalVendas: vendasMes.length,
      valorTotal,
      lucro,
      ticketMedio: vendasMes.length > 0 ? valorTotal / vendasMes.length : 0,
    });
  };

  const generateChartData = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const data = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayVendas = vendas.filter(v => {
        if (v.cancelada) return false;
        const vendaDate = format(new Date(v.created_date), 'yyyy-MM-dd');
        return vendaDate === dayStr;
      });
      const valor = dayVendas.reduce((acc, v) => acc + (v.valor_final || v.valor_total || 0), 0);
      return {
        dia: format(day, 'dd/MM'),
        valor,
      };
    });

    setChartData(data);
  };

  const calculateTopProducts = () => {
    const productSales = {};
    
    vendas.forEach(venda => {
      if (venda.cancelada) return;
      if (venda.itens) {
        venda.itens.forEach(item => {
          const id = item.produto_id;
          if (!productSales[id]) {
            productSales[id] = {
              id,
              nome: item.produto_nome || "Produto",
              quantidade: 0,
            };
          }
          productSales[id].quantidade += item.quantidade;
        });
      }
    });

    const sorted = Object.values(productSales)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    setTopProducts(sorted);
  };

  const calculateTopClients = () => {
    const clientSales = {};
    
    vendas.forEach(venda => {
      if (venda.cancelada) return;
      const id = venda.cliente_id || 'avulso';
      const nome = venda.cliente_nome || 'Venda Avulsa';
      
      if (!clientSales[id]) {
        clientSales[id] = {
          id,
          nome,
          total: 0,
        };
      }
      clientSales[id].total += venda.valor_final || venda.valor_total || 0;
    });

    const sorted = Object.values(clientSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    setTopClients(sorted);
  };

  const checkLowStock = () => {
    const lowStock = produtos.filter(p => 
      p.ativo !== false && 
      (p.estoque_atual || 0) <= (p.estoque_minimo || 5)
    );
    setLowStockProducts(lowStock);
  };

  const isLoading = loadingVendas || loadingProdutos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#C4967A]" />
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Resumo do mês de {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total de Vendas"
          value={stats.totalVendas}
          icon={ShoppingCart}
          color="purple"
        />
        <StatsCard 
          title="Receita"
          value={`R$ ${stats.valorTotal.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard 
          title="Lucro Bruto"
          value={`R$ ${stats.lucro.toFixed(2)}`}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard 
          title="Ticket Médio"
          value={`R$ ${stats.ticketMedio.toFixed(2)}`}
          icon={Receipt}
          color="amber"
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={chartData} />
        <LowStockAlert products={lowStockProducts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsList products={topProducts} />
        <TopClientsList clients={topClients} />
      </div>
    </div>
  );
}
