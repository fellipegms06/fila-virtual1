using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Auth;
using FilaVirtual.Application.Validators;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Exceptions;
using NSubstitute;

namespace FilaVirtual.Tests.Aplicacao.Auth;

public class AtualizarDadosCadastraisUseCaseTests
{
    private readonly IUsuarioRepository _usuarios = Substitute.For<IUsuarioRepository>();
    private readonly IPasswordHasher _hasher = Substitute.For<IPasswordHasher>();
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly AtualizarDadosCadastraisUseCase _useCase;
    private readonly Usuario _maria = new("Maria da Silva", "52998224725", new DateOnly(1990, 5, 20),
                                          "maria@email.com", "hash-antigo");

    public AtualizarDadosCadastraisUseCaseTests()
    {
        _usuarios.ObterPorIdAsync(_maria.Id, Arg.Any<CancellationToken>()).Returns(_maria);
        _hasher.Verificar("senha-atual", "hash-antigo").Returns(true);
        _hasher.Gerar("nova-senha-123").Returns("hash-novo");
        _useCase = new AtualizarDadosCadastraisUseCase(new AtualizarDadosCadastraisValidator(), _usuarios, _hasher, _uow);
    }

    [Fact]
    public async Task DeveAtualizar_EmailETelefone_SemMexerNaSenha()
    {
        var resposta = await _useCase.ExecutarAsync(_maria.Id,
            new AtualizarDadosCadastraisRequest("nova@email.com", "61 3333-4444", null, null));

        Assert.Equal("nova@email.com", resposta.Email);
        Assert.Equal("6133334444", resposta.Telefone);
        Assert.Equal("hash-antigo", _maria.SenhaHash);
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeveTrocarSenha_QuandoASenhaAtualConfere()
    {
        await _useCase.ExecutarAsync(_maria.Id,
            new AtualizarDadosCadastraisRequest("maria@email.com", null, "senha-atual", "nova-senha-123"));

        Assert.Equal("hash-novo", _maria.SenhaHash);
    }

    [Fact]
    public async Task NaoDeveTrocarSenha_QuandoASenhaAtualEstaErrada()
    {
        var erro = await Assert.ThrowsAsync<DomainException>(() => _useCase.ExecutarAsync(_maria.Id,
            new AtualizarDadosCadastraisRequest("maria@email.com", null, "chute", "nova-senha-123")));

        Assert.Equal("A senha atual está incorreta.", erro.Message);
        Assert.Equal("hash-antigo", _maria.SenhaHash);
        await _uow.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task NaoDevePermitir_EmailDeOutraConta()
    {
        _usuarios.EmailExisteAsync("joao@email.com", _maria.Id, Arg.Any<CancellationToken>()).Returns(true);

        await Assert.ThrowsAsync<ConflictException>(() => _useCase.ExecutarAsync(_maria.Id,
            new AtualizarDadosCadastraisRequest("joao@email.com", null, null, null)));
    }

    [Fact]
    public async Task ManterOProprioEmail_NaoConsultaDuplicidade()
    {
        await _useCase.ExecutarAsync(_maria.Id, new AtualizarDadosCadastraisRequest("maria@email.com", null, null, null));

        await _usuarios.DidNotReceive().EmailExisteAsync(Arg.Any<string>(), Arg.Any<Guid?>(), Arg.Any<CancellationToken>());
    }
}
