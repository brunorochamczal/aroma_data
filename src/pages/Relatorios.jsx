import React, { useState, useEffect } from "react";
import { aroma } from "@/api/aromaClient";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, Download, Calendar, Users, Package, 
  ShoppingCart, Loader2, TrendingUp, DollarSign,
  Filter, MapPin, Building2, FileDown, Printer
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Relatorios = () => {
  console.log('📊 Relatorios: componente renderizando');
  
  // Estados para filtros
  const [periodo, setPeriodo] = useState("mes_atual");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("todos");
  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [filtroFornecedor, setFiltroFornecedor] = useState("todos");
  const [filtroBairro, setFiltroBairro] = useState("todos");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState("vendas");

  // Buscar dados
  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ['vendas-relatorio'],
    queryFn: async () => {
      const response = await aroma.vendas.listar();
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes-relatorio'],
    queryFn: async () => {
      const response = await aroma.clientes.listar();
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos-relatorio'],
    queryFn: async () => {
      const response = await aroma.produtos.listar();
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: fornecedores = [], isLoading: loadingFornecedores } = useQuery({
    queryKey: ['fornecedores-relatorio'],
    queryFn: async () => {
      const response = await aroma.fornecedores.listar();
      return Array.isArray(response) ? response : [];
    },
  });

  // Extrair bairros únicos dos endereços dos clientes
  const bairros = [...new Set(clientes
    .map(c => c.endereco?.split(',').pop()?.trim())
    .filter(Boolean)
  )];

  // Função para formatar preço
  const formatPrice = (value) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  // Função para obter intervalo de datas
  const getDateRange = () => {
    const now = new Date();
    let start, end;

    switch (periodo) {
      case "mes_atual":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "mes_anterior":
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case "ultimos_3_meses":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "ultimos_6_meses":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case "personalizado":
        start = dataInicio ? parseISO(dataInicio) : startOfMonth(now);
        end = dataFim ? parseISO(dataFim) : endOfMonth(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return { start, end };
  };

  // Filtrar vendas baseado em todos os critérios
  const getVendasFiltradas = () => {
    const { start, end } = getDateRange();
    
    return vendas.filter(v => {
      // Filtro por data
      if (v.cancelada) return false;
      const vendaDate = new Date(v.created_at);
      if (vendaDate < start || vendaDate > end) return false;

      // Filtro por cliente
      if (filtroCliente !== "todos" && v.cliente_id !== filtroCliente) return false;

      // Filtro por produto (verificar se a venda contém o produto)
      if (filtroProduto !== "todos") {
        const temProduto = v.itens?.some(item => item.produto_id === filtroProduto);
        if (!temProduto) return false;
      }

      // Filtro por bairro
      if (filtroBairro !== "todos") {
        const cliente = clientes.find(c => c.id === v.cliente_id);
        const bairroCliente = cliente?.endereco?.split(',').pop()?.trim();
        if (bairroCliente !== filtroBairro) return false;
      }

      return true;
    });
  };

  // Estatísticas baseadas nos filtros
  const vendasFiltradas = getVendasFiltradas();
  const totalVendas = vendasFiltradas.length;
  const valorTotal = vendasFiltradas.reduce((acc, v) => acc + parseFloat(v.valor_final || v.valor_total || 0), 0);
  const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

  // Dados para relatório de produtos mais vendidos
  const produtosMaisVendidos = () => {
    const contador = {};
    
    vendasFiltradas.forEach(venda => {
      venda.itens?.forEach(item => {
        const id = item.produto_id;
        if (!contador[id]) {
          contador[id] = {
            id,
            nome: item.produto_nome,
            quantidade: 0,
            total: 0
          };
        }
        contador[id].quantidade += item.quantidade;
        contador[id].total += item.subtotal;
      });
    });

    return Object.values(contador).sort((a, b) => b.quantidade - a.quantidade);
  };

  // Dados para relatório de clientes
  const clientesPorCompra = () => {
    const contador = {};
    
    vendasFiltradas.forEach(venda => {
      const id = venda.cliente_id || 'avulso';
      if (!contador[id]) {
        const cliente = clientes.find(c => c.id === id);
        contador[id] = {
          id,
          nome: venda.cliente_nome || 'Venda Avulsa',
          endereco: cliente?.endereco || '',
          totalCompras: 0,
          valorTotal: 0
        };
      }
      contador[id].totalCompras += 1;
      contador[id].valorTotal += parseFloat(venda.valor_final || venda.valor_total || 0);
    });

    return Object.values(contador).sort((a, b) => b.valorTotal - a.valorTotal);
  };

  // Dados para relatório de fornecedores
  const fornecedoresPorVenda = () => {
    const contador = {};
    
    vendasFiltradas.forEach(venda => {
      venda.itens?.forEach(item => {
        const produto = produtos.find(p => p.id === item.produto_id);
        const fornecedorId = produto?.fornecedor_id;
        
        if (fornecedorId) {
          if (!contador[fornecedorId]) {
            const fornecedor = fornecedores.find(f => f.id === fornecedorId);
            contador[fornecedorId] = {
              id: fornecedorId,
              nome: fornecedor?.nome || 'Desconhecido',
              quantidade: 0,
              total: 0
            };
          }
          contador[fornecedorId].quantidade += item.quantidade;
          contador[fornecedorId].total += item.subtotal;
        }
      });
    });

    return Object.values(contador).sort((a, b) => b.total - a.total);
  };

  // Função para gerar PDF
  const gerarPDF = (titulo, dados, colunas) => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text(titulo, 14, 22);
      
      // Período
      doc.setFontSize(11);
      const { start, end } = getDateRange();
      doc.text(`Período: ${format(start, 'dd/MM/yyyy')} a ${format(end, 'dd/MM/yyyy')}`, 14, 32);
      
      // Filtros aplicados
      let yPos = 40;
      if (filtroCliente !== "todos") {
        const cliente = clientes.find(c => c.id === filtroCliente);
        doc.text(`Cliente: ${cliente?.nome || 'Selecionado'}`, 14, yPos);
        yPos += 7;
      }
      if (filtroProduto !== "todos") {
        const produto = produtos.find(p => p.id === filtroProduto);
        doc.text(`Produto: ${produto?.nome || 'Selecionado'}`, 14, yPos);
        yPos += 7;
      }
      if (filtroFornecedor !== "todos") {
        const fornecedor = fornecedores.find(f => f.id === filtroFornecedor);
        doc.text(`Fornecedor: ${fornecedor?.nome || 'Selecionado'}`, 14, yPos);
        yPos += 7;
      }
      if (filtroBairro !== "todos") {
        doc.text(`Bairro: ${filtroBairro}`, 14, yPos);
        yPos += 7;
      }

      // Tabela
      autoTable(doc, {
        startY: yPos + 5,
        head: [colunas.map(c => c.titulo)],
        body: dados.map(item => colunas.map(c => item[c.campo])),
        theme: 'striped',
        headStyles: { fillColor: [147, 51, 234] }, // Roxo
      });

      // Total de registros
      const finalY = doc.lastAutoTable.finalY || yPos + 10;
      doc.setFontSize(10);
      doc.text(`Total de registros: ${dados.length}`, 14, finalY + 10);

      // Salvar PDF
      doc.save(`relatorio_${titulo}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const gerarPDFVendas = () => {
    const dados = vendasFiltradas.map(v => ({
      data: format(new Date(v.created_at), 'dd/MM/yyyy HH:mm'),
      cliente: v.cliente_nome || 'Venda Avulsa',
      itens: v.itens?.length || 0,
      total: `R$ ${formatPrice(v.valor_final || v.valor_total || 0)}`
    }));
    
    gerarPDF(
      'Relatório de Vendas',
      dados,
      [
        { titulo: 'Data', campo: 'data' },
        { titulo: 'Cliente', campo: 'cliente' },
        { titulo: 'Itens', campo: 'itens' },
        { titulo: 'Total', campo: 'total' }
      ]
    );
  };

  const gerarPDFProdutos = () => {
    const dados = produtosMaisVendidos().map(p => ({
      nome: p.nome,
      quantidade: p.quantidade,
      total: `R$ ${formatPrice(p.total)}`
    }));
    
    gerarPDF(
      'Produtos Mais Vendidos',
      dados,
      [
        { titulo: 'Produto', campo: 'nome' },
        { titulo: 'Quantidade Vendida', campo: 'quantidade' },
        { titulo: 'Valor Total', campo: 'total' }
      ]
    );
  };

  const gerarPDFClientes = () => {
    const dados = clientesPorCompra().map(c => ({
      nome: c.nome,
      compras: c.totalCompras,
      total: `R$ ${formatPrice(c.valorTotal)}`,
      endereco: c.endereco || '-'
    }));
    
    gerarPDF(
      'Clientes por Compra',
      dados,
      [
        { titulo: 'Cliente', campo: 'nome' },
        { titulo: 'Nº Compras', campo: 'compras' },
        { titulo: 'Valor Total', campo: 'total' },
        { titulo: 'Endereço', campo: 'endereco' }
      ]
    );
  };

  const gerarPDFFornecedores = () => {
    const dados = fornecedoresPorVenda().map(f => ({
      nome: f.nome,
      quantidade: f.quantidade,
      total: `R$ ${formatPrice(f.total)}`
    }));
    
    gerarPDF(
      'Fornecedores por Venda',
      dados,
      [
        { titulo: 'Fornecedor', campo: 'nome' },
        { titulo: 'Quantidade Vendida', campo: 'quantidade' },
        { titulo: 'Valor Total', campo: 'total' }
      ]
    );
  };

  const gerarPDFBairros = () => {
    const dados = bairros.map(bairro => {
      const vendasBairro = vendas.filter(v => {
        const cliente = clientes.find(c => c.id === v.cliente_id);
        const bairroCliente = cliente?.endereco?.split(',').pop()?.trim();
        return bairroCliente === bairro && !v.cancelada;
      });
      
      return {
        bairro,
        totalVendas: vendasBairro.length,
        valorTotal: `R$ ${formatPrice(vendasBairro.reduce((acc, v) => acc + parseFloat(v.valor_final || v.valor_total || 0), 0))}`
      };
    }).filter(d => d.totalVendas > 0);

    gerarPDF(
      'Vendas por Bairro',
      dados,
      [
        { titulo: 'Bairro', campo: 'bairro' },
        { titulo: 'Total de Vendas', campo: 'totalVendas' },
        { titulo: 'Valor Total', campo: 'valorTotal' }
      ]
    );
  };

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
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 mt-1">Exporte dados e visualize estatísticas</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </Button>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <Card className="bg-white/70 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Período */}
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes_atual">Mês Atual</SelectItem>
                    <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                    <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
                    <SelectItem value="ultimos_6_meses">Últimos 6 Meses</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Datas personalizadas */}
              {periodo === "personalizado" && (
                <>
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Cliente */}
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Clientes</SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Produto */}
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={filtroProduto} onValueChange={setFiltroProduto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Produtos</SelectItem>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fornecedor */}
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={filtroFornecedor} onValueChange={setFiltroFornecedor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Fornecedores</SelectItem>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bairro */}
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Select value={filtroBairro} onValueChange={setFiltroBairro}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Bairros</SelectItem>
                    {bairros.map((bairro) => (
                      <SelectItem key={bairro} value={bairro}>
                        {bairro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
      <Tabs defaultValue="vendas" className="space-y-4" onValueChange={setTipoRelatorio}>
        <TabsList className="bg-white/70 flex flex-wrap">
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
            <Building2 className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
          <TabsTrigger value="bairros" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Bairros
          </TabsTrigger>
        </TabsList>

        {/* Relatório de Vendas */}
        <TabsContent value="vendas">
          <Card className="bg-white/70 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Relatório de Vendas</CardTitle>
              <div className="flex gap-2">
                <Button onClick={gerarPDFVendas} variant="outline" size="sm">
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={() => exportToCSV(vendasFiltradas, 'vendas')} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendasFiltradas.slice(0, 10).map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell>{format(new Date(venda.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>{venda.cliente_nome || "Venda Avulsa"}</TableCell>
                      <TableCell>{venda.itens?.length || 0}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {formatPrice(venda.valor_final || venda.valor_total || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {vendasFiltradas.length > 10 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Mostrando 10 de {vendasFiltradas.length} vendas. Use os botões de exportação para ver todas.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Clientes */}
        <TabsContent value="clientes">
          <Card className="bg-white/70 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Clientes por Compra</CardTitle>
              <Button onClick={gerarPDFClientes} variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Nº Compras</TableHead>
                    <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesPorCompra().slice(0, 10).map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.endereco || '-'}</TableCell>
                      <TableCell>{cliente.totalCompras}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {formatPrice(cliente.valorTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Produtos */}
        <TabsContent value="produtos">
          <Card className="bg-white/70 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <Button onClick={gerarPDFProdutos} variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade Vendida</TableHead>
                    <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosMaisVendidos().slice(0, 10).map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell>{produto.quantidade}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {formatPrice(produto.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Fornecedores */}
        <TabsContent value="fornecedores">
          <Card className="bg-white/70 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fornecedores por Venda</CardTitle>
              <Button onClick={gerarPDFFornecedores} variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Quantidade Vendida</TableHead>
                    <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedoresPorVenda().slice(0, 10).map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.quantidade}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {formatPrice(fornecedor.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Bairros */}
        <TabsContent value="bairros">
          <Card className="bg-white/70 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vendas por Bairro</CardTitle>
              <Button onClick={gerarPDFBairros} variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bairro</TableHead>
                    <TableHead>Total de Vendas</TableHead>
                    <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bairros.map(bairro => {
                    const vendasBairro = vendas.filter(v => {
                      const cliente = clientes.find(c => c.id === v.cliente_id);
                      const bairroCliente = cliente?.endereco?.split(',').pop()?.trim();
                      return bairroCliente === bairro && !v.cancelada;
                    });
                    
                    if (vendasBairro.length === 0) return null;
                    
                    const valorTotal = vendasBairro.reduce((acc, v) => 
                      acc + parseFloat(v.valor_final || v.valor_total || 0), 0
                    );

                    return (
                      <TableRow key={bairro}>
                        <TableCell className="font-medium">{bairro}</TableCell>
                        <TableCell>{vendasBairro.length}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {formatPrice(valorTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Função para exportar CSV (igual à anterior)
const exportToCSV = (data, tipo) => {
  // ... (mesma função de antes)
};

export default Relatorios;
