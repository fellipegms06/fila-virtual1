namespace FilaVirtual.Infrastructure.Persistence.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.NomeCompleto).HasMaxLength(150).IsRequired();
        builder.Property(u => u.Cpf).HasMaxLength(11).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(150).IsRequired();
        builder.Property(u => u.SenhaHash).HasMaxLength(200).IsRequired();
        builder.Property(u => u.Telefone).HasMaxLength(11);
        builder.Property(u => u.Perfil).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(u => u.Cpf).IsUnique();
        builder.HasIndex(u => u.Email).IsUnique();

        builder.HasOne<UnidadeCras>()
               .WithMany()
               .HasForeignKey(u => u.UnidadeCrasId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
