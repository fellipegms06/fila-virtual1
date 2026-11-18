using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Unidades;
using FilaVirtual.Application.Validators;
using FilaVirtual.Domain.Entities;
using FluentValidation;
using NSubstitute;

namespace FilaVirtual.Tests.Aplicacao.Unidades;

public class UnidadesUseCasesTests
{
    private readonly IUnidadeCrasRepository _repo = Substitute.For<IUnidadeCrasRepository>();

    private static readonly UnidadeCras Central =
        new("CRAS Central", "Rua A", "Centro", "8h às 17h", "6130000001", -15.7939, -47.8828);
    private static readonly UnidadeCras Norte =
        new("CRAS Norte", "Rua B", "Norte", "8h às 17h", "6130000002", -15.7350, -47.9000);
    private static readonly UnidadeCras Sul =
        new("CRAS Sul", "Rua C", "Sul", "8h às 17h", "6130000003", -15.8500, -47.9300);

    public UnidadesUseCasesTests() =>
        _repo.ListarAsync(Arg.Any<CancellationToken>()).Returns([Sul, Central, Norte]);

    private ListarUnidadesUseCase Listar() => new(new ListarUnidadesValidator(), _repo);

    [Fact]
    public async Task SemLocalizacao_OrdenaPorNome_ESemDistancia()
    {
        var lista = await Listar().ExecutarAsync(new ListarUnidadesRequest(null, null));

        Assert.Equal(["CRAS Central", "CRAS Norte", "CRAS Sul"], lista.Select(u => u.Nome));
        Assert.All(lista, u => Assert.Null(u.DistanciaKm));
    }

    [Fact]
    public async Task ComLocalizacao_OrdenaDaMaisProximaParaAMaisDistante()
    {
        var lista = await Listar().ExecutarAsync(new ListarUnidadesRequest(-15.849, -47.929));

        Assert.Equal("CRAS Sul", lista[0].Nome);
        Assert.True(lista[0].DistanciaKm < 1);
        Assert.True(lista.Select(u => u.DistanciaKm!.Value).SequenceEqual(lista.Select(u => u.DistanciaKm!.Value).Order()));
    }

    [Fact]
    public async Task SoLatitude_EhErroDeValidacao()
    {
        var erro = await Assert.ThrowsAsync<ValidationException>(
            () => Listar().ExecutarAsync(new ListarUnidadesRequest(-15.8, null)));
        Assert.Contains(erro.Errors, e => e.ErrorMessage == "Informe latitude e longitude juntas.");
    }

    [Fact]
    public async Task ObterUnidade_Inexistente_Da404()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => new ObterUnidadeUseCase(_repo).ExecutarAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task ListarServicos_TrazChecklist_ComObrigatoriosPrimeiro()
    {
        var unidade = new UnidadeCras("CRAS X", "Rua", "Bairro", "8h", "6130000000", 0, 0);
        var servico = new Servico("Atualização de endereço", "Mudou de casa.", 20);
        servico.AdicionarDocumento("Comprovante de residência", obrigatorio: false);
        servico.AdicionarDocumento("CPF do responsável");
        unidade.HabilitarServico(servico.Id);
        typeof(UnidadeServico).GetProperty(nameof(UnidadeServico.Servico))!
            .SetValue(unidade.Servicos.Single(), servico);
        _repo.ObterComServicosAsync(unidade.Id, Arg.Any<CancellationToken>()).Returns(unidade);

        var servicos = await new ListarServicosDaUnidadeUseCase(_repo).ExecutarAsync(unidade.Id);

        var docs = Assert.Single(servicos).Documentos;
        Assert.Equal(["CPF do responsável", "Comprovante de residência"], docs.Select(d => d.Descricao));
        Assert.True(docs[0].Obrigatorio);
        Assert.False(docs[1].Obrigatorio);
    }
}
