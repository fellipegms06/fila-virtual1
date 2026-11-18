using FilaVirtual.Application.UseCases.Fila;
using FluentValidation;

namespace FilaVirtual.Application.Validators;

public class EntrarNaFilaValidator : AbstractValidator<EntrarNaFilaRequest>
{
    public EntrarNaFilaValidator()
    {
        RuleFor(x => x.UnidadeId).NotEmpty().WithMessage("Escolha a unidade CRAS.");
        RuleFor(x => x.ServicoId).NotEmpty().WithMessage("Escolha o serviço.");
    }
}
