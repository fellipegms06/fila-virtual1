using FilaVirtual.API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FilaVirtual.API.Realtime;

[Authorize]
public class FilaHub : Hub
{
    public static string GrupoUsuario(Guid id) => $"usuario-{id}";
    public static string GrupoUnidade(Guid id) => $"unidade-{id}";

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GrupoUsuario(Context.User!.ObterUsuarioId()));

        if (Context.User!.ObterUnidadeId() is { } unidadeId)
            await Groups.AddToGroupAsync(Context.ConnectionId, GrupoUnidade(unidadeId));

        await base.OnConnectedAsync();
    }

    public Task EntrarNaUnidade(Guid unidadeId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, GrupoUnidade(unidadeId));

    public Task SairDaUnidade(Guid unidadeId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, GrupoUnidade(unidadeId));
}
