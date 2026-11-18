using FilaVirtual.Application.UseCases.Painel;
using FluentValidation;

namespace FilaVirtual.Application.Validators;

public class CheckinValidator : AbstractValidator<CheckinRequest>
{
    public CheckinValidator()
    {
        RuleFor(x => x.Codigo)
            .NotEmpty().WithMessage("Informe o código do agendamento.")
            .Must(c => c.Trim().Length == 8).WithMessage("O código do agendamento tem 8 caracteres.");
    }
}

public class SenhaPresencialValidator : AbstractValidator<SenhaPresencialRequest>
{
    public SenhaPresencialValidator()
    {
        RuleFor(x => x.ServicoId).NotEmpty().WithMessage("Escolha o serviço.");
    }
}

public class ChamarProximoValidator : AbstractValidator<ChamarProximoRequest>
{
    public ChamarProximoValidator()
    {
        RuleFor(x => x.Guiche)
            .NotEmpty().WithMessage("Informe o guichê.")
            .MaximumLength(50).WithMessage("O nome do guichê deve ter no máximo 50 caracteres.");
    }
}
