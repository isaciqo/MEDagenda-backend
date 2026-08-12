const { v4: uuidv4 } = require('uuid');
const ClinicLead = require('../../../database/models/ClinicLead');
const logger = require('../../../lib/logger');

class SendClinicLeadOperation {
  constructor({ emailService }) {
    this.emailService = emailService;
  }

  async execute({ name, email, clinicName, professionalsCount, message }) {
    const leadId = `LEAD-${uuidv4().split('-')[0].toUpperCase()}`;

    await ClinicLead.create({
      leadId,
      name,
      email,
      clinicName: clinicName || '',
      professionalsCount: professionalsCount || '',
      message,
    });

    await this.emailService.sendClinicLeadEmail({
      leadId,
      name,
      email,
      clinicName,
      professionalsCount,
      message,
    });

    logger.info('lead.clinic: novo contato de clínica registrado', { leadId });

    return { ok: true, leadId };
  }
}

module.exports = SendClinicLeadOperation;
