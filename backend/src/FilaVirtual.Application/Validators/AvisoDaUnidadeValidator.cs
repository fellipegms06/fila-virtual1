using FilaVirtual.Application.UseCases.Notificacoes;
using FluentValidation;

namespace FilaVirtual.Application.Validators;

public class AvisoDaUnidadeValidator : AbstractValidator<AvisoDaUnidadeRequest>
{
    public AvisoDaUnidadeValidator()
    {
        RuleFor(x => x.Mensagem)
            .NotEmpty().WithMessage("Escreva a mensagem do aviso.")
            .MaximumLength(500).WithMessage("O aviso deve ter no máximo 500 caracteres.");
    }
}
