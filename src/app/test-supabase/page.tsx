'use client'

import { useEffect, useState } from 'react'
import { supabase, testSupabaseConnection, isSupabaseConfigured } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<{
    configured: boolean
    connected: boolean | null
    error: any
    envVars: {
      url: string | undefined
      hasAnonKey: boolean
    }
  }>({
    configured: false,
    connected: null,
    error: null,
    envVars: {
      url: undefined,
      hasAnonKey: false
    }
  })

  useEffect(() => {
    // Verificar configuração
    const configured = isSupabaseConfigured()

    // Verificar variáveis de ambiente
    const envVars = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }

    setStatus(prev => ({ ...prev, configured, envVars }))

    // Testar conexão
    testSupabaseConnection()
      .then(result => {
        setStatus(prev => ({
          ...prev,
          connected: result.success,
          error: result.error
        }))
      })
      .catch(err => {
        setStatus(prev => ({
          ...prev,
          connected: false,
          error: err
        }))
      })
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Teste de Conexão Supabase
        </h1>

        {/* Status de Configuração */}
        <div className="bg-slate-900 rounded-lg p-6 mb-6 border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">
            Status da Configuração
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.configured ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-300">
                Supabase Configurado: {status.configured ? '✅ Sim' : '❌ Não'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.envVars.url ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-300">
                URL: {status.envVars.url || '❌ Não encontrada'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.envVars.hasAnonKey ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-300">
                Anon Key: {status.envVars.hasAnonKey ? '✅ Configurada' : '❌ Não encontrada'}
              </span>
            </div>
          </div>
        </div>

        {/* Status da Conexão */}
        <div className="bg-slate-900 rounded-lg p-6 mb-6 border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">
            Status da Conexão
          </h2>
          <div className="space-y-3">
            {status.connected === null ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-gray-300">Testando conexão...</span>
              </div>
            ) : status.connected ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-300">✅ Conexão bem-sucedida!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-300">❌ Falha na conexão</span>
                </div>
                {status.error && (
                  <div className="bg-red-950 border border-red-800 rounded p-4 mt-2">
                    <p className="text-red-400 text-sm font-mono">
                      {JSON.stringify(status.error, null, 2)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">
            Informações do Cliente
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-400">
              O cliente Supabase está usando lazy initialization para evitar erros durante o build.
            </p>
            <p className="text-gray-400">
              Se você está vendo esta página, significa que o Next.js está rodando corretamente!
            </p>
          </div>
        </div>

        {/* Botão de Voltar */}
        <div className="mt-8">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            ← Voltar para Home
          </a>
        </div>
      </div>
    </div>
  )
}
