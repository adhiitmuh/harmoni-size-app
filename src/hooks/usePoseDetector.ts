import { useEffect, useState } from 'react';

export interface PoseDetectorState {
  detector: unknown | null;
  isLoading: boolean;
  loadingStage: string;
  error: string | null;
}

export const usePoseDetector = (): PoseDetectorState => {
  const [state, setState] = useState<PoseDetectorState>({
    detector: null,
    isLoading: true,
    loadingStage: 'Initializing TensorFlow...',
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setState(s => ({ ...s, loadingStage: 'Loading TensorFlow backend...' }));
        const tf = await import('@tensorflow/tfjs-core');
        await import('@tensorflow/tfjs-backend-webgl');
        await tf.ready();

        if (cancelled) return;
        setState(s => ({ ...s, loadingStage: 'Loading pose detection model...' }));

        const poseDetection = await import('@tensorflow-models/pose-detection');
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
            enableSmoothing: true,
          }
        );

        if (cancelled) return;
        setState({ detector, isLoading: false, loadingStage: 'Ready', error: null });
      } catch (err) {
        if (cancelled) return;
        setState(s => ({
          ...s,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load model',
        }));
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  return state;
};
