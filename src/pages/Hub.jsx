import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'

const calculators = [
  {
    name: 'Kombucha',
    description: 'Batch scaling & delayed sugar',
    icon: '🍵',
    path: '/kombucha',
    accent: 'hover:border-amber-300',
  },
  {
    name: 'Slambuc',
    description: 'Ingredient ratios',
    icon: '🍲',
    path: '/slambuc',
    accent: 'hover:border-orange-300',
  },
  {
    name: 'Pizza',
    description: 'Biga Bench dough calc',
    icon: '🍕',
    path: '/pizza',
    accent: 'hover:border-red-300',
  },
]

export default function Hub() {
  return (
    <PageContainer>
      <div className="px-4 py-8 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="text-4xl">🧮</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Recipe Calculators</h1>
          <p className="text-gray-500 mt-1">Choose a calculator</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {calculators.map((calc) => (
            <div key={calc.name}>
              {calc.path ? (
                <Link
                  to={calc.path}
                  className={`block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center transition-all hover:shadow-md hover:scale-[1.02] ${calc.accent}`}
                >
                  <span className="text-4xl block mb-3">{calc.icon}</span>
                  <h2 className="font-semibold text-gray-900">{calc.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{calc.description}</p>
                </Link>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center opacity-60">
                  <span className="text-4xl block mb-3">{calc.icon}</span>
                  <h2 className="font-semibold text-gray-900">{calc.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{calc.description}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                    Coming soon
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
