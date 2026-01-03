'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function PrivacyContent() {
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
        <h1 className="text-4xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-gray-400 mb-12">Última atualização: Janeiro 2025</p>

        <div className="prose prose-invert prose-green max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">1. Introdução</h2>
            <p className="text-gray-300 leading-relaxed">
              I4IGUANA ("nós", "nosso" ou "nos") está comprometido em proteger sua privacidade. Esta Política de Privacidade 
              explica como coletamos, usamos, divulgamos e protegemos suas informações quando você usa nosso 
              aplicativo móvel e website (coletivamente, o "App").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">2. Informações que Coletamos</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Informações Pessoais</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Nome e nome de exibição</li>
              <li>Endereço de email</li>
              <li>Número de telefone (para verificação)</li>
              <li>Data de nascimento</li>
              <li>Gênero e preferências de gênero</li>
              <li>Fotos de perfil</li>
              <li>Bio e descrição pessoal</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Dados de Localização</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Coordenadas GPS (durante uso do App)</li>
              <li>Locais de check-in em estabelecimentos</li>
              <li>Proximidade com outros usuários</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Dados de Uso</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Padrões e preferências de uso do app</li>
              <li>Informações do dispositivo (tipo, sistema operacional)</li>
              <li>Endereço IP</li>
              <li>Dados de interação (matches, mensagens)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">3. Como Usamos Suas Informações</h2>
            <p className="text-gray-300 leading-relaxed mb-4">Usamos suas informações para:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Fornecer e manter a funcionalidade do App</li>
              <li>Conectar você com usuários próximos baseado em proximidade</li>
              <li>Verificar sua identidade e prevenir fraudes</li>
              <li>Personalizar sua experiência</li>
              <li>Processar pagamentos e assinaturas</li>
              <li>Enviar notificações sobre matches e mensagens</li>
              <li>Melhorar nossos serviços e desenvolver novos recursos</li>
              <li>Aplicar nossos Termos de Uso</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">4. Compartilhamento de Informações</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Podemos compartilhar suas informações com:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Outros Usuários:</strong> Suas informações de perfil, fotos e localização aproximada são visíveis para outros usuários</li>
              <li><strong>Prestadores de Serviços:</strong> Terceiros que nos ajudam a operar o App (processadores de pagamento, provedores de hospedagem)</li>
              <li><strong>Requisitos Legais:</strong> Quando exigido por lei ou para proteger nossos direitos</li>
              <li><strong>Transferências de Negócios:</strong> Em conexão com fusão, aquisição ou venda de ativos</li>
            </ul>
            <p className="text-gray-400 mt-4 text-sm">
              NÃO vendemos suas informações pessoais a terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">5. Notificações de Estabelecimentos Parceiros</h2>
            <div className="bg-[#1a4d3e]/30 border border-green-500/30 rounded-xl p-4 mb-4">
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-green-400">Importante:</strong> Quando você faz check-in em um estabelecimento (bar, clube ou outro local parceiro), 
                você concorda em receber notificações push da administração desse estabelecimento. Veja o que isso significa:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>O que donos de estabelecimentos PODEM fazer:</strong> Enviar anúncios coletivos para todos os usuários com check-in (ex.: "Happy Hour começando agora!", "DJ ao vivo às 22h")</li>
                <li><strong>O que donos de estabelecimentos NÃO PODEM ver:</strong> Seu nome, foto, número de telefone ou qualquer informação identificadora. Eles veem apenas a contagem total de usuários com check-in.</li>
                <li><strong>Quando as notificações param:</strong> Quando você faz check-out do estabelecimento ou seu check-in expira (após 8 horas)</li>
                <li><strong>Controle:</strong> Você pode desativar notificações de estabelecimentos nas configurações do seu dispositivo a qualquer momento</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">6. Privacidade de Localização</h2>
            <p className="text-gray-300 leading-relaxed">
              A localização é central para a funcionalidade do I4IGUANA. Coletamos sua localização apenas quando você 
              usa ativamente o App. Sua localização exata nunca é mostrada a outros usuários - apenas sua 
              distância aproximada (ex.: "50 metros de distância"). Você pode desativar os serviços de localização a qualquer 
              momento nas configurações do seu dispositivo, embora isso limite a funcionalidade do App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">7. Segurança de Dados</h2>
            <p className="text-gray-300 leading-relaxed">
              Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações pessoais, 
              incluindo criptografia, servidores seguros e controles de acesso. No entanto, nenhum método 
              de transmissão pela Internet é 100% seguro, e não podemos garantir segurança absoluta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">8. Retenção de Dados</h2>
            <p className="text-gray-300 leading-relaxed">
              Retemos suas informações pessoais enquanto sua conta estiver ativa ou conforme necessário para 
              fornecer serviços. Quando você excluir sua conta, excluiremos ou anonimizaremos suas informações 
              dentro de 30 dias, exceto onde formos obrigados a retê-las para fins legais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">9. Seus Direitos</h2>
            <p className="text-gray-300 leading-relaxed mb-4">Você tem o direito de:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Acesso:</strong> Solicitar uma cópia de seus dados pessoais</li>
              <li><strong>Correção:</strong> Atualizar ou corrigir informações imprecisas</li>
              <li><strong>Exclusão:</strong> Solicitar exclusão de sua conta e dados</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato portátil</li>
              <li><strong>Opt-out:</strong> Cancelar inscrição de comunicações de marketing</li>
              <li><strong>Retirar Consentimento:</strong> Revogar consentimento dado anteriormente</li>
            </ul>
            <p className="text-gray-400 mt-4">
              Para exercer esses direitos, entre em contato conosco em <a href="mailto:nir@i4iguana.com" className="text-green-400 hover:underline">nir@i4iguana.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">10. Cookies e Rastreamento</h2>
            <p className="text-gray-300 leading-relaxed">
              Usamos cookies e tecnologias similares para aprimorar sua experiência, analisar uso e 
              entregar conteúdo personalizado. Você pode controlar cookies através das configurações do seu navegador, embora 
              desativá-los possa afetar a funcionalidade do App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">11. Serviços de Terceiros</h2>
            <p className="text-gray-300 leading-relaxed">
              O App pode conter links para websites ou serviços de terceiros. Não somos responsáveis pelas 
              práticas de privacidade desses terceiros. Encorajamos você a ler suas políticas de privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">12. Privacidade de Menores</h2>
            <p className="text-gray-300 leading-relaxed">
              I4IGUANA não é destinado a menores de 18 anos. Não coletamos conscientemente 
              informações pessoais de crianças. Se descobrirmos que uma criança nos forneceu 
              informações pessoais, as excluiremos imediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">13. Transferências Internacionais de Dados</h2>
            <p className="text-gray-300 leading-relaxed">
              Suas informações podem ser transferidas e processadas em países diferentes do seu. 
              Garantimos que salvaguardas apropriadas estejam em vigor para proteger suas informações de acordo 
              com esta Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">14. Alterações nesta Política</h2>
            <p className="text-gray-300 leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre quaisquer mudanças 
              publicando a nova política nesta página e atualizando a data de "Última atualização". O uso continuado do 
              App após as mudanças constitui aceitação da política atualizada.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">15. Entre em Contato</h2>
            <p className="text-gray-300 leading-relaxed">
              Se você tiver perguntas ou preocupações sobre esta Política de Privacidade ou nossas práticas de dados, entre em contato conosco:
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
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} I4IGUANA. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}

export default function PrivacyPolicy() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1f1a]" />}>
      <PrivacyContent />
    </Suspense>
  )
}
