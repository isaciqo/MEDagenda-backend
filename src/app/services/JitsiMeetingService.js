// Jitsi Meet: sala de vídeo gerada só montando uma URL — sem API key, sem OAuth,
// sem chamada de rede nenhuma no backend (a "chamada" só acontece quando o navegador
// de cada participante abre a página). Ver sprints/FEATURE_GOOGLE_MEET.md para o
// histórico de por que o Google Calendar foi descartado em favor disso.
//
// JITSI_DOMAIN permite trocar pro seu próprio servidor Jitsi self-hosted depois,
// sem mudar nenhum código — só a variável de ambiente.
const JITSI_DOMAIN = process.env.JITSI_DOMAIN || 'meet.jit.si';

// Sala "amigável": cliniq-nome-completo-com-tracos + código de 5 dígitos
// (ex: cliniq-doutor-carlos-viana75842) — mesmo esquema usado no pré-preenchimento do
// frontend, pra ficar consistente independente de onde o link acabou sendo gerado.
// Sem espaço de propósito: com espaço, apps tipo WhatsApp param de reconhecer como
// link clicável no primeiro espaço.
function toDashedSlug(name) {
  return (name || '').trim().split(/\s+/).filter(Boolean).map(w => w.toLowerCase()).join('-');
}

class JitsiMeetingService {
  createMeetingLink(doctorName) {
    const code = Math.floor(10000 + Math.random() * 90000);
    return `https://${JITSI_DOMAIN}/cliniq-${toDashedSlug(doctorName)}${code}`;
  }
}

module.exports = JitsiMeetingService;
