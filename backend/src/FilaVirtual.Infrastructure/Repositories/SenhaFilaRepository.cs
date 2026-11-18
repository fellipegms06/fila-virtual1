using FilaVirtual.Application.Abstractions;
using FilaVirtual.Infrastructure.Persistence;

namespace FilaVirtual.Infrastructure.Repositories;

public class SenhaFilaRepository(AppDbContext db) : ISenhaFilaRepository
{
    public async Task AdicionarAsync(SenhaFila senha, CancellationToken ct = default) =>
        await db.Senhas.AddAsync(senha, ct);

    public void Descartar(SenhaFila senha) => db.Entry(senha).State = EntityState.Detached;

    public async Task<int> ProximoNumeroAsync(Guid unidadeId, DateOnly dia, CancellationToken ct = default) =>
        (await db.Senhas
            .Where(s => s.UnidadeCrasId == unidadeId && s.DataReferencia == dia)
            .MaxAsync(s => (int?)s.Numero, ct) ?? 0) + 1;

    public Task<SenhaFila?> ObterAtivaDoUsuarioAsync(Guid usuarioId, CancellationToken ct = default) =>
        ComNavegacoes(db.Senhas)
            .Where(s => s.UsuarioId == usuarioId
                        && (s.Status == StatusAtendimento.Aguardando || s.Status == StatusAtendimento.EmAtendimento))
            .OrderByDescending(s => s.EmitidaEm)
            .FirstOrDefaultAsync(ct);

    public Task<SenhaFila?> ObterAsync(Guid id, CancellationToken ct = default) =>
        ComNavegacoes(db.Senhas).FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<SenhaFila?> ObterAtivaPorAgendamentoAsync(Guid agendamentoId, CancellationToken ct = default) =>
        ComNavegacoes(db.Senhas)
            .Where(s => s.AgendamentoId == agendamentoId
                        && (s.Status == StatusAtendimento.Aguardando || s.Status == StatusAtendimento.EmAtendimento))
            .FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<SenhaFila>> ListarDoDiaAsync(Guid unidadeId, DateOnly dia, CancellationToken ct = default) =>
        await ComNavegacoes(db.Senhas.AsNoTracking())
            .Where(s => s.UnidadeCrasId == unidadeId && s.DataReferencia == dia)
            .OrderBy(s => s.Numero)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<SenhaFila>> ListarAguardandoParaAtualizarAsync(
        Guid unidadeId, DateOnly dia, CancellationToken ct = default) =>
        await ComNavegacoes(db.Senhas)
            .Where(s => s.UnidadeCrasId == unidadeId && s.DataReferencia == dia
                        && s.Status == StatusAtendimento.Aguardando)
            .ToListAsync(ct);

    public async Task<double?> MediaAtendimentoMinutosAsync(Guid unidadeId, int ultimos, CancellationToken ct = default)
    {
        var atendimentos = await db.Senhas.AsNoTracking()
            .Where(s => s.UnidadeCrasId == unidadeId && s.Status == StatusAtendimento.Concluido
                        && s.ChamadaEm != null && s.FinalizadaEm != null)
            .OrderByDescending(s => s.FinalizadaEm)
            .Take(ultimos)
            .Select(s => new { Inicio = s.ChamadaEm!.Value, Fim = s.FinalizadaEm!.Value })
            .ToListAsync(ct);

        return atendimentos.Count == 0 ? null : atendimentos.Average(a => (a.Fim - a.Inicio).TotalMinutes);
    }

    public async Task<IReadOnlyDictionary<Guid, string>> CodigosPorAgendamentoAsync(
        IEnumerable<Guid> agendamentoIds, CancellationToken ct = default)
    {
        var ids = agendamentoIds.ToList();
        if (ids.Count == 0) return new Dictionary<Guid, string>();

        var pares = await db.Senhas.AsNoTracking()
            .Where(s => s.AgendamentoId != null && ids.Contains(s.AgendamentoId.Value))
            .OrderBy(s => s.EmitidaEm)
            .Select(s => new { Agendamento = s.AgendamentoId!.Value, s.Codigo })
            .ToListAsync(ct);

        return pares.GroupBy(p => p.Agendamento).ToDictionary(g => g.Key, g => g.Last().Codigo);
    }

    private static IQueryable<SenhaFila> ComNavegacoes(IQueryable<SenhaFila> consulta) =>
        consulta.Include(s => s.Unidade).Include(s => s.Servico);
}
