import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ayvuApi } from '../../lib/apiClient'

export function useTemas() {
  return useQuery({ queryKey: ['ayvu', 'temas'], queryFn: ayvuApi.listarTemas })
}

export function useTemaDetalhe(temaId: number) {
  return useQuery({
    queryKey: ['ayvu', 'tema', temaId],
    queryFn: () => ayvuApi.detalheDoTema(temaId),
  })
}

export function useProgresso() {
  return useQuery({ queryKey: ['ayvu', 'progresso'], queryFn: ayvuApi.obterProgresso })
}

export function useMarcarProgresso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conteudoId, concluido }: { conteudoId: number; concluido?: boolean }) =>
      ayvuApi.marcarProgresso(conteudoId, concluido),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ayvu', 'progresso'] })
    },
  })
}
