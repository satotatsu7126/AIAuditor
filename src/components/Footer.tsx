import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Auditor</h3>
            <p className="text-sm text-gray-600">
              AI成果物の品質を、人間の専門家が保証します。
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">サービス</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/request?category=it_code" className="text-sm text-gray-600 hover:text-gray-900">
                  IT/コード監査
                </Link>
              </li>
              <li>
                <Link href="/request?category=translation" className="text-sm text-gray-600 hover:text-gray-900">
                  ビジネス翻訳監査
                </Link>
              </li>
              <li>
                <Link href="/request?category=academic" className="text-sm text-gray-600 hover:text-gray-900">
                  学術/ファクトチェック
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">専門家の方へ</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/apply-reviewer" className="text-sm text-gray-600 hover:text-gray-900">
                  専門家として登録
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} AI Auditor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
