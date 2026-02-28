import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LowStockAlert({ products }) {
  if (products.length === 0) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-[#C4967A]/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-gray-500">
            <Package className="h-12 w-12 text-emerald-500 mb-2" />
            <p className="text-sm">Estoque em dia!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-[#C4967A]/10 border-l-4 border-l-[#C4967A]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Alertas de Estoque
          <Badge variant="destructive" className="ml-auto">{products.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[200px] overflow-y-auto">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{product.nome}</p>
                  <p className="text-xs text-gray-500">{product.marca || "Sem marca"}</p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${product.estoque_atual === 0 ? 'border-red-500 text-red-600 bg-red-50' : 'border-amber-500 text-amber-600 bg-amber-50'}`}
              >
                {product.estoque_atual} un
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
