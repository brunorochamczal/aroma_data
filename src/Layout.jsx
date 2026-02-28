import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Package, 
  ShoppingCart, 
  FileText,
  Menu,
  X,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LowStockNotifications from "@/components/notifications/LowStockNotifications";
import NotificationBell from "@/components/notifications/NotificationBell";

const navItems = [
  { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { name: "Vendas", page: "Vendas", icon: ShoppingCart },
  { name: "Produtos", page: "Produtos", icon: Package },
  { name: "Clientes", page: "Clientes", icon: Users },
  { name: "Fornecedores", page: "Fornecedores", icon: Truck },
  { name: "Relatórios", page: "Relatorios", icon: FileText },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf5f0] via-[#f9ede8]/50 to-[#fdf5f0]">
      <style>{`
        :root {
          --primary: 20 40% 62%;
          --primary-foreground: 0 0% 100%;
        }
      `}</style>
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-[#e8c9bc] z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#C4967A]"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69934d847f21bef6394c904f/101dec9a7_Aroma.png" alt="Aroma Data" className="h-10 w-10 object-contain" />
            <span className="font-semibold text-[#4a3728]">Aroma Data</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C4967A] to-[#b07e63] flex items-center justify-center text-white text-sm font-medium">
                  {user?.full_name?.[0] || "U"}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
 
