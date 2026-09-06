// Config de recebimento via Pix do médico (chave + dados do recebedor). É só o
// que o frontend precisa pra montar o "Pix copia e cola" (BR Code). Não há
// gateway, webhook nem conciliação. A chave Pix não é segredo (vai em mensagem
// pro paciente), então não tem tratamento especial de sigilo aqui.
const EMPTY_PIX_CONFIG = { key: '', keyType: '', receiverName: '', receiverCity: '' };

// Única fonte de verdade pra devolver a config Pix num shape estável, mesmo
// pra contas que nunca salvaram o campo (o default do schema já cobre isso,
// mas normaliza aqui também pra não depender só do Mongoose).
function resolvePixConfig(user) {
  const pix = user?.pix || {};
  return {
    key: pix.key || '',
    keyType: pix.keyType || '',
    receiverName: pix.receiverName || '',
    receiverCity: pix.receiverCity || '',
  };
}

module.exports = { EMPTY_PIX_CONFIG, resolvePixConfig };
