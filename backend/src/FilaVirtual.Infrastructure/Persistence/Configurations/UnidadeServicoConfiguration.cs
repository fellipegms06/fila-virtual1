namespace FilaVirtual.Infrastructure.Persistence.Configurations;

public class UnidadeServicoConfiguration : IEntityTypeConfiguration<UnidadeServico>
{
    public void Configure(EntityTypeBuilder<UnidadeServico> builder)
    {
        builder.ToTable("unidade_servicos");
        builder.HasKey(us => new { us.UnidadeCrasId, us.ServicoId });

        builder.HasOne(us => us.UnidadeCras)
               .WithMany(u => u.Servicos)
               .HasForeignKey(us => us.UnidadeCrasId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(us => us.Servico)
               .WithMany()
               .HasForeignKey(us => us.ServicoId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
