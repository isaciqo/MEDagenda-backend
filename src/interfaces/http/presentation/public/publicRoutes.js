const Joi = require('joi');

const rescheduleSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
});

const reviewSchema = Joi.object({
  patientName: Joi.string().optional().allow('', null),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().required(),
});

module.exports = [
  {
    method: 'post',
    path: '/public/confirm/:appointmentId',
    handler: 'publicController.confirm',
    middlewares: [],
    validation: {},
    swagger: {
      tags: ['Public'],
      summary: 'Confirmar presença na consulta',
      parameters: [{ in: 'path', name: 'appointmentId', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Consulta confirmada' },
        404: { description: 'Consulta não encontrada' },
      },
    },
  },
  {
    method: 'get',
    path: '/public/slots/:token',
    handler: 'publicController.slots',
    middlewares: [],
    validation: {},
    swagger: {
      tags: ['Public'],
      summary: 'Buscar horários disponíveis para reagendamento',
      parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Horários disponíveis' },
        400: { description: 'Link inválido ou expirado' },
      },
    },
  },
  {
    method: 'post',
    path: '/public/reschedule/:token',
    handler: 'publicController.reschedule',
    middlewares: [],
    validation: { body: rescheduleSchema },
    swagger: {
      tags: ['Public'],
      summary: 'Reagendar consulta',
      parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['date', 'time'],
              properties: {
                date: { type: 'string', example: '2025-08-20' },
                time: { type: 'string', example: '10:00' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Reagendado com sucesso' },
        400: { description: 'Link inválido ou expirado' },
      },
    },
  },
  {
    method: 'get',
    path: '/public/review/:linkId',
    handler: 'publicController.reviewInfo',
    middlewares: [],
    validation: {},
    swagger: {
      tags: ['Public'],
      summary: 'Buscar informações da consulta para o formulário de avaliação',
      parameters: [{ in: 'path', name: 'linkId', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Dados da consulta' },
        400: { description: 'Link inválido ou expirado' },
        409: { description: 'Feedback já enviado' },
      },
    },
  },
  {
    method: 'post',
    path: '/public/review/:linkId',
    handler: 'publicController.submitReview',
    middlewares: [],
    validation: { body: reviewSchema },
    swagger: {
      tags: ['Public'],
      summary: 'Enviar avaliação da consulta',
      parameters: [{ in: 'path', name: 'linkId', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['rating', 'comment'],
              properties: {
                patientName: { type: 'string' },
                rating: { type: 'integer', minimum: 1, maximum: 5 },
                comment: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Avaliação enviada' },
        409: { description: 'Feedback já enviado para esta consulta' },
      },
    },
  },
];
