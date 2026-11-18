using FilaVirtual.Application.UseCases.Auth;
using FluentValidation;

namespace FilaVirtual.Application.Validators;

public class AtualizarDadosCadastraisValidator : AbstractValidator<AtualizarDadosCadastraisRequest>
{
    public AtualizarDadosCadastraisValidator()
    {
        RuleFor(x => x.Email).EmailValido();
        RuleFor(x => x.Telefone).TelefoneOpcional();

        When(x => !string.IsNullOrEmpty(x.NovaSenha), () =>
        {
            RuleFor(x => x.NovaSenha).SenhaForte();
            RuleFor(x => x.SenhaAtual).NotEmpty().WithMessage("Informe a senha atual para trocar a senha.");
        });
    }
}
