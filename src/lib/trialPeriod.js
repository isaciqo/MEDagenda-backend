// Duração do trial no cadastro. Quem chega por um link de indicação válido
// ganha mais tempo, como incentivo pra usar o link em vez de se cadastrar
// direto. Isso é independente da recompensa do indicador (10 indicações
// confirmadas = +30 dias, ver ProcessReferralOperation). Uma coisa é o
// trial de quem chegou pelo link, outra é o bônus de quem indicou.
const TRIAL_DEFAULT_DAYS = 15;
const TRIAL_REFERRED_DAYS = 30;

function computeTrialExpiresAt(hasValidReferral) {
  const days = hasValidReferral ? TRIAL_REFERRED_DAYS : TRIAL_DEFAULT_DAYS;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}

module.exports = { TRIAL_DEFAULT_DAYS, TRIAL_REFERRED_DAYS, computeTrialExpiresAt };
