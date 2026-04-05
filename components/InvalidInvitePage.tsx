'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader } from './ui/card'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'

interface InvalidInvitePageProps {
  /** Determines the message copy shown to the visitor. */
  reason?: 'invalid-slug' | 'invalid-token'
}

/**
 * Rendered when an invite slug or one-time token is invalid, expired, or
 * has already been used.
 */
export function InvalidInvitePage({ reason = 'invalid-token' }: InvalidInvitePageProps) {
  const heading =
    reason === 'invalid-slug'
      ? 'This invitation link is not valid.'
      : 'This invitation has expired.'

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding header */}
        <AnimatedSection className="text-center mb-8">
          <motion.div
            className="relative h-24 w-full mx-auto mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Image
              src="/church-logo.png"
              alt="Church Logo"
              width={96}
              height={96}
              style={{ objectFit: 'contain', margin: '0 auto' }}
              className="h-24 w-auto"
            />
          </motion.div>
          <AnimatedText
            text="Friends of the House Registration"
            className="text-2xl text-gray-600 font-bold"
            delay={0.3}
          />
        </AnimatedSection>

        {/* Error card */}
        <AnimatedSection delay={0.4}>
          <Card className="border-2 border-black shadow-2xl">
            <CardHeader className="bg-black text-white">
              <AnimatedText
                text={heading}
                className="text-2xl font-bold text-red-500"
                delay={0.5}
              />
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <AnimatedSection delay={0.6}>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Please contact the person who shared this link with you to request a new one.
                </p>
              </AnimatedSection>
              <AnimatedSection delay={0.7}>
                <div className="border-l-4 border-red-600 pl-4">
                  <p className="text-sm text-gray-500">
                    Each invitation link can only be used once and expires after 72 hours.
                  </p>
                </div>
              </AnimatedSection>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Footer */}
        <AnimatedSection delay={0.8} className="text-center mt-8">
          <p className="text-base text-gray-500">
            2819 Church Friends of the House Registration System
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}

export default InvalidInvitePage
