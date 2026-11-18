using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.UseCases.Unidades;

public record ListarUnidadesRequest(double? Lat, double? Lng);

public record UnidadeResumoResponse(
    Guid Id, string Nome, string Endereco, string Bairro, string HorarioFuncionamento, string Telefone,
    double Latitude, double Longitude, double? DistanciaKm);

public record DocumentoResponse(string Descricao, bool Obrigatorio);

public record ServicoResponse(
    Guid Id, string Nome, string Descricao, int DuracaoMediaMinutos, IReadOnlyList<DocumentoResponse> Documentos)
{
    public static ServicoResponse De(Servico s) => new(
        s.Id, s.Nome, s.Descricao, s.DuracaoMediaMinutos,
        s.Documentos.OrderByDescending(d => d.Obrigatorio).ThenBy(d => d.Descricao)
                    .Select(d => new DocumentoResponse(d.Descricao, d.Obrigatorio)).ToList());
}

public record UnidadeDetalheResponse(
    Guid Id, string Nome, string Endereco, string Bairro, string HorarioFuncionamento, string Telefone,
    double Latitude, double Longitude, IReadOnlyList<ServicoResponse> Servicos)
{
    public static UnidadeDetalheResponse De(UnidadeCras u) => new(
        u.Id, u.Nome, u.Endereco, u.Bairro, u.HorarioFuncionamento, u.Telefone, u.Latitude, u.Longitude,
        u.Servicos.Select(us => ServicoResponse.De(us.Servico)).OrderBy(s => s.Nome).ToList());
}
