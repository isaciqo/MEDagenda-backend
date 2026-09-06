// Paleta curada pra cor de Local — só usada visualmente no contexto de plantão
// (ver Location.color, Shift.locationColor). Ids precisam bater com o arquivo
// espelho no frontend, src/lib/plantaoColors.ts, que tem as classes visuais
// reais pra cada um. Aqui só serve pra validar o que chega no Joi.
const PLANTAO_COLOR_IDS = ['blue', 'purple', 'rose', 'amber', 'emerald', 'cyan', 'orange', 'slate'];

module.exports = { PLANTAO_COLOR_IDS };
