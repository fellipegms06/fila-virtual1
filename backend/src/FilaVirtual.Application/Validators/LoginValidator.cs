using FilaVirtual.Application.UseCases.Auth;
using FluentValidation;

namespace FilaVirtual.Application.Validators;

public class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("Informe o e-mail.");
        RuleFor(x => x.Senha).NotEmpty().WithMessage("Informe a senha.");
    }
}
