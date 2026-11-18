using FilaVirtual.Application.Abstractions;
using FilaVirtual.Domain.Services;
using FluentValidation;

namespace FilaVirtual.Application.UseCases.Unidades;

public class ListarUnidadesUseCase(IValidator<ListarUnidadesRequest> validator, IUnidadeCrasRepository unidades)
{
    public async Task<IReadOnlyList<UnidadeResumoResponse>> ExecutarAsync(
        ListarUnidadesRequest req, CancellationToken ct = default)
    {
        await validator.ValidateAndThrowAsync(req, ct);

        var lista = (await unidades.ListarAsync(ct))
            .Select(u => new UnidadeResumoResponse(
                u.Id, u.Nome, u.Endereco, u.Bairro, u.HorarioFuncionamento, u.Telefone, u.Latitude, u.Longitude,
                req is { Lat: { } lat, Lng: { } lng }
                    ? Math.Round(Geolocalizacao.DistanciaKm(lat, lng, u.Latitude, u.Longitude), 1)
                    : null));

        return req.Lat is null
            ? lista.OrderBy(u => u.Nome).ToList()
            : lista.OrderBy(u => u.DistanciaKm).ThenBy(u => u.Nome).ToList();
    }
}
