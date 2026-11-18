using FilaVirtual.Domain.Services;

namespace FilaVirtual.Tests.Dominio;

public class GeolocalizacaoTests
{
    [Fact]
    public void MesmoPonto_DistanciaZero() =>
        Assert.Equal(0, Geolocalizacao.DistanciaKm(-15.79, -47.88, -15.79, -47.88), precision: 6);

    [Fact]
    public void UmGrauDeLatitude_ValeCercaDe111Km()
    {
        var km = Geolocalizacao.DistanciaKm(0, 0, 1, 0);
        Assert.Equal(111.19, km, precision: 2);
    }

    [Fact]
    public void Distancia_EhSimetrica() =>
        Assert.Equal(
            Geolocalizacao.DistanciaKm(-15.73, -47.90, -15.85, -47.93),
            Geolocalizacao.DistanciaKm(-15.85, -47.93, -15.73, -47.90), precision: 9);
}
