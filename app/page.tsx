import Image from 'next/image'

/**
 * Root page — registration now requires a personal invitation link.
 * Admins distribute links in the form /invite/[slug].
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/church-logo.png"
            alt="Church Logo"
            width={96}
            height={96}
            style={{ objectFit: 'contain' }}
            className="h-24 w-auto"
          />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">
            Friends of the House Registration
          </h1>
          <p className="text-gray-500 text-lg">2819 Church</p>
        </div>

        {/* Message card */}
        <div className="border-2 border-black rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-black px-6 py-4">
            <h2 className="text-xl font-bold text-red-500">Invitation Required</h2>
          </div>
          <div className="bg-white px-6 py-8 space-y-4">
            <p className="text-gray-700 text-lg leading-relaxed">
              Friends of the House Registration requires an invitation link.
            </p>
            <p className="text-gray-600">
              Please contact your host for access. They will send you a personal link
              to complete your registration.
            </p>
            <div className="border-l-4 border-red-600 pl-4 text-left mt-6">
              <p className="text-sm text-gray-500">
                Each invitation link is unique and single-use. Do not share your link
                with others.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
