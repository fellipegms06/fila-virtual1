namespace FilaVirtual.Infrastructure.Persistence.Configurations;

public class ServicoDocumentoConfiguration : IEntityTypeConfiguration<ServicoDocumento>
{
    public void Configure(EntityTypeBuilder<ServicoDocumento> builder)
    {
        builder.ToTable("servico_documentos");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Descricao).HasMaxLength(200).IsRequired();

        builder.HasOne<Servico>()
               .WithMany(s => s.Documentos)
               .HasForeignKey(d => d.ServicoId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
