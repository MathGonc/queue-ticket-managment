const fs = require('fs')
const path = require('path')
const express = require('express')
const router = express.Router()
const GlobalModel = require('../models/global')
const config = require('../config/index.js')
const { authMiddleware, requireRole } = require('../middleware/auth')
const { logActivity } = require('../activity')
const logger = require('../config/logger')

const ROLE_ADMIN = 3
const MAX_LOGO_BYTES = 2 * 1024 * 1024

// Formatos aceitos, conferidos pelo conteudo do arquivo (nao pela extensao).
// SVG fica de fora: pode conter script.
const FORMATS = [
  { ext: 'png', mime: 'image/png', test: (b) => b.length > 8 && b.readUInt32BE(0) === 0x89504e47 },
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
]

function currentLogo() {
  for (const format of FORMATS) {
    const file = path.join(config.dataDir, `logo.${format.ext}`)
    if (fs.existsSync(file)) return { file, format, mtime: fs.statSync(file).mtimeMs }
  }
  return null
}

function removeLogos() {
  for (const format of FORMATS) fs.rmSync(path.join(config.dataDir, `logo.${format.ext}`), { force: true })
}

function notifyClients(req) {
  req.app.get('io')?.emit('receiveUpdateBranding')
}

// GET /api/branding (publico): nome da empresa e se ha logo (versao p/ cache)
router.get('/api/branding', async (req, res) => {
  try {
    const global = await GlobalModel.findOne().select('companyName').lean()
    const logo = currentLogo()
    res.json({
      companyName: global?.companyName || '',
      logo: logo ? { version: Math.round(logo.mtime) } : null,
    })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/branding/logo (publico): a imagem do logo
router.get('/api/branding/logo', (req, res) => {
  const logo = currentLogo()
  if (!logo) return res.status(404).json({ error: 'Nenhum logo importado' })
  res.set('Cache-Control', 'no-cache')
  res.set('X-Content-Type-Options', 'nosniff')
  res.type(logo.format.mime)
  fs.createReadStream(logo.file).pipe(res)
})

// PUT /api/branding/logo (admin): corpo = a imagem crua (PNG, JPG ou WebP, ate 2 MB)
router.put('/api/branding/logo', authMiddleware, requireRole(ROLE_ADMIN),
  express.raw({ type: () => true, limit: MAX_LOGO_BYTES }),
  (req, res) => {
    try {
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0)
      const format = FORMATS.find((f) => f.test(body))
      if (!format) return res.status(400).json({ error: 'Envie uma imagem PNG, JPG ou WebP' })
      fs.mkdirSync(config.dataDir, { recursive: true })
      removeLogos()
      fs.writeFileSync(path.join(config.dataDir, `logo.${format.ext}`), body)
      logActivity(req, 'logo_alterado', { formato: format.ext, kb: Math.ceil(body.length / 1024) })
      notifyClients(req)
      res.json({ logo: { version: Math.round(currentLogo().mtime) } })
    } catch (error) {
      logger.error(error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }
)

// DELETE /api/branding/logo (admin)
router.delete('/api/branding/logo', authMiddleware, requireRole(ROLE_ADMIN), (req, res) => {
  try {
    if (!currentLogo()) return res.status(404).json({ error: 'Nenhum logo importado' })
    removeLogos()
    logActivity(req, 'logo_removido')
    notifyClients(req)
    res.json({})
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/branding/company (admin): { companyName }
router.put('/api/branding/company', authMiddleware, requireRole(ROLE_ADMIN), async (req, res) => {
  try {
    const companyName = String(req.body.companyName ?? '').trim()
    if (companyName.length > 120) return res.status(400).json({ error: 'Nome da empresa com no máximo 120 caracteres' })
    const before = await GlobalModel.findOne().select('companyName').lean()
    await GlobalModel.findOneAndUpdate({}, { $set: { companyName } })
    if ((before?.companyName || '') !== companyName) {
      logActivity(req, 'empresa_alterada', { de: before?.companyName || '', para: companyName })
      notifyClients(req)
    }
    res.json({ companyName })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Erro do limite de tamanho do express.raw -> mensagem clara
router.use('/api/branding/logo', (err, req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Imagem maior que 2 MB' })
  next(err)
})

module.exports = router
