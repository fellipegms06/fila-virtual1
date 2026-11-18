namespace FilaVirtual.Infrastructure.Persistence.Configurations;

public class UnidadeCrasConfiguration : IEntityTypeConfiguration<UnidadeCras>
{
    public void Configure(EntityTypeBuilder<UnidadeCras> builder)
    {
        builder.ToTable("unidades_cras");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Nome).HasMaxLength(150).IsRequired();
        builder.Property(u => u.Endereco).HasMaxLength(200).IsRequired();
        builder.Property(u => u.Bairro).HasMaxLength(100).IsRequired();
        builder.Property(u => u.HorarioFuncionamento).HasMaxLength(100).IsRequired();
        builder.Property(u => u.Telefone).HasMaxLength(20).IsRequired();
    }
}
