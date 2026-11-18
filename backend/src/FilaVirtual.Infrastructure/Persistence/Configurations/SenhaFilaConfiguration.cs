namespace FilaVirtual.Infrastructure.Persistence.Configurations;

public class SenhaFilaConfiguration : IEntityTypeConfiguration<SenhaFila>
{
    public void Configure(EntityTypeBuilder<SenhaFila> builder)
    {
        builder.ToTable("senhas_fila");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Codigo).HasMaxLength(10).IsRequired();
        builder.Property(s => s.Guiche).HasMaxLength(50);
        builder.Property(s => s.Prioridade).HasConversion<string>().HasMaxLength(20);
        builder.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);

        builder.Ignore(s => s.Ativa);

        builder.Property<uint>(HorarioAtendimentoConfiguration.Versao).IsRowVersion();

        builder.HasIndex(s => new { s.UnidadeCrasId, s.Status, s.EmitidaEm });

        builder.HasIndex(s => new { s.UnidadeCrasId, s.DataReferencia, s.Numero }).IsUnique();

        builder.HasOne(s => s.Unidade).WithMany()
               .HasForeignKey(s => s.UnidadeCrasId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(s => s.Servico).WithMany()
               .HasForeignKey(s => s.ServicoId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Usuario>().WithMany()
               .HasForeignKey(s => s.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Agendamento>().WithMany()
               .HasForeignKey(s => s.AgendamentoId).OnDelete(DeleteBehavior.Restrict);
    }
}
