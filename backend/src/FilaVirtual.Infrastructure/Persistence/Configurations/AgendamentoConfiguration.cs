namespace FilaVirtual.Infrastructure.Persistence.Configurations;

public class AgendamentoConfiguration : IEntityTypeConfiguration<Agendamento>
{
    public void Configure(EntityTypeBuilder<Agendamento> builder)
    {
        builder.ToTable("agendamentos");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(a => a.CodigoCheckin).HasMaxLength(8).IsRequired();

        builder.Property<uint>(HorarioAtendimentoConfiguration.Versao).IsRowVersion();

        builder.HasIndex(a => a.CodigoCheckin).IsUnique();

        builder.HasIndex(a => new { a.UsuarioId, a.HorarioAtendimentoId })
               .IsUnique()
               .HasFilter("\"Status\" <> 'Cancelado'");

        builder.HasOne<Usuario>()
               .WithMany()
               .HasForeignKey(a => a.UsuarioId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Horario)
               .WithMany()
               .HasForeignKey(a => a.HorarioAtendimentoId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
