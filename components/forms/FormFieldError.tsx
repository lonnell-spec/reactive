import { motion } from 'motion/react'
import { AlertCircle } from 'lucide-react'

interface FormFieldErrorProps {
  message: string;
}

/**
 * Displays a tooltip-style error message for form fields
 * 
 * @param message The error message to display
 */
export const FormFieldError = ({ message }: FormFieldErrorProps) => {
  return (
    <motion.div 
      className="absolute left-0 top-full w-full"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{ pointerEvents: 'none', marginTop: '5px' }}
    >
      <div className="relative flex justify-center">
        <motion.div 
          className="z-50 bg-white border border-orange-300 rounded-md px-3 py-2 shadow-md text-sm w-max max-w-[250px]"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(255, 255, 255, 0.98)' }}
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-t border-orange-300 rotate-45" style={{ backgroundColor: 'rgba(255, 255, 255, 0.98)' }}></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-500 flex-shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <span className="text-gray-700">{message}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FormFieldError;
