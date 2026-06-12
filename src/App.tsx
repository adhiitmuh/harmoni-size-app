import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import WelcomeScreen from './components/WelcomeScreen';
import SetupScreen from './components/SetupScreen';
import ScanScreen from './components/ScanScreen';
import ResultsScreen from './components/ResultsScreen';
import { AppScreen, BodyMeasurements, UserSetup } from './types';

const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeInOut' },
};

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [setup, setSetup] = useState<UserSetup>({ heightCm: 170, gender: 'unisex', scanMode: 'static' });
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);

  const handleSetupComplete = (s: UserSetup) => {
    setSetup(s);
    setScreen('scan');
  };

  const handleScanComplete = (m: BodyMeasurements) => {
    setMeasurements(m);
    setScreen('results');
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-cyber-bg cyber-grid">
      <AnimatePresence mode="wait">
        {screen === 'welcome' && (
          <motion.div key="welcome" className="absolute inset-0" {...fadeSlide}>
            <WelcomeScreen onStart={() => setScreen('setup')} />
          </motion.div>
        )}
        {screen === 'setup' && (
          <motion.div key="setup" className="absolute inset-0" {...fadeSlide}>
            <SetupScreen onComplete={handleSetupComplete} onBack={() => setScreen('welcome')} />
          </motion.div>
        )}
        {screen === 'scan' && (
          <motion.div key="scan" className="absolute inset-0" {...fadeSlide}>
            <ScanScreen setup={setup} onComplete={handleScanComplete} onBack={() => setScreen('setup')} />
          </motion.div>
        )}
        {screen === 'results' && measurements && (
          <motion.div key="results" className="absolute inset-0" {...fadeSlide}>
            <ResultsScreen
              measurements={measurements}
              setup={setup}
              onRescan={() => setScreen('scan')}
              onHome={() => setScreen('welcome')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
