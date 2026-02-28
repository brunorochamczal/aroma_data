import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { aroma } from "@/api/aromaClient";
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
import { useAuth } from '@/lib/AuthContext';  // NOVO - usar nosso contexto

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
  const { user, logout } = useAuth();  // NOVO - usar o contexto

  const handleLogout = () => {
    logout();  // NOVO - usar função do contexto
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf5f0] via-[#f9ede8]/50 to-[#fdf5f0]">
      <style>{`
        :root {
          --primary: 20 40% 62%;
          --primary-foreground: 0 0% 100%;
        }
      `}</style>
      
      {/* Sidebar - Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-xl border-r border-[#e8c9bc] 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-4 border-b border-[#e8c9bc]">
          <img 
             
            alt="Aroma Data" 
            className="h-10 w-10 object-contain" 
          />
          <span className="font-semibold text-[#4a3728]">Aroma Data</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#C4967A] to-[#b07e63] text-white' 
                    : 'text-[#4a3728] hover:bg-[#C4967A]/10'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info - Desktop */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#e8c9bc]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C4967A] to-[#b07e63] flex items-center justify-center text-white text-sm font-medium">
              {user?.full_name?.[0] || user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#4a3728] truncate">
                {user?.full_name || user?.name || "Usuário"}
              </p>
              <p className="text-xs text-[#C4967A] truncate">
                {user?.email || ""}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="text-[#C4967A] hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

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
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69934d847f21bef6394c904f/101dec9a7_Aroma.png" 
              alt="Aroma Data" 
              className="h-10 w-10 object-contain" 
            />
            <span className="font-semibold text-[#4a3728]">Aroma Data</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C4967A] to-[#b07e63] flex items-center justify-center text-white text-sm font-medium">
                  {user?.full_name?.[0] || user?.name?.[0] || "U"}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Profile")} className="cursor-pointer">
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Configuracoes")} className="cursor-pointer">
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <main className={`
        min-h-screen transition-all duration-300 ease-in-out
        lg:ml-64 pt-16 lg:pt-0
      `}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
