import { motion } from 'motion/react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { AnimatedText } from '../AnimatedText';
import { AnimatedSection } from '../AnimatedSection';

interface GuestFormSubmittedProps {
  submissionId: string;
}

/**
 * Component displayed after successful guest form submission
 * 
 * @param submissionId The ID of the successful submission
 */
export const GuestFormSubmitted = ({ submissionId }: GuestFormSubmittedProps) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <AnimatedSection className="w-full max-w-md">
        <Card className="border-2 border-black shadow-2xl">
          <CardHeader className="text-center bg-black text-white">
            <motion.div
              className="relative h-20 w-auto mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Image 
                src="/church-logo.png"
                alt="Church Logo" 
                fill
                sizes="(max-width: 768px) 100vw, 200px"
                style={{ objectFit: 'contain' }}
                className="filter brightness-0 invert"
              />
            </motion.div>
            <AnimatedText 
              text="Registration Submitted!"
              className="text-2xl font-bold text-red-600"
            />
          </CardHeader>
          <CardContent className="text-center space-y-6 p-8">
            <AnimatedSection delay={0.3}>
              <p className="text-black text-xl">
                Thank you for your guest registration. You will receive a notification once your request is reviewed.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.4}>
              <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
                <p className="text-lg text-gray-700 mb-2">Submission ID:</p>
                <p className="font-mono text-lg font-bold text-black">{submissionId}</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.5}>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xl py-6"
              >
                Submit Another Registration
              </Button>
            </AnimatedSection>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  );
};

export default GuestFormSubmitted;
