import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'

export async function logsRoutes(app: FastifyInstance) {

    app.post('/request', async (request, reply) => {
        const { endpoint, method, usuarioId, ip, statusCode, duracionMs } = request.body as any

        await prisma.logsRequests.create({
            data: { endpoint, method, usuarioId, ip, statusCode, duracionMs }
        })

        // Actualiza métricas
        const metrica = await prisma.metricasEndpoints.findUnique({
            where: { endpoint_method: { endpoint, method } }
        })

        if (metrica) {
            const nuevoTotal = metrica.totalRequests + 1
            const nuevoPromedio = metrica.tiempoPromedioMs + (duracionMs - metrica.tiempoPromedioMs) / nuevoTotal
            await prisma.metricasEndpoints.update({
                where: { endpoint_method: { endpoint, method } },
                data: {
                    totalRequests: nuevoTotal,
                    tiempoPromedioMs: nuevoPromedio,
                    actualizadoEn: new Date()
                }
            })
        } else {
            await prisma.metricasEndpoints.create({
                data: { endpoint, method, totalRequests: 1, tiempoPromedioMs: duracionMs }
            })
        }

        return reply.code(201).send({ ok: true })
    })

    app.post('/error', async (request, reply) => {
        const { endpoint, method, usuarioId, ip, statusCode, mensaje, stackTrace } = request.body as any

        await prisma.logsErrores.create({
            data: { endpoint, method, usuarioId, ip, statusCode, mensaje, stackTrace }
        })

        return reply.code(201).send({ ok: true })
    })

    app.get('/requests', async (request, reply) => {
        const logs = await prisma.logsRequests.findMany({
            orderBy: { creadoEn: 'desc' },
            take: 100
        })
        return reply.send({ statusCode: 200, data: logs })
    })

    app.get('/errores', async (request, reply) => {
        const errores = await prisma.logsErrores.findMany({
            orderBy: { creadoEn: 'desc' },
            take: 100
        })
        return reply.send({ statusCode: 200, data: errores })
    })

    app.get('/metricas', async (request, reply) => {
        const metricas = await prisma.metricasEndpoints.findMany({
            orderBy: { totalRequests: 'desc' }
        })
        return reply.send({ statusCode: 200, data: metricas })
    })
}