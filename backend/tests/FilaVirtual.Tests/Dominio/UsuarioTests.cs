using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Tests.Dominio;

public class UsuarioTests
{
    private static Usuario CriarUsuario(string cpf = "52998224725", DateOnly? nascimento = null) =>
        new("Maria da Silva", cpf, nascimento ?? new DateOnly(1990, 5, 20),
            "Maria@Email.com", "hash-qualquer");

    [Fact]
    public void Construtor_DeveCriarUsuario_ComDadosValidos()
    {
        var usuario = CriarUsuario("529.982.247-25");

        Assert.NotEqual(Guid.Empty, usuario.Id);
        Assert.Equal("52998224725", usuario.Cpf);
        Assert.Equal("maria@email.com", usuario.Email);
        Assert.Equal(PerfilUsuario.Cidadao, usuario.Perfil);
    }

    [Fact]
    public void Construtor_DeveLancarDomainException_ParaCpfInvalido()
    {
        var erro = Assert.Throws<DomainException>(() => CriarUsuario("11111111111"));
        Assert.Equal("CPF inválido.", erro.Message);
    }

    [Fact]
    public void Construtor_DeveLancarDomainException_ParaNascimentoNoFuturo()
    {
        var amanha = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        Assert.Throws<DomainException>(() => CriarUsuario(nascimento: amanha));
    }

    [Theory]
    [InlineData(1966, 10, 19, true)]
    [InlineData(1966, 10, 20, false)]
    [InlineData(1950, 1, 1, true)]
    [InlineData(1990, 5, 20, false)]
    public void EhIdoso_DeveConsiderarSessentaAnosOuMais(int ano, int mes, int dia, bool esperado)
    {
        var hoje = new DateOnly(2026, 10, 19);
        var usuario = CriarUsuario(nascimento: new DateOnly(ano, mes, dia));

        Assert.Equal(esperado, usuario.EhIdoso(hoje));
    }
}