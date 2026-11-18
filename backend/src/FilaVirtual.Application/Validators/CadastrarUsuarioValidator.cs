using FilaVirtual.Application.UseCases.Auth;
using FluentValidation;

namespace FilaVirtual.Application.Validators;

public class CadastrarUsuarioValidator : AbstractValidator<CadastrarUsuarioRequest>
{
    public CadastrarUsuarioValidator(TimeProvider relogio)
    {
        RuleFor(x => x.NomeCompleto)
            .NotEmpty().WithMessage("Informe o nome completo.")
            .MaximumLength(150).WithMessage("O nome deve ter no máximo 150 caracteres.");

        RuleFor(x => x.Cpf).CpfValido();

        RuleFor(x => x.DataNascimento)
            .NotEmpty().WithMessage("Informe a data de nascimento.")
            .Must(d => d < DateOnly.FromDateTime(relogio.GetUtcNow().UtcDateTime))
                .WithMessage("A data de nascimento deve estar no passado.")
            .Must(d => d.Year >= 1900).WithMessage("Informe uma data de nascimento válida.");

        RuleFor(x => x.Email).EmailValido();
        RuleFor(x => x.Senha).SenhaForte();
        RuleFor(x => x.Telefone).TelefoneOpcional();
    }
}
