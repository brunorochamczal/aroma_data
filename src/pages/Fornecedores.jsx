// Adicione estes estados no início do componente
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [itemToDelete, setItemToDelete] = useState(null);

// Adicione esta mutation (substitua a deleteMutation existente)
const deleteMutation = useMutation({
  mutationFn: async (id) => {
    return await aroma.fornecedores.excluir(id);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
    toast.success("Fornecedor excluído permanentemente!");
  },
  onError: (error) => {
    toast.error(error.message || "Erro ao excluir fornecedor");
    console.error(error);
  },
});

// Adicione estas funções
const handleDeleteClick = (id) => {
  setItemToDelete(id);
  setShowDeleteConfirm(true);
};

const confirmDelete = () => {
  if (itemToDelete) {
    deleteMutation.mutate(itemToDelete);
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  }
};

// No menu DropdownMenuItem, substitua o onClick existente por:
<DropdownMenuItem 
  onClick={() => handleDeleteClick(fornecedor.id)}
  className="text-red-600"
>
  <Trash2 className="h-4 w-4 mr-2" />
  Excluir
</DropdownMenuItem>

// Adicione o Modal de Confirmação de Exclusão antes do último fechamento:
{/* Modal de Confirmação de Exclusão */}
<Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-center text-red-600">
        ⚠️ Confirmar Exclusão
      </DialogTitle>
    </DialogHeader>
    <div className="text-center py-4">
      <p className="text-gray-600 mb-2">
        Tem certeza que deseja excluir permanentemente?
      </p>
      <p className="text-sm text-red-500">
        Esta ação não pode ser desfeita!
      </p>
    </div>
    <DialogFooter className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={() => setShowDeleteConfirm(false)}
        className="flex-1"
      >
        Cancelar
      </Button>
      <Button 
        onClick={confirmDelete}
        className="flex-1 bg-red-600 hover:bg-red-700"
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        Sim, Excluir
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
