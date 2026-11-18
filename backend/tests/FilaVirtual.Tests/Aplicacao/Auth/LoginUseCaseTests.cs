using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Auth;
using FilaVirtual.Application.Validators;
using FilaVirtual.Domain.Entities;
using NSubstitute;

namespace FilaVirtual.Tests.Aplicacao.Auth;

public class LoginUseCaseTests
{
    private readonly IUsuarioRepository _usuarios = Substitute.For<IUsuarioRepository>();
    private readonly IPasswordHasher _hasher = Substitute.For<IPasswordHasher>();
    private readonly ITokenService _tokens = Substitute.For<ITokenService>();
    private readonly LoginUseCase _useCase;
    private readonly Usuario _maria = new("Maria da Silva", "52998224725", new DateOnly(1990, 5, 20),
                                          "maria@email.com", "hash-certo");

    public LoginUseCaseTests()
    {
        _tokens.Gerar(Arg.Any<Usuario>()).Returns(new TokenGerado("token-jwt", DateTimeOffset.UtcNow.AddHours(8)));
        _usuarios.ObterPorEmailAsync("maria@email.com", Arg.Any<CancellationToken>()).Returns(_maria);
        _hasher.Verificar("senha-certa", "hash-certo").Returns(true);
        _useCase = new LoginUseCase(new LoginValidator(), _usuarios, _hasher, _tokens);
    }

    [Fact]
    public async Task DeveEntrar_ComEmailEmQualquerCaixa_ESenhaCorreta()
    {
        var resposta = await _useCase.ExecutarAsync(new LoginRequest("  MARIA@email.com ", "senha-certa"));

        Assert.Equal("token-jwt", resposta.Token);
        Assert.Equal(_maria.Id, resposta.Usuario.Id);
    }

    [Fact]
    public async Task SenhaErrada_DeveDar401_ComMensagemGenerica()
    {
        var erro = await Assert.ThrowsAsync<UnauthorizedAppException>(
            () => _useCase.ExecutarAsync(new LoginRequest("maria@email.com", "senha-errada")));
        Assert.Equal(LoginUseCase.MensagemCredenciaisInvalidas, erro.Message);
    }

    [Fact]
    public async Task EmailInexistente_DeveDarAMesmaMensagem_DaSenhaErrada()
    {
        var erro = await Assert.ThrowsAsync<UnauthorizedAppException>(
            () => _useCase.ExecutarAsync(new LoginRequest("ninguem@email.com", "qualquer")));
        Assert.Equal(LoginUseCase.MensagemCredenciaisInvalidas, erro.Message);
    }
}
