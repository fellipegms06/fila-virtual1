using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Tests.Dominio;

public class UsuarioTelefoneTests
{
    private static Usuario Maria() =>
        new("Maria da Silva", "52998224725", new DateOnly(1990, 5, 20), "maria@email.com", "hash");

    [Theory]
    [InlineData("(61) 99999-0000", "61999990000")]
    [InlineData("61 3333-4444", "6133334444")]
    public void AtualizarTelefone_GuardaSoDigitos(string entrada, string esperado)
    {
        var usuario = Maria();
        usuario.AtualizarTelefone(entrada);
        Assert.Equal(esperado, usuario.Telefone);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void AtualizarTelefone_VazioRemoveOContato(string? entrada)
    {
        var usuario = Maria();
        usuario.AtualizarTelefone("61999990000");
        usuario.AtualizarTelefone(entrada);
        Assert.Null(usuario.Telefone);
    }

    [Fact]
    public void AtualizarTelefone_SemDdd_LancaDomainException() =>
        Assert.Throws<DomainException>(() => Maria().AtualizarTelefone("99990000"));
}
