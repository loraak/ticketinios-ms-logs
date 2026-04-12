import Fastify from 'fastify'
import cors from '@fastify/cors'
import { logsRoutes } from './routes/logs.routes.js'

const GATEWAY_KEY = process.env.GATEWAY_KEY ?? ''

export async function buildApp() {
    const app = Fastify({ logger: true })

    await app.register(cors, { origin: false })  

    // Valida que venga del gateway
    app.addHook('onRequest', async (request, reply) => {
        const key = request.headers['x-gateway-key']
        if (key !== GATEWAY_KEY) {
            return reply.code(403).send({ error: 'Acceso no autorizado' })
        }
    })

    await app.register(logsRoutes, { prefix: '/logs' })

    app.get('/health', async () => ({ status: 'ok', service: 'logs' }))

    return app
}