using System.IdentityModel.Tokens.Jwt;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Infrastructure.Security;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

namespace FilaVirtual.Tests.Infraestrutura;

public class BcryptPasswordHasherTests
{
    private readonly BcryptPasswordHasher _hasher = new();

    [Fact]
    public void Hash_NaoGuardaASenhaEmTextoPuro_EConfereDepois()
    {
        var hash = _hasher.Gerar("senha-segura");

        Assert.DoesNotContain("senha-segura", hash);
        Assert.StartsWith("$2", hash);
        Assert.True(_hasher.Verificar("senha-segura", hash));
        Assert.False(_hasher.Verificar("senha-errada", hash));
    }

    [Fact]
    public void MesmaSenha_GeraHashesDiferentes_PorCausaDoSal() =>
        Assert.NotEqual(_hasher.Gerar("senha-segura"), _hasher.Gerar("senha-segura"));

    [Fact]
    public void HashCorrompido_ContaComoSenhaErrada() => Assert.False(_hasher.Verificar("x", "nao-e-bcrypt"));
}

public class JwtTokenServiceTests
{
    private static readonly DateTimeOffset Agora = new(2026, 11, 9, 12, 0, 0, TimeSpan.Zero);

    private static JwtTokenService CriarServico() => new(
        Options.Create(new JwtOptions { Key = "chave-de-teste-com-mais-de-32-caracteres!!" }),
        new FakeTimeProvider(Agora));

    [Fact]
    public void Token_TemClaimsDoUsuario_EValidadeDe8Horas()
    {
        var atendente = new Usuario("Ana Atendente", "52998224725", new DateOnly(1985, 1, 1),
                                    "ana@cras.gov", "hash", PerfilUsuario.Atendente);
        var unidadeId = Guid.NewGuid();
        atendente.VincularUnidade(unidadeId);

        var gerado = CriarServico().Gerar(atendente);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(gerado.Token);

        Assert.Equal(atendente.Id.ToString(), jwt.Claims.Single(c => c.Type == "sub").Value);
        Assert.Equal("ana@cras.gov", jwt.Claims.Single(c => c.Type == "email").Value);
        Assert.Equal("Atendente", jwt.Claims.Single(c => c.Type == "role").Value);
        Assert.Equal(unidadeId.ToString(), jwt.Claims.Single(c => c.Type == "unidade").Value);
        Assert.Equal(Agora.AddHours(8), gerado.ExpiraEm);
        Assert.Equal(Agora.AddHours(8).UtcDateTime, jwt.ValidTo);
    }

    [Fact]
    public void Cidadao_NaoTemClaimDeUnidade_NemCpfNoToken()
    {
        var cidadao = new Usuario("Maria", "52998224725", new DateOnly(1990, 1, 1), "maria@email.com", "hash");

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(CriarServico().Gerar(cidadao).Token);

        Assert.DoesNotContain(jwt.Claims, c => c.Type == "unidade");
        Assert.DoesNotContain(jwt.Claims, c => c.Value.Contains("52998224725"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("curta")]
    public void ChaveFraca_ImpedeAInicializacao(string chave) =>
        Assert.Throws<InvalidOperationException>(() => new JwtOptions { Key = chave }.Validar());
}
