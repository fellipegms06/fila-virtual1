using FilaVirtual.Application.UseCases.Unidades;
using FluentValidation;

namespace FilaVirtual.Application.Validators;

public class ListarUnidadesValidator : AbstractValidator<ListarUnidadesRequest>
{
    public ListarUnidadesValidator()
    {
        RuleFor(x => x)
            .Must(x => x.Lat.HasValue == x.Lng.HasValue)
            .WithName("localizacao")
            .WithMessage("Informe latitude e longitude juntas.");

        RuleFor(x => x.Lat).InclusiveBetween(-90, 90).When(x => x.Lat.HasValue).WithMessage("Latitude inválida.");
        RuleFor(x => x.Lng).InclusiveBetween(-180, 180).When(x => x.Lng.HasValue).WithMessage("Longitude inválida.");
    }
}
