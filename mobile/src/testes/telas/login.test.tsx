import { fireEvent, screen } from '@testing-library/react-native'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import * as apiAuth from '@/api/auth'
import TelaLogin from '@/app/login'
import { erroDaApi, renderizar, respostaAuth, usuarioCidadao } from '../utilitarios'

jest.mock('@/api/auth')

async function preencher(email: string, senha: string) {
  await fireEvent.changeText(screen.getByLabelText('E-mail'), email)
  await fireEvent.changeText(screen.getByLabelText('Senha'), senha)
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }))
}

describe('Tela de login', () => {
  it('não mostra aviso de simulação na tela de entrada', async () => {
    await renderizar(<TelaLogin />)
    expect(screen.queryByText(/acadêmico|simulação/i)).toBeNull()
  })

  it('avisa os campos vazios sem chamar a API', async () => {
    await renderizar(<TelaLogin />)
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Informe o e-mail.')).toBeOnTheScreen()
    expect(screen.getByText('Informe a senha.')).toBeOnTheScreen()
    expect(apiAuth.entrar).not.toHaveBeenCalled()
  })

  it('entra e guarda a sessão no armazenamento seguro', async () => {
    jest.mocked(apiAuth.entrar).mockResolvedValue(respostaAuth())
    await renderizar(<TelaLogin />)
    await preencher(' maria@exemplo.com ', 'senha1234')
    expect(apiAuth.entrar).toHaveBeenCalledWith('maria@exemplo.com', 'senha1234')
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('filavirtual.sessao', expect.stringContaining('token-de-teste'))
  })

  it('mostra a mensagem da API quando a senha está errada', async () => {
    jest.mocked(apiAuth.entrar).mockRejectedValue(erroDaApi(401, { title: 'E-mail ou senha incorretos.' }))
    await renderizar(<TelaLogin />)
    await preencher('maria@exemplo.com', 'errada123')
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeOnTheScreen()
  })

  it('recusa conta de atendente: o app é só para cidadãos', async () => {
    jest.mocked(apiAuth.entrar).mockResolvedValue(respostaAuth(usuarioCidadao({ perfil: 'Atendente' })))
    await renderizar(<TelaLogin />)
    await preencher('atendente@exemplo.com', 'senha1234')
    expect(await screen.findByText(/Servidores do CRAS usam o painel web/)).toBeOnTheScreen()
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled()
  })

  it('leva para o cadastro', async () => {
    await renderizar(<TelaLogin />)
    await fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }))
    expect(router.push).toHaveBeenCalledWith('/cadastro')
  })
})
