import React, { useState } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, Download, Calendar, Users, Package, 
  ShoppingCart, Loader2, TrendingUp, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

const Relatorios = () => {
  console.log('📊 Relatorios: componente renderizando');
  
  const [periodo, setPeriodo] = useState("mes_atual");

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ['vendas-relatorio'],
    queryFn: async () => {
      const response = await aroma.vendas.listar();
      return response;
    },
  });

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes-relatorio'],
    queryFn: async () => {
      const response = await aroma.clientes.listar();
      return response;
    },
  });

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos-relatorio'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      return response;
    },
  });

  const { data: fornecedores = [], isLoading: loadingFornecedores } = useQuery({
    queryKey: ['fornecedores-relatorio'],
    queryFn: async () => {
      const response = await aroma.fornecedores.listar();
      return response;
    },
  });

  // Função segura para formatar preço
  const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return '0.00';
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const getDateRange = () => {
    const now = new Date();
    switch (periodo) {
      case "mes_atual":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "mes_anterior":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "ultimos_3_meses":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "ultimos_6_meses":
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const filteredVendas = vendas.filter(v => {
    if (v.cancelada) return false;
    const { start, end } = getDateRange();
    const vendaDate = new Date(v.created_at);
    return vendaDate >= start && vendaDate <= end;
  });

  const exportToCSV = (data, filename, headers) => {
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(h => {
        const value = row[h.toLowerCase().replace(/ /g, "_")] || "";
        return typeof value === "string" && value.includes(",") 
          ? `"${value}"` 
          : value;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Relatório exportado com sucesso!");
  };

  const exportVendas = () => {
    const data = filteredVendas.map(v => ({
      data: format(new Date(v.created_at), "dd/MM/yyyy HH:mm"),
      cliente: v.cliente_nome || "Venda Avulsa",
      itens: v.itens?.length || 0,
      valor_total: formatPrice(v.valor_total),
      desconto: formatPrice(v.desconto),
      valor_final: formatPrice(v.valor_final || v.valor_total || 0),
    }));
    exportToCSV(data, "relatorio_vendas", ["Data", "Cliente", "Itens", "Valor_Total", "Desconto", "Valor_Final"]);
  };

  const exportClientes = () => {
    const data = clientes.map(c => ({
      nome: c.nome,
      cpf: c.cpf || "",
      telefone: c.telefone || "",
      email: c.email || "",
      endereco: c.endereco || "",
    }));
    exportToCSV(data, "relatorio_clientes", ["Nome", "CPF", "Telefone", "Email", "Endereco"]);
  };

  const exportProdutos = () => {
    const data = produtos.map(p => ({
      nome: p.nome,
      marca: p.marca || "",
      volume: p.volume || "",
      preco_custo: formatPrice(p.preco_custo),
      preco_venda: formatPrice(p.preco_venda),
      estoque_atual: p.estoque_atual || 0,
    }));
    exportToCSV(data, "relatorio_produtos", ["Nome", "Marca", "Volume", "Preco_Custo", "Preco_Venda", "Estoque_Atual"]);
  };

  const exportFornecedores = () => {
    const data = fornecedores.map(f => ({
      nome: f.nome,
      cnpj: f.cnpj || "",
      telefone: f.telefone || "",
      email: f.email || "",
      endereco: f.endereco || "",
    }));
    exportToCSV(data, "relatorio_fornecedores", ["Nome", "CNPJ", "Telefone", "Email", "Endereco"]);
  };

  // Estatísticas de vendas
  const totalVendas = filteredVendas.length;
  const valorTotal = filteredVendas.reduce((acc, v) => acc + parseFloat(v.valor_final || v.valor_total || 0), 0);
  const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

  const isLoading = loadingVendas || loadingClientes || loadingProdutos || loadingFornecedores;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 mt-1">Exporte dados e visualize estatísticas</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes_atual">Mês Atual</SelectItem>
            <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
            <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
            <SelectItem value="ultimos_6_meses">Últimos 6 Meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white/70 border-0 shadow-lg">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Vendas</p>
              <p className="text-2xl font-bold">{totalVendas}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 border-0 shadow-lg">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Receita Total</p>
              <p className="text-2xl font-bold">R$ {formatPrice(valorTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 border-0 shadow-lg">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ticket Médio</p>
              <p className="text-2xl font-bold">R$ {formatPrice(ticketMedio)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs defaultValue="vendas" className="space-y-4">
        <TabsList className="bg-white/70">
          <TabsTrigger value="vendas" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
        </TabsList>

        {/* Vendas */}
        <TabsContent value="vendas">
          <Card className="bg-white/70 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Relatório de Vendas</CardTitle>
              <Button onClick={exportVendas} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendas.slice(0, 10).map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell>{format(new Date(venda.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>{venda.cliente_nome || "Venda Avulsa"}</TableCell>
                      <TableCell>{venda.itens?.length || 0}</TableCell>
                      <TableCell>R$ {formatPrice(venda.desconto || 0)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {formatPrice(venda.valor_final || venda.valor_total || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredVendas.length > 10 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Mostrando 10 de {filteredVendas.length} vendas. Exporte para ver todas.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clientes */}
        <TabsContent value="clientes">
          <Card className="bg-white/70 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Relatório de Clientes</CardTitle>
              <Button onClick={exportClientes} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.slice(0, 10).map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.cpf || "-"}</TableCell>
                      <TableCell>{cliente.telefone || "-"}</TableCell>
                      <TableCell>{cliente.email || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produtos */}
        <TabsContent value="produtos">
          <Card className="bg-white/70 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Relatório de Produtos</CardTitle>
              <Button onClick={exportProdutos} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Preço Custo</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.slice(0, 10).map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell>{produto.marca || "-"}</TableCell>
                      <TableCell>R$ {formatPrice(produto.preco_custo)}</TableCell>
                      <TableCell>R$ {formatPrice(produto.preco_venda)}</TableCell>
                      <TableCell className="text-right">{produto.estoque_atual || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fornecedores */}
        <TabsContent value="fornecedores">
          <Card className="bg-white/70 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Relatório de Fornecedores</CardTitle>
              <Button onClick={exportFornecedores} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.slice(0, 10).map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.cnpj || "-"}</TableCell>
                      <TableCell>{fornecedor.telefone || "-"}</TableCell>
                      <TableCell>{fornecedor.email || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
