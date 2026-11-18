import { fireEvent, screen } from '@testing-library/react-native'
import * as apiAuth from '@/api/auth'
import TelaCadastro from '@/app/cadastro'
import { erroDaApi, renderizar, respostaAuth } from '../utilitarios'

jest.mock('@/api/auth')

async function preencherTudo() {
  const campo = (rotulo: string, valor: string) => fireEvent.changeText(screen.getByLabelText(rotulo), valor)
  await campo('Nome completo *', 'Maria da Silva')
  await campo('CPF *', '52998224725')
  await campo('Data de nascimento *', '25121950')
  await campo('E-mail *', 'maria@exemplo.com')
  await campo('Celular (opcional)', '11987654321')
  await campo('Senha *', 'senha1234')
  await campo('Repita a senha *', 'senha1234')
}

describe('Tela de cadastro', () => {
  it('aplica as máscaras enquanto a pessoa digita', async () => {
    await renderizar(<TelaCadastro />)
    await preencherTudo()
    expect(screen.getByDisplayValue('529.982.247-25')).toBeOnTheScreen()
    expect(screen.getByDisplayValue('25/12/1950')).toBeOnTheScreen()
    expect(screen.getByDisplayValue('(11) 98765-4321')).toBeOnTheScreen()
  })

  it('envia CPF e telefone só com dígitos e a data no formato da API', async () => {
    jest.mocked(apiAuth.cadastrar).mockResolvedValue(respostaAuth())
    await renderizar(<TelaCadastro />)
    await preencherTudo()
    await fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }))

    expect(apiAuth.cadastrar).toHaveBeenCalledWith({
      nomeCompleto: 'Maria da Silva',
      cpf: '52998224725',
      dataNascimento: '1950-12-25',
      email: 'maria@exemplo.com',
      senha: 'senha1234',
      telefone: '11987654321',
    })
  })

  it('CPF inválido é avisado antes de enviar', async () => {
    await renderizar(<TelaCadastro />)
    await preencherTudo()
    await fireEvent.changeText(screen.getByLabelText('CPF *'), '52998224726')
    await fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('CPF inválido.')).toBeOnTheScreen()
    expect(apiAuth.cadastrar).not.toHaveBeenCalled()
  })

  it('CPF já cadastrado (409) mostra a mensagem da API', async () => {
    jest.mocked(apiAuth.cadastrar).mockRejectedValue(erroDaApi(409, { title: 'Já existe uma conta com este CPF.' }))
    await renderizar(<TelaCadastro />)
    await preencherTudo()
    await fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Já existe uma conta com este CPF.')).toBeOnTheScreen()
  })
})
