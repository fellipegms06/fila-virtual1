namespace FilaVirtual.Domain.Services;

public static class Geolocalizacao
{
    private const double RaioDaTerraKm = 6371.0;

    public static double DistanciaKm(double lat1, double lng1, double lat2, double lng2)
    {
        var dLat = EmRadianos(lat2 - lat1);
        var dLng = EmRadianos(lng2 - lng1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(EmRadianos(lat1)) * Math.Cos(EmRadianos(lat2))
              * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        return RaioDaTerraKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double EmRadianos(double graus) => graus * Math.PI / 180;
}
