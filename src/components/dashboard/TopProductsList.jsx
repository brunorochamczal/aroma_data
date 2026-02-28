import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function TopProductsList({ products }) {
  const maxValue = Math.max(...products.map(p => p.quantidade), 1);

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-purple-100/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-600" />
          Top 5 Produtos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Nenhuma venda registrada</p>
          ) : (
            products.map((product, index) => (
              <div key={product.id || index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-800 truncate max-w-[150px]">{product.nome}</span>
                  </div>
                  <span className="text-sm font-semibold text-purple-600">{product.quantidade} un</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${(product.quantidade / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
