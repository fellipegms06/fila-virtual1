namespace FilaVirtual.Infrastructure.Persistence.Configurations;

public class NotificacaoConfiguration : IEntityTypeConfiguration<Notificacao>
{
    public void Configure(EntityTypeBuilder<Notificacao> builder)
    {
        builder.ToTable("notificacoes");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Titulo).HasMaxLength(150).IsRequired();
        builder.Property(n => n.Mensagem).HasMaxLength(500).IsRequired();
        builder.Property(n => n.Tipo).HasConversion<string>().HasMaxLength(30);

        builder.HasIndex(n => new { n.UsuarioId, n.Lida, n.CriadaEm });

        builder.HasOne<Usuario>()
               .WithMany()
               .HasForeignKey(n => n.UsuarioId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
