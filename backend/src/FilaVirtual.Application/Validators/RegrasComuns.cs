using FilaVirtual.Domain.Services;
using FluentValidation;

namespace FilaVirtual.Application.Validators;

public static class RegrasComuns
{
    public const int TamanhoMinimoSenha = 8;

    public static IRuleBuilderOptions<T, string> EmailValido<T>(this IRuleBuilder<T, string> regra) =>
        regra.NotEmpty().WithMessage("Informe o e-mail.")
             .MaximumLength(150).WithMessage("O e-mail deve ter no máximo 150 caracteres.")
             .EmailAddress().WithMessage("Informe um e-mail válido.");

    public static IRuleBuilderOptions<T, string?> SenhaForte<T>(this IRuleBuilder<T, string?> regra) =>
        regra.NotEmpty().WithMessage("Informe a senha.")
             .MinimumLength(TamanhoMinimoSenha).WithMessage($"A senha deve ter pelo menos {TamanhoMinimoSenha} caracteres.")
             .MaximumLength(100).WithMessage("A senha deve ter no máximo 100 caracteres.");

    public static IRuleBuilderOptions<T, string?> TelefoneOpcional<T>(this IRuleBuilder<T, string?> regra) =>
        regra.Must(t => string.IsNullOrWhiteSpace(t) || t.Count(char.IsDigit) is 10 or 11)
             .WithMessage("Informe o telefone com DDD (10 ou 11 dígitos).");

    public static IRuleBuilderOptions<T, string> CpfValido<T>(this IRuleBuilder<T, string> regra) =>
        regra.NotEmpty().WithMessage("Informe o CPF.")
             .Must(CpfValidator.Valido).WithMessage("CPF inválido.");
}
