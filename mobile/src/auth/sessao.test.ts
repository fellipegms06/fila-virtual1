import * as SecureStore from 'expo-secure-store'
import { respostaAuth } from '@/testes/utilitarios'
import { carregarSessao, salvarSessao, sessaoDaResposta } from './sessao'

describe('sessão salva no armazenamento seguro', () => {
  it('guarda e recupera a sessão', async () => {
    const sessao = sessaoDaResposta(respostaAuth())
    await salvarSessao(sessao)
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('filavirtual.sessao', expect.any(String))
    expect(await carregarSessao()).toEqual(sessao)
  })

  it('sessão vencida conta como não logado e é apagada', async () => {
    const sessao = sessaoDaResposta(respostaAuth())
    await salvarSessao(sessao)
    expect(await carregarSessao(sessao.expiraEm + 1)).toBeNull()
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('filavirtual.sessao')
  })

  it('conteúdo corrompido não derruba o app', async () => {
    await SecureStore.setItemAsync('filavirtual.sessao', '{isso não é json')
    expect(await carregarSessao()).toBeNull()
  })
})
