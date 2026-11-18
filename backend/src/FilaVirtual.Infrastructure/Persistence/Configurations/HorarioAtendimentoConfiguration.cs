namespace FilaVirtual.Infrastructure.Persistence.Configurations;

public class HorarioAtendimentoConfiguration : IEntityTypeConfiguration<HorarioAtendimento>
{
    public const string Versao = "Version";

    public void Configure(EntityTypeBuilder<HorarioAtendimento> builder)
    {
        builder.ToTable("horarios_atendimento");
        builder.HasKey(h => h.Id);

        builder.Ignore(h => h.VagasDisponiveis);
        builder.Ignore(h => h.TemVaga);
        builder.ToTable(t => t.HasCheckConstraint("ck_horarios_vagas_ocupadas", "\"VagasOcupadas\" BETWEEN 0 AND \"Vagas\""));

        builder.Property<uint>(Versao).IsRowVersion();

        builder.HasOne(h => h.Unidade)
               .WithMany()
               .HasForeignKey(h => h.UnidadeCrasId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.Servico)
               .WithMany()
               .HasForeignKey(h => h.ServicoId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(h => new { h.UnidadeCrasId, h.ServicoId, h.DataHora }).IsUnique();
    }
}
