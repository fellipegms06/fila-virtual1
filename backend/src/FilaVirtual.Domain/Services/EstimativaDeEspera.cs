namespace FilaVirtual.Domain.Services;

public static class EstimativaDeEspera
{
    public const int AtendimentosConsiderados = 20;

    public static int Minutos(int posicao, double? mediaRealMinutos, int duracaoMediaDoServico)
    {
        if (posicao <= 0) return 0;
        var media = mediaRealMinutos is > 0 ? mediaRealMinutos.Value : duracaoMediaDoServico;
        return (int)Math.Ceiling(posicao * media);
    }
}
