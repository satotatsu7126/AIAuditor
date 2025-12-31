import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CATEGORY_CONFIG } from '@/types'

export default function HomePage() {
  const categories = [
    {
      key: 'it_code',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      key: 'translation',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
    },
    {
      key: 'academic',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AIの成果物を、人間が保証する
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-12 max-w-3xl mx-auto">
              生成AIが作成したコード、翻訳、論文を専門家が監査。
              <br />
              品質と信頼性を担保します。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {categories.map(({ key, icon, color, hoverColor }) => {
                const config = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG]
                return (
                  <Link
                    key={key}
                    href={`/request?category=${key}`}
                    className={`bg-gradient-to-br ${color} ${hoverColor} p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105`}
                  >
                    <div className="text-white mb-4 flex justify-center">{icon}</div>
                    <h3 className="text-xl font-bold mb-2">{config.label}</h3>
                    <p className="text-sm text-white/80">{config.description}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">利用の流れ</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  step: '1',
                  title: 'カテゴリを選択',
                  description: 'コード、翻訳、学術の3つのカテゴリから選択',
                },
                {
                  step: '2',
                  title: '内容を入力',
                  description: 'AIの成果物と監査してほしいポイントを入力',
                },
                {
                  step: '3',
                  title: '専門家がレビュー',
                  description: '承認された専門家が内容を確認・監査',
                },
                {
                  step: '4',
                  title: 'レポート受領',
                  description: '総合判定、コメント、修正案を受け取る',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">なぜAI Auditorが必要か</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'AIの限界を補完',
                  description: 'AIは便利ですが、ハルシネーションやセキュリティホールの可能性があります。専門家の目でチェックすることで、リスクを軽減します。',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                },
                {
                  title: '専門家による監査',
                  description: 'エンジニア、翻訳者、研究者など、各分野のプロフェッショナルが監査を行います。',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                },
                {
                  title: '安心の仮払い方式',
                  description: '依頼時に仮払い、納品完了後に決済確定。キャンセル時は全額返金されます。',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  ),
                },
              ].map((feature) => (
                <div key={feature.title} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-primary-600 mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA for Reviewers */}
        <section className="py-20 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">専門家として参加しませんか？</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              あなたの専門知識を活かして、AIの成果物を監査しませんか？
              エンジニア、翻訳者、研究者の方々を募集しています。
            </p>
            <Link
              href="/apply-reviewer"
              className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              専門家として登録する
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
