const { v4: uuidv4 } = require('uuid');

// Resolve/cria o paciente ao criar uma consulta. Só reaproveita um cadastro já
// existente quando o médico seleciona explicitamente (patientId) ou quando o
// nome digitado bate exatamente com um cadastro já existente (A12, case-
// insensitive) — nunca por telefone sozinho: telefone repetido não implica ser
// a mesma pessoa (número reciclado, celular de família), e usar isso pra
// decidir sobrescrevia sem avisar o nome que o médico acabou de digitar.
// `forceNewPatient` pula direto pra criação — usado quando o médico já
// escolheu explicitamente "criar um cliente separado" depois de editar os
// dados de um cliente selecionado (ver popup de divergência em Agenda.tsx).
async function resolvePatientForAppointment(patientRepository, { doctor_id, patientId, patientName, patientPhone, forceNewPatient = false }) {
  if (!forceNewPatient) {
    if (patientId) {
      const found = await patientRepository.findById(patientId);
      if (found) return found;
    }

    const byName = await patientRepository.findByExactName(doctor_id, patientName);
    if (byName) return byName;
  }

  const sameNameCount = await patientRepository.countByName(doctor_id, patientName);
  const displayName = sameNameCount === 0 ? patientName : `${patientName} (paciente ${sameNameCount + 1})`;

  return patientRepository.create({
    patient_id: uuidv4(),
    doctor_id,
    name: patientName,
    phone: patientPhone || '',
    displayName,
  });
}

module.exports = { resolvePatientForAppointment };
