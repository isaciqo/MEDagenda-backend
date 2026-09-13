// Flags de produto lidas do ambiente. Cada uma é uma função (não um valor
// congelado no require) pra que dê pra mudar a env var sem reiniciar em teste.

// Exigir confirmação de e-mail no cadastro manual (e-mail/senha).
//
// DESLIGADA por padrão: a pessoa cria a conta, aceita os termos e já entra no
// app. Isso evita quebrar a experiência de quem acabou de se cadastrar.
//
// Ligue com EMAIL_CONFIRMATION_REQUIRED=true pra voltar a exigir o clique no
// link de confirmação antes do primeiro acesso. Cadastro via Google nunca
// depende disso: o e-mail já vem verificado do Google.
function emailConfirmationRequired() {
  return String(process.env.EMAIL_CONFIRMATION_REQUIRED).toLowerCase() === 'true';
}

// E-mail de cupom de desconto perto do fim do trial (ver TrialDiscountJob).
//
// DESLIGADA por padrão: só faz sentido ligar depois de existir um cupom de
// verdade configurado no checkout — o CliniQ só imprime o texto no e-mail,
// não cria nem valida cupom nenhum sozinho (ver TRIAL_DISCOUNT_CODE).
//
// Ligue com TRIAL_DISCOUNT_EMAIL_ENABLED=true.
function trialDiscountEmailEnabled() {
  return String(process.env.TRIAL_DISCOUNT_EMAIL_ENABLED).toLowerCase() === 'true';
}

module.exports = { emailConfirmationRequired, trialDiscountEmailEnabled };
