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

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVendas: 0,
    valorTotal: 0,
    lucro: 0,
    ticketMedio: 0,
  });
  const [chartData, setChartData] = useState([]);

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const response = await aroma.vendas.listar();
      return response;
    },
  });

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      return response;
    },
  });

  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['produtos-low-stock'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      return response.filter(p => (p.estoque_atual || 0) <= (p.estoque_minimo || 5));
    },
  });

  useEffect(() => {
    if (vendas.length > 0) {
      calculateStats();
      generateChartData();
    }
  }, [vendas]);

  const calculateStats = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const vendasMes = vendas.filter(v => {
      if (v.cancelada) return false;
      const vendaDate = new Date(v.created_at);
      return vendaDate >= monthStart && vendaDate <= monthEnd;
    });

    const valorTotal = vendasMes.reduce((acc, v) => acc + (v.valor_final || v.valor_total || 0), 0);
    
    // Calcular lucro (simplificado)
    const lucro = vendasMes.reduce((acc, v) => {
      const custoTotal = v.itens?.reduce((sum, item) => {
        const produto = produtos.find(p => p.id === item.produto_id);
        return sum + ((produto?.preco_custo || 0) * item.quantidade);
      }, 0) || 0;
      return acc + ((v.valor_final || v.valor_total || 0) - custoTotal);
    }, 0);

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
        const vendaDate = format(new Date(v.created_at), 'yyyy-MM-dd');
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

  const isLoading = loadingVendas || loadingProdutos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
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

      {/* Chart and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={chartData} />
        <LowStockAlert products={lowStockProducts} />
      </div>
    </div>
  );
}
