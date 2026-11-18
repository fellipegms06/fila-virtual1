import { fireEvent, screen } from '@testing-library/react-native'
import * as SecureStore from 'expo-secure-store'
import * as apiAuth from '@/api/auth'
import TelaPerfil from '@/app/(tabs)/perfil'
import { erroDaApi, renderizar, usuarioCidadao } from '../utilitarios'

jest.mock('@/api/auth')

describe('Tela de perfil', () => {
  it('mostra os dados da pessoa com CPF formatado', async () => {
    await renderizar(<TelaPerfil />, { logado: true })
    expect(screen.getByText('Maria da Silva')).toBeOnTheScreen()
    expect(screen.getByText('CPF 529.982.247-25')).toBeOnTheScreen()
    expect(screen.getByDisplayValue('(11) 98765-4321')).toBeOnTheScreen()
  })

  it('salva e-mail e telefone sem mexer na senha', async () => {
    jest.mocked(apiAuth.atualizarMeusDados).mockResolvedValue(usuarioCidadao({ email: 'novo@exemplo.com' }))
    await renderizar(<TelaPerfil />, { logado: true })

    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'novo@exemplo.com')
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(apiAuth.atualizarMeusDados).toHaveBeenCalledWith({
      email: 'novo@exemplo.com', telefone: '11987654321', senhaAtual: null, novaSenha: null,
    })
    expect(await screen.findByText('Dados atualizados.')).toBeOnTheScreen()
  })

  it('troca de senha exige a senha atual', async () => {
    await renderizar(<TelaPerfil />, { logado: true })
    await fireEvent(screen.getByLabelText('Quero trocar minha senha'), 'valueChange', true)
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Informe a senha atual.')).toBeOnTheScreen()
    expect(apiAuth.atualizarMeusDados).not.toHaveBeenCalled()
  })

  it('senha atual errada mostra o erro da API', async () => {
    jest.mocked(apiAuth.atualizarMeusDados).mockRejectedValue(erroDaApi(401, { title: 'Senha atual incorreta.' }))
    await renderizar(<TelaPerfil />, { logado: true })
    await fireEvent(screen.getByLabelText('Quero trocar minha senha'), 'valueChange', true)
    await fireEvent.changeText(screen.getByLabelText('Senha atual'), 'errada123')
    await fireEvent.changeText(screen.getByLabelText('Nova senha'), 'nova12345')
    await fireEvent.changeText(screen.getByLabelText('Repita a nova senha'), 'nova12345')
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Senha atual incorreta.')).toBeOnTheScreen()
  })

  it('sair pede confirmação e apaga a sessão', async () => {
    await renderizar(<TelaPerfil />, { logado: true })
    await fireEvent.press(screen.getByRole('button', { name: 'Sair da conta' }))
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByRole('button', { name: 'Sim, sair' }))
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('filavirtual.sessao')
  })
})
