import { fireEvent, render, screen } from '@testing-library/react-native'
import { AbasPassos } from '@/components/AbasPassos'
import { Card } from '@/components/Card'
import { CabecalhoMarinho } from '@/components/CabecalhoMarinho'
import { Opcao } from '@/components/Opcao'
import { Texto } from '@/components/Texto'
import { cores } from '@/theme/tokens'
import { AreaSegura } from './utilitarios'

describe('CabecalhoMarinho', () => {
  it('mostra logo, título e subtítulo', async () => {
    await render(
      <AreaSegura>
        <CabecalhoMarinho logo titulo="Acompanhar Fila" subtitulo="CRAS Sul — 10/11/2026" />
      </AreaSegura>,
    )

    expect(screen.getByLabelText('Fila Virtual')).toBeTruthy()
    // Cores do logo como no protótipo: "Fila" amarelo, "Virtual" verde.
    expect(screen.getByText('Fila')).toHaveStyle({ color: cores.alerta })
    expect(screen.getByText('Virtual')).toHaveStyle({ color: cores.verdeLogo })
    expect(screen.getByRole('header', { name: 'Acompanhar Fila' })).toBeTruthy()
    expect(screen.getByText('CRAS Sul — 10/11/2026')).toBeTruthy()
  })
})

describe('AbasPassos', () => {
  const passos = ['Unidade', 'Serviço', 'Data e Hora', 'Confirmar']

  it('anuncia o passo atual e marca os concluídos com ✓', async () => {
    await render(<AbasPassos passos={passos} atual={2} />)

    expect(screen.getByLabelText('Passo 3 de 4: Data e Hora')).toBeTruthy()
    expect(screen.getByText('✓ Unidade')).toBeTruthy()
    expect(screen.getByText('✓ Serviço')).toBeTruthy()
    expect(screen.getByText('Confirmar')).toBeTruthy()
  })
})

describe('Opcao', () => {
  it('anuncia a opção selecionada e chama o toque', async () => {
    const aoTocar = jest.fn()
    await render(<Opcao variante="chip" titulo="09:30" selecionada onPress={aoTocar} />)

    const botao = screen.getByRole('button', { name: '09:30', selected: true })
    fireEvent.press(botao)
    expect(aoTocar).toHaveBeenCalledTimes(1)
  })

  it('linha não selecionada não fica marcada', async () => {
    await render(<Opcao titulo="Preciso atualizar meus dados" detalhe="Atualização cadastral" onPress={() => {}} />)

    expect(screen.getByRole('button', { name: 'Preciso atualizar meus dados, Atualização cadastral', selected: false })).toBeTruthy()
  })
})

describe('Card', () => {
  it('cartão tocável vira botão com a descrição acessível', async () => {
    const aoTocar = jest.fn()
    await render(
      <Card variante="sucesso" onPress={aoTocar} descricaoAcessivel="Agendamento confirmado">
        <Texto>Agendamento confirmado</Texto>
      </Card>,
    )

    fireEvent.press(screen.getByRole('button', { name: 'Agendamento confirmado' }))
    expect(aoTocar).toHaveBeenCalled()
  })
})
