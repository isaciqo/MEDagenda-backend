/**
 * Setup único (manual, feito uma vez pelo admin) da conta Google dedicada
 * que vai criar as reuniões do Google Meet — ver sprints/FEATURE_GOOGLE_MEET.md.
 *
 * Uso:
 *   1. Preencha GOOGLE_CALENDAR_CLIENT_ID e GOOGLE_CALENDAR_CLIENT_SECRET no .env
 *      (Cloud Console → Credenciais → criar OAuth Client "Aplicativo da Web",
 *       com http://localhost:3939/oauth2callback nas "URIs de redirecionamento autorizados").
 *   2. Rode: node scripts/setup-google-calendar.js
 *   3. Abra a URL impressa no terminal, logue com a conta dedicada (ex: agenda.cliniqbrasil@gmail.com)
 *      e aprove o acesso ao Calendar.
 *   4. O script imprime o GOOGLE_CALENDAR_REFRESH_TOKEN — copie pro .env e reinicie o servidor.
 */
require('dotenv').config();
const http = require('http');
const { OAuth2Client } = require('google-auth-library');

const PORT = 3939;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('\n❌ Faltam GOOGLE_CALENDAR_CLIENT_ID e/ou GOOGLE_CALENDAR_CLIENT_SECRET no .env.');
  console.error('   Crie o OAuth Client no Cloud Console antes de rodar este script (ver instruções no topo do arquivo).\n');
  process.exit(1);
}

const client = new OAuth2Client(clientId, clientSecret, REDIRECT_URI);

const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // força devolver refresh_token mesmo se já autorizou antes
  scope: [SCOPE],
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Erro na autorização</h1><p>${error}</p>`);
    console.error(`\n❌ Autorização negada/erro: ${error}\n`);
    server.close();
    process.exit(1);
  }

  try {
    const { tokens } = await client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>✅ Autorizado!</h1><p>Pode fechar esta aba e voltar pro terminal.</p>');

    console.log('\n✅ Autorização concluída. Copie a linha abaixo pro seu .env:\n');
    console.log(`GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}\n`);

    if (!tokens.refresh_token) {
      console.warn(
        '⚠️  Nenhum refresh_token foi retornado — normalmente acontece se essa conta já autorizou' +
        ' esse app antes. Revogue o acesso em myaccount.google.com/permissions e rode o script de novo.\n'
      );
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Erro ao trocar o código por tokens</h1>');
    console.error('\n❌ Erro ao trocar código por tokens:', err.message, '\n');
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log('\n🔗 Abra esta URL no navegador, logado com a conta Google DEDICADA (não a pessoal/oficial):\n');
  console.log(authUrl);
  console.log(`\nAguardando callback em ${REDIRECT_URI} ...\n`);
});
