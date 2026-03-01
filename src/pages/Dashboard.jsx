import React, { useState, useEffect } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
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
import LowStockAlert from "@/components/dashboard/LowStockAlert";

// Função segura para formatar preço
const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const Dashboard = () => {
  console.log('📊 Dashboard: renderizando');
  
  const [stats, setStats] = useState({
    totalVendas: 0,
    valorTotal: 0,
    lucro: 0,
    ticketMedio: 0,
  });
  const [chartData, setChartData] = useState([]);

  // Buscar vendas
  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const response = await aroma.vendas.listar();
      console.log('📦 Vendas carregadas:', response);
      return Array.isArray(response) ? response : [];
    },
  });

  // Buscar produtos
  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      return Array.isArray(response) ? response : [];
    },
  });

  // Calcular estatísticas quando vendas mudar
  useEffect(() => {
    if (vendas.length > 0) {
      calcularEstatisticas();
      gerarDadosGrafico();
    } else {
      // Se não há vendas, zerar estatísticas
      setStats({
        totalVendas: 0,
        valorTotal: 0,
        lucro: 0,
        ticketMedio: 0,
      });
      setChartData([]);
    }
  }, [vendas, produtos]);

  const calcularEstatisticas = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Filtrar vendas do mês atual (não canceladas)
    const vendasMes = vendas.filter(v => {
      if (v.cancelada) return false;
      const vendaDate = new Date(v.created_at);
      return vendaDate >= monthStart && vendaDate <= monthEnd;
    });

    // Calcular valor total (convertendo para número)
    const valorTotal = vendasMes.reduce((acc, v) => {
      const valor = formatPrice(v.valor_final || v.valor_total || 0);
      return acc + valor;
    }, 0);

    // Calcular lucro (simplificado)
    const lucro = vendasMes.reduce((acc, v) => {
      const valorVenda = formatPrice(v.valor_final || v.valor_total || 0);
      
      // Calcular custo dos itens
      const custoTotal = v.itens?.reduce((sum, item) => {
        const produto = produtos.find(p => p.id === item.produto_id);
        const custo = formatPrice(produto?.preco_custo || 0);
        return sum + (custo * (item.quantidade || 0));
      }, 0) || 0;

      return acc + (valorVenda - custoTotal);
    }, 0);

    setStats({
      totalVendas: vendasMes.length,
      valorTotal: valorTotal,
      lucro: lucro,
      ticketMedio: vendasMes.length > 0 ? valorTotal / vendasMes.length : 0,
    });
  };

  const gerarDadosGrafico = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const data = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayVendas = vendas.filter(v => {
        if (v.cancelada) return false;
        const vendaDate = format(new Date(v.created_at), 'yyyy-MM-dd');
        return vendaDate === dayStr;
      });
      
      const valor = dayVendas.reduce((acc, v) => {
        return acc + formatPrice(v.valor_final || v.valor_total || 0);
      }, 0);

      return {
        dia: format(day, 'dd/MM'),
        valor: valor,
      };
    });

    setChartData(data);
  };

  // Filtrar produtos com estoque baixo
  const lowStockProducts = produtos.filter(p => 
    (p.estoque_atual || 0) <= (p.estoque_minimo || 5)
  );

  const isLoading = loadingVendas || loadingProdutos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
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

      {/* Chart and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={chartData} />
        <LowStockAlert products={lowStockProducts} />
      </div>
    </div>
  );
};

export default Dashboard;
