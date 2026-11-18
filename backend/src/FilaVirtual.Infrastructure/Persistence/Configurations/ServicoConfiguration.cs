namespace FilaVirtual.Infrastructure.Persistence.Configurations;

public class ServicoConfiguration : IEntityTypeConfiguration<Servico>
{
    public void Configure(EntityTypeBuilder<Servico> builder)
    {
        builder.ToTable("servicos");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Nome).HasMaxLength(100).IsRequired();
        builder.Property(s => s.Descricao).HasMaxLength(500).IsRequired();
    }
}
