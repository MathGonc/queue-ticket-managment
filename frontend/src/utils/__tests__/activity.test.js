import { describe, it, expect } from 'vitest'
import { activityLabel, describeActivity } from '@/utils/activity.js'

describe('registro de atividades', () => {
  it('rotulos em portugues e tipo desconhecido passa direto', () => {
    expect(activityLabel('senha_chamada')).toBe('Senha chamada')
    expect(activityLabel('tipo_novo')).toBe('tipo_novo')
  })

  it('senha chamada com guiche, preferencia e espera', () => {
    expect(describeActivity({ type: 'senha_chamada', details: { numero: 12, preferencial: 1, guiche: 3, esperaMs: 725000 } }))
      .toBe('Senha 12 (preferencial) no guichê 3 - espera 0h 12m 5s')
  })

  it('senha emitida normal com tipo de atendimento', () => {
    expect(describeActivity({ type: 'senha_emitida', details: { numero: 5, preferencial: 0, tipo: 'INICIAL' } }))
      .toBe('Senha 5 - INICIAL')
  })

  it('rechamada e exclusao', () => {
    expect(describeActivity({ type: 'senha_rechamada', details: { numero: 7, preferencial: 2, guiche: 1 } }))
      .toBe('Senha 7 (80+) no guichê 1')
    expect(describeActivity({ type: 'senha_excluida', details: { numero: 7, status: 1 } })).toBe('Senha 7 (na fila)')
  })

  it('alteracao de usuario e de configuracao', () => {
    expect(describeActivity({ type: 'usuario_alterado', details: { alvo: 'ana.silva', campos: ['role'], senhaAlterada: true } }))
      .toBe('ana.silva: função, senha')
    expect(describeActivity({ type: 'config_monitor_alterada', details: { alteracoes: { showTicketNumber: { de: false, para: true } } } }))
      .toBe('mostrar número: não → sim')
  })

  it('login falhou mostra o login tentado e o motivo', () => {
    expect(describeActivity({ type: 'login_falhou', details: { login: 'joao.x', motivo: 'senha incorreta' } }))
      .toBe('Login "joao.x" - senha incorreta')
  })
})
