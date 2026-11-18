using FilaVirtual.Domain.Services;

namespace FilaVirtual.Tests.Dominio;

public class CpfValidatorTests
{
    [Theory]
    [InlineData("52998224725")]
    [InlineData("529.982.247-25")]
    public void Valido_DeveRetornarTrue_ParaCpfValido(string cpf)
        => Assert.True(CpfValidator.Valido(cpf));

    [Theory]
    [InlineData("52998224724")]
    [InlineData("11111111111")]
    [InlineData("123")]
    [InlineData("")]
    public void Valido_DeveRetornarFalse_ParaCpfInvalido(string cpf)
        => Assert.False(CpfValidator.Valido(cpf));

    [Fact]
    public void Normalizar_DeveRemoverPontuacao()
        => Assert.Equal("52998224725", CpfValidator.Normalizar("529.982.247-25"));
}