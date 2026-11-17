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
  it('tipos novos: painel, guiche, PDF, backup, erro e sinal recusado', () => {
    expect(describeActivity({ type: 'painel_desconectado', details: { ip: '10.0.0.5', minutosConectado: 42 } }))
      .toBe('IP 10.0.0.5 - ficou 42 min conectado')
    expect(describeActivity({ type: 'guiche_alterado', details: { de: 3, para: 7 } })).toBe('Guichê 3 → 7')
    expect(describeActivity({ type: 'guiche_alterado', details: { de: null, para: 7 } })).toBe('Guichê 7')
    expect(describeActivity({ type: 'pdf_historico', details: { registros: 120, busca: 'joao' } }))
      .toBe('120 registro(s), busca "joao"')
    expect(describeActivity({ type: 'backup_concluido', details: { pasta: 'backup-qtm-1', colecoes: { a: 2, b: 3 }, duracaoMs: 1500 } }))
      .toBe('backup-qtm-1 - 5 documento(s) em 1.5s')
    expect(describeActivity({ type: 'erro_servidor', details: { metodo: 'GET', rota: '/x', status: 500 } })).toBe('GET /x (500)')
    expect(describeActivity({ type: 'sinal_recusado', details: { evento: 'signalUpdateMonitor', ip: '1.2.3.4' } }))
      .toBe('signalUpdateMonitor sem login (IP 1.2.3.4)')
    expect(activityLabel('painel_conectado')).toBe('Painel conectado')
  })
})
