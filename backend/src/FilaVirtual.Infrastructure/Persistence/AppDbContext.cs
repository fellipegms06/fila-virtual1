namespace FilaVirtual.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<UnidadeCras> Unidades => Set<UnidadeCras>();
    public DbSet<Servico> Servicos => Set<Servico>();
    public DbSet<ServicoDocumento> ServicoDocumentos => Set<ServicoDocumento>();
    public DbSet<UnidadeServico> UnidadeServicos => Set<UnidadeServico>();
    public DbSet<HorarioAtendimento> Horarios => Set<HorarioAtendimento>();
    public DbSet<Agendamento> Agendamentos => Set<Agendamento>();
    public DbSet<SenhaFila> Senhas => Set<SenhaFila>();
    public DbSet<Notificacao> Notificacoes => Set<Notificacao>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
}
