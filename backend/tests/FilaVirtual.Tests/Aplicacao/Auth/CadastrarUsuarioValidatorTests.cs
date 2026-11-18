using FilaVirtual.Application.UseCases.Auth;
using FilaVirtual.Application.Validators;
using Microsoft.Extensions.Time.Testing;

namespace FilaVirtual.Tests.Aplicacao.Auth;

public class CadastrarUsuarioValidatorTests
{
    private readonly CadastrarUsuarioValidator _validator =
        new(new FakeTimeProvider(new DateTimeOffset(2026, 11, 9, 12, 0, 0, TimeSpan.Zero)));

    private static CadastrarUsuarioRequest Valida() =>
        new("Maria da Silva", "52998224725", new DateOnly(1990, 5, 20), "maria@email.com", "senha-segura", null);

    private string? PrimeiroErro(CadastrarUsuarioRequest req) =>
        _validator.Validate(req).Errors.FirstOrDefault()?.ErrorMessage;

    [Fact]
    public void RequisicaoValida_NaoTemErros() => Assert.True(_validator.Validate(Valida()).IsValid);

    [Fact]
    public void NomeVazio() =>
        Assert.Equal("Informe o nome completo.", PrimeiroErro(Valida() with { NomeCompleto = "" }));

    [Fact]
    public void EmailMalFormatado() =>
        Assert.Equal("Informe um e-mail válido.", PrimeiroErro(Valida() with { Email = "maria.email.com" }));

    [Fact]
    public void SenhaCurta() =>
        Assert.Equal("A senha deve ter pelo menos 8 caracteres.", PrimeiroErro(Valida() with { Senha = "1234567" }));

    [Fact]
    public void NascimentoHojeOuNoFuturo() =>
        Assert.Equal("A data de nascimento deve estar no passado.",
            PrimeiroErro(Valida() with { DataNascimento = new DateOnly(2026, 11, 9) }));

    [Theory]
    [InlineData("6199999")]
    [InlineData("619999900001")]
    public void TelefoneSemDdd(string telefone) =>
        Assert.Equal("Informe o telefone com DDD (10 ou 11 dígitos).", PrimeiroErro(Valida() with { Telefone = telefone }));

    [Fact]
    public void TelefoneVazio_EhPermitido() => Assert.True(_validator.Validate(Valida() with { Telefone = "" }).IsValid);
}
