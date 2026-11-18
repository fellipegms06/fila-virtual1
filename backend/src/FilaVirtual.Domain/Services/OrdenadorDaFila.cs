using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;

namespace FilaVirtual.Domain.Services;

public static class OrdenadorDaFila
{
    public static IReadOnlyList<SenhaFila> Ordenar(IEnumerable<SenhaFila> senhas) =>
        senhas.Where(s => s.Status == StatusAtendimento.Aguardando)
              .OrderByDescending(s => s.Prioridade)
              .ThenBy(s => s.EmitidaEm)
              .ThenBy(s => s.Numero)
              .ToList();

    public static int? Posicao(IEnumerable<SenhaFila> senhas, Guid senhaId)
    {
        var ordem = Ordenar(senhas);
        for (var i = 0; i < ordem.Count; i++)
        {
            if (ordem[i].Id == senhaId)
                return i + 1;
        }
        return null;
    }
}
