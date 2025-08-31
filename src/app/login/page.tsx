'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Leaf, LogIn, UserPlus, Mail, User, Loader } from 'lucide-react'
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import { createUser, getUserByEmail } from '@/utils/db/actions'
import { toast } from 'react-hot-toast'

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
})

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [web3AuthLoading, setWeb3AuthLoading] = useState(true)
  const web3authRef = useRef<Web3Auth | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      try {
        web3authRef.current = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET,
          chainConfig,
          privateKeyProvider,
        })

        await web3authRef.current.initModal()

        if (web3authRef.current.connected) {
          const user = await web3authRef.current.getUserInfo()
          if (user?.email) {
            localStorage.setItem('userEmail', user.email)
            await createUser(user.email, user.name || 'Anonymous User')
            router.push('/')
          }
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error)
        toast.error('Failed to initialize authentication')
      } finally {
        setWeb3AuthLoading(false)
      }
    }

    init()
  }, [router])

  const handleWeb3AuthLogin = async () => {
    if (!web3authRef.current) {
      toast.error('Authentication not initialized')
      return
    }

    setLoading(true)
    try {
      await web3authRef.current.connect()
      const user = await web3authRef.current.getUserInfo()
      
      if (user?.email) {
        localStorage.setItem('userEmail', user.email)
        await createUser(user.email, user.name || 'Anonymous User')
        toast.success('Login successful!')
        router.push('/')
      }
    } catch (error) {
      console.error("Error during Web3Auth login:", error)
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // Login logic
        const user = await getUserByEmail(email)
        if (user) {
          localStorage.setItem('userEmail', email)
          toast.success('Login successful!')
          router.push('/')
        } else {
          toast.error('User not found. Please sign up first.')
        }
      } else {
        // Signup logic
        const existingUser = await getUserByEmail(email)
        if (existingUser) {
          toast.error('User already exists. Please login instead.')
        } else {
          await createUser(email, name)
          localStorage.setItem('userEmail', email)
          toast.success('Account created successfully!')
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      toast.error('Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (web3AuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <Leaf className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the Zero-to-Hero waste management community
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <form className="space-y-6" onSubmit={handleEmailAuth}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name
                </label>
                <div className="relative">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your full name"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {isLogin ? <LogIn className="mr-2 h-5 w-5" /> : <UserPlus className="mr-2 h-5 w-5" />}
                  {isLogin ? 'Sign in' : 'Create account'}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={handleWeb3AuthLogin}
                variant="outline"
                className="w-full py-3"
                disabled={loading}
              >
                {loading ? (
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 1.858-.896 3.605-2.068 4.777-1.172 1.172-2.92 1.899-4.777 2.068C9.33 15.186 8.17 15.999 6.834 15.999c-1.336 0-2.496-.813-2.879-1.994C2.613 12.605 2.001 11.345 2.001 10c0-1.345.612-2.605 1.954-4.005C4.338.813 5.498 0 6.834 0c1.336 0 2.496.813 2.879 1.994 1.342 1.4 1.954 2.66 1.954 4.005 0 .789-.19 1.534-.527 2.193.337.659.527 1.404.527 2.193 0 1.345-.612 2.605-1.954 4.005-.383 1.181-1.543 1.994-2.879 1.994s-2.496-.813-2.879-1.994C2.613 11.395 2.001 10.135 2.001 8.79c0-1.345.612-2.605 1.954-4.005C4.338 3.603 5.498 2.79 6.834 2.79c1.336 0 2.496.813 2.879 1.994.337.659.527 1.404.527 2.193 0 .789-.19 1.534-.527 2.193z"/>
                  </svg>
                )}
                Continue with Web3Auth
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-green-600 hover:text-green-500"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}