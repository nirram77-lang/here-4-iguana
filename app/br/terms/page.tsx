'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function TermsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromApp = searchParams.get('from') === 'app'

  const handleBack = () => {
    if (fromApp) {
      router.push('/app')
    } else {
      router.push('/br')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      {/* Header */}
      <nav 
        className="bg-[#0a1f1a]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href={fromApp ? "/app" : "/br"} className="flex items-center gap-3">
              <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                I4IGUANA
              </span>
            </Link>
            <button 
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 min-h-[44px] px-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {fromApp ? 'Voltar ao App' : 'Voltar'}
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-gray-400 mb-12">Última atualização: Janeiro 2025</p>

        <div className="prose prose-invert prose-green max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-300 leading-relaxed">
              Ao acessar ou usar o I4IGUANA ("o App"), você concorda em estar vinculado a estes Termos de Uso. 
              Se você não concordar com estes termos, por favor não use o App. Reservamo-nos o direito de modificar 
              estes termos a qualquer momento, e seu uso continuado do App constitui aceitação de quaisquer mudanças.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">2. Elegibilidade</h2>
            <p className="text-gray-300 leading-relaxed">
              Você deve ter pelo menos 18 anos para usar o I4IGUANA. Ao usar o App, você declara e garante 
              que tem pelo menos 18 anos de idade e capacidade legal para celebrar este acordo. 
              Reservamo-nos o direito de solicitar comprovação de idade a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">3. Registro de Conta</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Para usar certos recursos do App, você deve registrar uma conta. Você concorda em:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Fornecer informações precisas, atuais e completas</li>
              <li>Manter e atualizar suas informações para mantê-las precisas</li>
              <li>Manter a segurança das credenciais da sua conta</li>
              <li>Aceitar responsabilidade por todas as atividades em sua conta</li>
              <li>Nos notificar imediatamente sobre qualquer uso não autorizado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">4. Conduta do Usuário</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Você concorda em NÃO:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Usar o App para qualquer propósito ilegal ou em violação de quaisquer leis</li>
              <li>Assediar, abusar ou prejudicar outros usuários</li>
              <li>Publicar conteúdo falso, enganoso ou fraudulento</li>
              <li>Enviar conteúdo inapropriado, ofensivo ou explícito</li>
              <li>Se passar por qualquer pessoa ou entidade</li>
              <li>Usar sistemas automatizados ou bots para acessar o App</li>
              <li>Tentar obter acesso não autorizado aos nossos sistemas</li>
              <li>Interferir no funcionamento adequado do App</li>
              <li>Solicitar informações pessoais de menores</li>
              <li>Usar o App para fins comerciais sem autorização</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">5. Diretrizes de Segurança</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Sua segurança é importante para nós. Recomendamos fortemente:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Encontrar-se apenas em lugares públicos</li>
              <li>Informar amigos ou familiares sobre seus planos</li>
              <li>Nunca compartilhar informações financeiras com outros usuários</li>
              <li>Relatar comportamento suspeito imediatamente</li>
              <li>Confiar em seus instintos - se algo parecer errado, vá embora</li>
            </ul>
            <p className="text-gray-400 mt-4 text-sm">
              I4IGUANA não é responsável pela conduta de qualquer usuário, seja online ou offline.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-red-400 mb-4">6. ⚠️ Assunção de Risco & Responsabilidade do Usuário</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">AO USAR O I4IGUANA, VOCÊ RECONHECE E CONCORDA QUE:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-3 ml-4">
              <li><strong className="text-white">Riscos Inerentes:</strong> Conhecer pessoas com quem você se conectou online envolve riscos inerentes. Você assume total responsabilidade por suas interações com outros usuários, tanto online quanto offline.</li>
              <li><strong className="text-white">Sem Verificação de Antecedentes:</strong> NÃO realizamos verificação de antecedentes criminais, verificação de identidade ou triagem de usuários. Usuários podem se apresentar falsamente.</li>
              <li><strong className="text-white">Riscos Baseados em Localização:</strong> O App usa sua localização para conectá-lo com usuários próximos. Você entende que compartilhar sua proximidade traz riscos, incluindo potencial perseguição, assédio ou contato indesejado.</li>
              <li><strong className="text-white">Conduta do Usuário:</strong> Não temos controle sobre e não somos responsáveis pelas ações, comportamento ou conduta de qualquer usuário, seja online ou pessoalmente.</li>
              <li><strong className="text-white">Encontrar Estranhos:</strong> Quaisquer encontros presenciais com outros usuários são por sua conta e risco. Recomendamos fortemente encontrar-se apenas em locais públicos e informar alguém de sua confiança sobre seus planos.</li>
              <li><strong className="text-white">Sem Garantias:</strong> Não fazemos garantias sobre a identidade, caráter, intenções ou comportamento de qualquer usuário.</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
              <p className="text-red-300 text-sm">
                <strong>⚠️ AVISO:</strong> Você é o único responsável por sua segurança ao usar o App e conhecer outros usuários. 
                I4IGUANA não aceita responsabilidade por qualquer dano, lesão, assédio, perseguição, falsificação de identidade 
                ou qualquer outra experiência negativa resultante de seu uso do App ou interações com outros usuários.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">7. Conduta Proibida & Política Anti-Assédio</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Os seguintes comportamentos são estritamente proibidos e podem resultar em encerramento imediato da conta e denúncia às autoridades:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Assédio, perseguição ou ameaças a qualquer usuário</li>
              <li>Envio de conteúdo sexualmente explícito não solicitado</li>
              <li>Tentativa de encontrar usuários que expressaram desinteresse</li>
              <li>Comportamento agressivo, abusivo ou intimidador</li>
              <li>Violência ou ameaças de violência</li>
              <li>Qualquer forma de discriminação</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">8. Propriedade Intelectual</h2>
            <p className="text-gray-300 leading-relaxed">
              Todo conteúdo, recursos e funcionalidades do App são de propriedade do I4IGUANA e protegidos 
              por leis internacionais de direitos autorais, marcas registradas e outras leis de propriedade intelectual. Você não pode 
              reproduzir, distribuir, modificar ou criar obras derivadas sem nossa permissão expressa por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">9. Conteúdo do Usuário</h2>
            <p className="text-gray-300 leading-relaxed">
              Você mantém a propriedade do conteúdo que envia para o App. No entanto, ao enviar conteúdo, você 
              concede ao I4IGUANA uma licença não exclusiva, mundial e livre de royalties para usar, exibir e 
              distribuir seu conteúdo em conexão com o App. Você é o único responsável por seu 
              conteúdo e deve garantir que ele não viole nenhuma lei ou direitos de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">10. Notificações de Estabelecimentos</h2>
            <div className="bg-[#1a4d3e]/30 border border-green-500/30 rounded-xl p-4">
              <p className="text-gray-300 leading-relaxed mb-4">
                Ao fazer check-in em um estabelecimento (bar, clube ou local parceiro), você concorda em receber notificações da administração do local:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Donos de estabelecimentos podem enviar anúncios coletivos para todos os usuários com check-in</li>
                <li>Donos de estabelecimentos não podem acessar suas informações pessoais - eles veem apenas números agregados</li>
                <li>As notificações cessam quando você faz check-out ou seu check-in expira (8 horas)</li>
                <li>Você pode desativar notificações de estabelecimentos nas configurações do seu dispositivo</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">11. Assinaturas e Pagamentos</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Alguns recursos requerem assinatura paga. Ao assinar, você concorda com:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Pagar todas as taxas associadas à sua assinatura</li>
              <li>Renovação automática a menos que cancelada antes da data de renovação</li>
              <li>Sem reembolsos por períodos parciais de assinatura</li>
              <li>Mudanças de preço com aviso prévio razoável</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">12. Rescisão</h2>
            <p className="text-gray-300 leading-relaxed">
              Reservamo-nos o direito de suspender ou encerrar sua conta a qualquer momento, por qualquer motivo, 
              incluindo violação destes Termos. Você também pode excluir sua conta a qualquer momento através das 
              configurações do App. Após o encerramento, seu direito de usar o App cessará imediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">13. Isenção de Garantias</h2>
            <p className="text-gray-300 leading-relaxed">
              O APP É FORNECIDO "COMO ESTÁ" SEM GARANTIAS DE QUALQUER TIPO, EXPRESSAS OU IMPLÍCITAS. NÃO 
              GARANTIMOS QUE O APP SERÁ ININTERRUPTO, LIVRE DE ERROS OU COMPLETAMENTE SEGURO. NÃO SOMOS 
              RESPONSÁVEIS PELAS AÇÕES, CONTEÚDO OU DADOS DE TERCEIROS OU OUTROS USUÁRIOS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">14. Limitação de Responsabilidade</h2>
            <p className="text-gray-300 leading-relaxed">
              NA EXTENSÃO MÁXIMA PERMITIDA POR LEI, I4IGUANA NÃO SERÁ RESPONSÁVEL POR QUAISQUER DANOS INDIRETOS, 
              INCIDENTAIS, ESPECIAIS, CONSEQUENCIAIS OU PUNITIVOS DECORRENTES DO SEU USO DO APP, 
              INCLUINDO, MAS NÃO LIMITADO A, LESÕES PESSOAIS, SOFRIMENTO EMOCIONAL OU PERDA DE DADOS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">15. Lei Aplicável</h2>
            <p className="text-gray-300 leading-relaxed">
              Estes Termos serão regidos e interpretados de acordo com as leis do Estado de 
              Israel, independentemente de suas disposições sobre conflito de leis. Quaisquer disputas decorrentes destes 
              Termos serão resolvidas nos tribunais de Tel Aviv, Israel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">16. Entre em Contato</h2>
            <p className="text-gray-300 leading-relaxed">
              Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco:
            </p>
            <p className="text-green-400 font-semibold mt-2">
              <a href="mailto:nir@i4iguana.com" className="hover:underline">nir@i4iguana.com</a>
            </p>
          </section>

        </div>

        {/* Back Button */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <button 
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors min-h-[44px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {fromApp ? 'Voltar ao App' : 'Voltar'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-[#0d2920]/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-8 h-8" />
              <span className="text-lg font-bold text-white">I4IGUANA</span>
            </div>
            
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} I4IGUANA. Todos os direitos reservados.
            </p>
            
            <div className="pt-4 border-t border-white/10">
              <p className="text-gray-500 text-sm">
                Todos os direitos autorais reservados a <span className="text-green-400 font-semibold">Nir Ram</span>
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Fundador & Criador do I4IGUANA
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function TermsOfService() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1f1a]" />}>
      <TermsContent />
    </Suspense>
  )
}
