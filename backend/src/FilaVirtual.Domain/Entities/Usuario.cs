using System.Net.Mail;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Exceptions;
using FilaVirtual.Domain.Services;

namespace FilaVirtual.Domain.Entities;

public class Usuario
{
    private Usuario() { }

    public Usuario(string nomeCompleto, string cpf, DateOnly dataNascimento,string email, string senhaHash, PerfilUsuario perfil = PerfilUsuario.Cidadao)
    {
        if (string.IsNullOrWhiteSpace(nomeCompleto))
            throw new DomainException("Informe o nome completo.");
        if (!CpfValidator.Valido(cpf))
            throw new DomainException("CPF inválido.");
        if (dataNascimento > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new DomainException("A data de nascimento não pode estar no futuro.");
        if (!EmailValido(email))
            throw new DomainException("Informe um e-mail válido.");
        if (string.IsNullOrWhiteSpace(senhaHash))
            throw new DomainException("A senha é obrigatória.");

        Id = Guid.NewGuid();
        NomeCompleto = nomeCompleto.Trim();
        Cpf = CpfValidator.Normalizar(cpf);
        DataNascimento = dataNascimento;
        Email = email.Trim().ToLowerInvariant();
        SenhaHash = senhaHash;
        Perfil = perfil;
        CriadoEm = DateTimeOffset.UtcNow;
    }

    public Guid Id { get; private set; }
    public string NomeCompleto { get; private set; } = default!;
    public string Cpf { get; private set; } = default!;
    public DateOnly DataNascimento { get; private set; }
    public string Email { get; private set; } = default!;
    public string SenhaHash { get; private set; } = default!;
    public PerfilUsuario Perfil { get; private set; }
    public string? Telefone { get; private set; }
    public Guid? UnidadeCrasId { get; private set; }
    public DateTimeOffset CriadoEm { get; private set; }

    public void AtualizarEmail(string email)
    {
        if (!EmailValido(email))
            throw new DomainException("Informe um e-mail válido.");
        Email = email.Trim().ToLowerInvariant();
    }

    public void AtualizarSenha(string novoHash)
    {
        if (string.IsNullOrWhiteSpace(novoHash))
            throw new DomainException("A senha é obrigatória.");
        SenhaHash = novoHash;
    }

    public void AtualizarTelefone(string? telefone)
    {
        if (string.IsNullOrWhiteSpace(telefone))
        {
            Telefone = null;
            return;
        }

        var digitos = new string(telefone.Where(char.IsDigit).ToArray());
        if (digitos.Length is < 10 or > 11)
            throw new DomainException("Informe o telefone com DDD (10 ou 11 dígitos).");
        Telefone = digitos;
    }

    public void VincularUnidade(Guid unidadeId)
    {
        if (Perfil != PerfilUsuario.Atendente)
            throw new DomainException("Só atendentes podem ser vinculados a uma unidade.");
        UnidadeCrasId = unidadeId;
    }

    public bool EhIdoso(DateOnly hoje)
    {
        var idade = hoje.Year - DataNascimento.Year;
        if (DataNascimento > hoje.AddYears(-idade)) idade--;
        return idade >= 60;
    }

    private static bool EmailValido(string email) =>
        !string.IsNullOrWhiteSpace(email)
        && MailAddress.TryCreate(email.Trim(), out var endereco)
        && endereco.Address == email.Trim();
}