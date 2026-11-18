import { textoCidadao } from './servicos'

describe('textoCidadao', () => {
  it.each([
    ['Inscrição no CadÚnico', 'Quero me cadastrar pela primeira vez'],
    ['Atualização cadastral', 'Preciso atualizar meus dados'],
    ['Revisão cadastral', 'Fui convocado(a) para revisar o cadastro'],
    ['Atualização de endereço', 'Mudei de endereço'],
    ['Inclusão de membro da família', 'Quero incluir alguém da família'],
  ])('%s -> %s', (oficial, cidadao) => {
    expect(textoCidadao(oficial)).toBe(cidadao)
  })

  it('serviço sem tradução aparece com o nome oficial', () => {
    expect(textoCidadao('BPC')).toBe('BPC')
  })
})
