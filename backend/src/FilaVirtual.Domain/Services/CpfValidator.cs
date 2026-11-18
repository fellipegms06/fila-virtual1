namespace FilaVirtual.Domain.Services;

public static class CpfValidator
{
    public static string Normalizar(string cpf) =>
        new string(cpf.Where(char.IsDigit).ToArray());

    public static bool Valido(string cpf)
    {
        cpf = Normalizar(cpf);

        if (cpf.Length != 11 || cpf.Distinct().Count() == 1)
            return false;

        return cpf[9] == Digito(cpf, 9) && cpf[10] == Digito(cpf, 10);
    }

    private static char Digito(string cpf, int tamanho)
    {
        var soma = 0;
        for (var i = 0; i < tamanho; i++)
            soma += (cpf[i] - '0') * (tamanho + 1 - i);

        var resto = soma * 10 % 11;
        return (char)('0' + (resto == 10 ? 0 : resto));
    }
}