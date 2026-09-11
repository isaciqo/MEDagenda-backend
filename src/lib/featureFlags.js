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

module.exports = { emailConfirmationRequired };
