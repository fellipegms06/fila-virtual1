using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Tests.Dominio;

public class CadastrosTests
{
    private static UnidadeCras CriarUnidade() =>
        new("CRAS Gama", "Setor Central, Quadra 1", "Gama", "Seg a Sex, 8h às 17h",
            "(61) 0000-0000", -16.02, -48.06);

    [Fact]
    public void HabilitarServico_NaoDeveDuplicar_ServicoJaHabilitado()
    {
        var unidade = CriarUnidade();
        var servico = new Servico("Atualização cadastral", "Atualiza os dados da família.", 30);

        unidade.HabilitarServico(servico.Id);
        unidade.HabilitarServico(servico.Id);

        Assert.Single(unidade.Servicos);
    }

    [Fact]
    public void Servico_DeveLancarDomainException_ParaDuracaoInvalida()
        => Assert.Throws<DomainException>(() => new Servico("Teste", "Descrição", 0));

    [Fact]
    public void AdicionarDocumento_DeveIncluirItemNoChecklist()
    {
        var servico = new Servico("Inscrição", "Primeira inscrição no CadÚnico.", 40);

        servico.AdicionarDocumento("Documento de identificação com foto");

        var documento = Assert.Single(servico.Documentos);
        Assert.True(documento.Obrigatorio);
        Assert.Equal(servico.Id, documento.ServicoId);
    }

    [Fact]
    public void UnidadeCras_DeveLancarDomainException_ParaLatitudeInvalida()
        => Assert.Throws<DomainException>(() =>
            new UnidadeCras("CRAS", "Rua 1", "Centro", "8h às 17h", "(61) 0000-0000", 200, -48));
}