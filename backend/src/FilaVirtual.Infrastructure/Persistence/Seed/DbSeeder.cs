using FilaVirtual.Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace FilaVirtual.Infrastructure.Persistence.Seed;

public class DbSeeder(AppDbContext db, IPasswordHasher hasher, TimeProvider relogio, ILogger<DbSeeder> logger)
{
    public const int DiasDeAgenda = 14;
    public const int VagasPorHorario = 2;

    public static class Contas
    {
        public const string AdminEmail = "admin@filavirtual.dev";
        public const string AdminSenha = "admin12345";
        public const string AtendenteSenha = "atendente123";
        public const string CidadaoEmail = "cidadao@filavirtual.dev";
        public const string CidadaoIdosoEmail = "idoso@filavirtual.dev";
        public const string CidadaoSenha = "cidadao123";
        public static string AtendenteEmail(int unidade) => $"atendente{unidade}@filavirtual.dev";
    }

    public async Task ExecutarAsync(CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);

        var unidades = await GarantirUnidadesEServicosAsync(ct);
        await GarantirHorariosAsync(unidades, ct);
        await GarantirContasAsync(unidades, ct);

        logger.LogInformation("Seed concluído: {Unidades} unidades CRAS fictícias.", unidades.Count);
    }

    private async Task<List<UnidadeCras>> GarantirUnidadesEServicosAsync(CancellationToken ct)
    {
        var existentes = await db.Unidades.Include(u => u.Servicos).OrderBy(u => u.Nome).ToListAsync(ct);
        if (existentes.Count > 0)
            return existentes;

        var servicos = CriarServicos();
        db.Servicos.AddRange(servicos);

        var unidades = new List<UnidadeCras>
        {
            new("CRAS Simulado Unidade Central", "Quadra Fictícia 1, Lote 10 (endereço fictício)", "Centro",
                "Segunda a sexta, das 8h às 17h", "(61) 3000-0001", -15.7939, -47.8828),
            new("CRAS Simulado Unidade Norte", "Avenida Imaginária 200, Conjunto B (endereço fictício)", "Setor Norte",
                "Segunda a sexta, das 8h às 17h", "(61) 3000-0002", -15.7350, -47.9000),
            new("CRAS Simulado Unidade Sul", "Rua dos Exemplos 45 (endereço fictício)", "Setor Sul",
                "Segunda a sexta, das 8h às 17h", "(61) 3000-0003", -15.8500, -47.9300)
        };

        foreach (var unidade in unidades)
        {
            foreach (var servico in servicos)
            {
                if (unidade.Nome.EndsWith("Sul") && servico.Nome.StartsWith("Inclusão"))
                    continue;
                unidade.HabilitarServico(servico.Id);
            }
        }

        db.Unidades.AddRange(unidades);
        await db.SaveChangesAsync(ct);
        return unidades.OrderBy(u => u.Nome).ToList();
    }

    private static List<Servico> CriarServicos()
    {
        const string docComFoto = "Documento oficial com foto (RG, CNH ou carteira de trabalho)";
        const string cpfResponsavel = "CPF ou título de eleitor do responsável familiar";
        const string comprovante = "Comprovante de residência recente (conta de água, luz ou telefone)";

        var inscricao = new Servico("Inscrição no CadÚnico",
            "Primeiro cadastro da sua família no Cadastro Único, para ter acesso a programas sociais como o Bolsa Família.", 40);
        inscricao.AdicionarDocumento(cpfResponsavel);
        inscricao.AdicionarDocumento(docComFoto);
        inscricao.AdicionarDocumento("Documento de cada pessoa da família (certidão de nascimento, RG ou CPF)");
        inscricao.AdicionarDocumento(comprovante, obrigatorio: false);

        var atualizacao = new Servico("Atualização cadastral",
            "Atualizar as informações da família, como renda, trabalho ou escola das crianças. Faça sempre que algo mudar.", 30);
        atualizacao.AdicionarDocumento(cpfResponsavel);
        atualizacao.AdicionarDocumento(docComFoto);
        atualizacao.AdicionarDocumento("Comprovantes das informações que mudaram (ex.: carteira de trabalho, declaração escolar)", obrigatorio: false);

        var revisao = new Servico("Revisão cadastral",
            "Confirmar se os dados da família continuam corretos. Atende a convocações de revisão do governo.", 30);
        revisao.AdicionarDocumento(cpfResponsavel);
        revisao.AdicionarDocumento(docComFoto);
        revisao.AdicionarDocumento("Carta ou mensagem de convocação para revisão, se tiver", obrigatorio: false);

        var endereco = new Servico("Atualização de endereço",
            "Informar que a família mudou de casa.", 20);
        endereco.AdicionarDocumento(cpfResponsavel);
        endereco.AdicionarDocumento(comprovante);

        var inclusao = new Servico("Inclusão de membro da família",
            "Colocar no cadastro uma pessoa que passou a morar com a família, como um bebê que nasceu.", 30);
        inclusao.AdicionarDocumento(cpfResponsavel);
        inclusao.AdicionarDocumento("Certidão de nascimento, RG ou CPF da pessoa que vai entrar no cadastro");
        inclusao.AdicionarDocumento(docComFoto, obrigatorio: false);

        return [inscricao, atualizacao, revisao, endereco, inclusao];
    }

    private async Task GarantirHorariosAsync(List<UnidadeCras> unidades, CancellationToken ct)
    {
        var agora = relogio.GetUtcNow();
        var inicios = AgendaPadrao.Gerar(agora, DiasDeAgenda).ToList();

        var jaExistentes = (await db.Horarios
                .Where(h => h.DataHora > agora)
                .Select(h => new { h.UnidadeCrasId, h.ServicoId, h.DataHora })
                .ToListAsync(ct))
            .Select(h => (h.UnidadeCrasId, h.ServicoId, h.DataHora.UtcTicks))
            .ToHashSet();

        var novos = 0;
        foreach (var unidade in unidades)
        foreach (var us in unidade.Servicos)
        foreach (var inicio in inicios)
        {
            if (jaExistentes.Contains((unidade.Id, us.ServicoId, inicio.UtcTicks)))
                continue;
            db.Horarios.Add(new HorarioAtendimento(unidade.Id, us.ServicoId, inicio, VagasPorHorario));
            novos++;
        }

        if (novos > 0)
            await db.SaveChangesAsync(ct);
        logger.LogInformation("Seed: {Novos} horários de atendimento criados.", novos);
    }

    private async Task GarantirContasAsync(List<UnidadeCras> unidades, CancellationToken ct)
    {
        await CriarSeNaoExisteAsync("Administrador do Sistema", "12345678909", new DateOnly(1980, 1, 15),
            Contas.AdminEmail, Contas.AdminSenha, PerfilUsuario.Administrador, null, ct);

        string[] cpfsAtendentes = ["98765432100", "11144477735", "22233344405"];
        for (var i = 0; i < unidades.Count && i < cpfsAtendentes.Length; i++)
        {
            await CriarSeNaoExisteAsync($"Atendente {unidades[i].Nome.Replace("CRAS Simulado ", "")}",
                cpfsAtendentes[i], new DateOnly(1988, 3, 10), Contas.AtendenteEmail(i + 1),
                Contas.AtendenteSenha, PerfilUsuario.Atendente, unidades[i].Id, ct);
        }

        await CriarSeNaoExisteAsync("Cidadã de Teste", "55566677720", new DateOnly(1992, 7, 1),
            Contas.CidadaoEmail, Contas.CidadaoSenha, PerfilUsuario.Cidadao, null, ct);

        await CriarSeNaoExisteAsync("Cidadão Idoso de Teste", "31415926590", new DateOnly(1950, 2, 20),
            Contas.CidadaoIdosoEmail, Contas.CidadaoSenha, PerfilUsuario.Cidadao, null, ct);

        await db.SaveChangesAsync(ct);
    }

    private async Task CriarSeNaoExisteAsync(string nome, string cpf, DateOnly nascimento, string email,
        string senha, PerfilUsuario perfil, Guid? unidadeId, CancellationToken ct)
    {
        if (await db.Usuarios.AnyAsync(u => u.Email == email || u.Cpf == cpf, ct))
            return;

        var usuario = new Usuario(nome, cpf, nascimento, email, hasher.Gerar(senha), perfil);
        if (unidadeId is { } id)
            usuario.VincularUnidade(id);
        db.Usuarios.Add(usuario);
    }
}
