'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Wallet, ListChecks, BookOpen, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './ui/Button';
import { markOnboardingCompleted } from '../lib/settingsActions';
import toast from 'react-hot-toast';

type Step = 1 | 2 | 3;

const steps = [
  {
    number: 1 as Step,
    title: 'Add your first account',
    description: 'Track your money by creating a bank account or cash wallet.',
    icon: Wallet,
    action: 'Add Account',
    href: '/money/accounts'
  },
  {
    number: 2 as Step,
    title: 'Create your first habit',
    description: 'Build good routines by tracking daily or weekly habits.',
    icon: ListChecks,
    action: 'Add Habit',
    href: '/habits'
  },
  {
    number: 3 as Step,
    title: 'Write your first journal entry',
    description: 'Capture your thoughts, ideas, and memories.',
    icon: BookOpen,
    action: 'Write Entry',
    href: '/journal'
  }
];

interface OnboardingWizardProps {
  isOpen: boolean;
}

export default function OnboardingWizard({ isOpen }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      // Trap focus
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isClosing]);

  const handleClose = async () => {
    setIsClosing(true);
    try {
      await markOnboardingCompleted();
      toast.success('✅ Welcome to LifeOS!');
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
      toast.error('Failed to save onboarding status');
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleAction = () => {
    const step = steps[currentStep - 1];
    router.push(step.href);
    setTimeout(() => {
      handleClose();
    }, 100);
  };

  if (!isOpen || isClosing) {
    return null;
  }

  const step = steps[currentStep - 1];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 backdrop-blur-sm bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Close onboarding wizard"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          {/* Progress Indicator */}
          <div className="mb-8 flex justify-center gap-2">
            {[1, 2, 3].map((num) => (
              <motion.div
                key={num}
                className={`h-2 w-2 rounded-full transition-all ${
                  num === currentStep
                    ? 'bg-blue-600 dark:bg-blue-400 w-6'
                    : num < currentStep
                      ? 'bg-blue-600 dark:bg-blue-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                }`}
                layoutId="progress"
              />
            ))}
          </div>

          {/* Step Header */}
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
              <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Step {currentStep}: {step.title}
            </h2>
          </div>

          {/* Step Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8 text-center"
            >
              <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Action Button */}
          <button
            onClick={handleAction}
            className="mb-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            {step.action}
          </button>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}

            <button
              onClick={currentStep === 3 ? handleClose : handleNext}
              className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
                currentStep === 3
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
              }`}
            >
              {currentStep === 3 ? 'Finish' : (
                <>
                  Next
                  <ChevronRight className="ml-1 inline h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Skip Option */}
          <div className="mt-4 text-center">
            <button
              onClick={handleClose}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
