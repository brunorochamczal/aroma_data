import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function TopClientsList({ clients }) {
  const maxValue = Math.max(...clients.map(c => c.total), 1);

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-purple-100/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Top 5 Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Nenhuma venda registrada</p>
          ) : (
            clients.map((client, index) => (
              <div key={client.id || index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-gradient-to-br from-purple-500 to-violet-600' :
                      index === 1 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                      index === 2 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                      'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {client.nome?.[0] || "C"}
                    </div>
                    <span className="font-medium text-gray-800 truncate max-w-[120px]">{client.nome}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    R$ {client.total.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${(client.total / maxValue) * 100}%` }}
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
