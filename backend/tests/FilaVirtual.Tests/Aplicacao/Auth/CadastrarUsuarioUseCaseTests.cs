using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Auth;
using FilaVirtual.Application.Validators;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FluentValidation;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace FilaVirtual.Tests.Aplicacao.Auth;

public class CadastrarUsuarioUseCaseTests
{
    private readonly IUsuarioRepository _usuarios = Substitute.For<IUsuarioRepository>();
    private readonly IPasswordHasher _hasher = Substitute.For<IPasswordHasher>();
    private readonly ITokenService _tokens = Substitute.For<ITokenService>();
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly CadastrarUsuarioUseCase _useCase;

    public CadastrarUsuarioUseCaseTests()
    {
        var relogio = new FakeTimeProvider(new DateTimeOffset(2026, 11, 9, 12, 0, 0, TimeSpan.Zero));
        _hasher.Gerar(Arg.Any<string>()).Returns("hash-bcrypt");
        _tokens.Gerar(Arg.Any<Usuario>()).Returns(new TokenGerado("token-jwt", relogio.GetUtcNow().AddHours(8)));
        _useCase = new CadastrarUsuarioUseCase(
            new CadastrarUsuarioValidator(relogio), _usuarios, _hasher, _tokens, _uow);
    }

    private static CadastrarUsuarioRequest RequisicaoValida(string cpf = "529.982.247-25") =>
        new("Maria da Silva", cpf, new DateOnly(1990, 5, 20), "Maria@Email.com", "senha-segura", "(61) 99999-0000");

    [Fact]
    public async Task DeveCadastrarCidadao_ComSenhaEmHash_EDevolverToken()
    {
        var resposta = await _useCase.ExecutarAsync(RequisicaoValida());

        Assert.Equal("token-jwt", resposta.Token);
        Assert.Equal("52998224725", resposta.Usuario.Cpf);
        Assert.Equal("maria@email.com", resposta.Usuario.Email);
        Assert.Equal("61999990000", resposta.Usuario.Telefone);
        Assert.Equal(nameof(PerfilUsuario.Cidadao), resposta.Usuario.Perfil);

        await _usuarios.Received(1).AdicionarAsync(
            Arg.Is<Usuario>(u => u.SenhaHash == "hash-bcrypt"), Arg.Any<CancellationToken>());
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeveRecusar_CpfJaCadastrado_Com409()
    {
        _usuarios.CpfExisteAsync("52998224725", Arg.Any<CancellationToken>()).Returns(true);

        var erro = await Assert.ThrowsAsync<ConflictException>(() => _useCase.ExecutarAsync(RequisicaoValida()));

        Assert.Equal("Já existe uma conta com este CPF.", erro.Message);
        await _uow.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeveRecusar_EmailJaCadastrado_Com409()
    {
        _usuarios.EmailExisteAsync("maria@email.com", null, Arg.Any<CancellationToken>()).Returns(true);

        var erro = await Assert.ThrowsAsync<ConflictException>(() => _useCase.ExecutarAsync(RequisicaoValida()));
        Assert.Equal("Já existe uma conta com este e-mail.", erro.Message);
    }

    [Fact]
    public async Task DeveTraduzir_DuplicidadeDetectadaPeloBanco_EmConflito()
    {
        _uow.SaveChangesAsync(Arg.Any<CancellationToken>()).ThrowsAsync(new RegistroDuplicadoException());

        await Assert.ThrowsAsync<ConflictException>(() => _useCase.ExecutarAsync(RequisicaoValida()));
    }

    [Theory]
    [InlineData("111.111.111-11", "Cpf")]
    [InlineData("123", "Cpf")]
    public async Task DeveRecusar_CpfInvalido_ComErroDeValidacao(string cpf, string campo)
    {
        var erro = await Assert.ThrowsAsync<ValidationException>(() => _useCase.ExecutarAsync(RequisicaoValida(cpf)));
        Assert.Contains(erro.Errors, e => e.PropertyName == campo && e.ErrorMessage == "CPF inválido.");
    }
}
