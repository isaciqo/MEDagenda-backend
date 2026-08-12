class LeadController {
  constructor({ sendClinicLeadOperation }) {
    this.sendClinicLeadOperation = sendClinicLeadOperation;
  }

  async clinic(req, res) {
    const { name, email, clinicName, professionalsCount, message } = req.body;
    const result = await this.sendClinicLeadOperation.execute({
      name,
      email,
      clinicName,
      professionalsCount,
      message,
    });
    res.status(201).json(result);
  }
}

module.exports = LeadController;
