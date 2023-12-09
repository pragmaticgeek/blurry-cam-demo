import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

const BlurryCamDemo = () => {
  const webcamRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const [segmentation, setSegmentation] = useState(null);

  
  const loadSegmentation = async () => {
    const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;

    const segmenterConfig = {
      runtime: 'tfjs', 
      modelType: 'general',
    };
    const segmentation = await bodySegmentation.createSegmenter(model, segmenterConfig);
    setSegmentation(segmentation);
  };

  const processVideo = async () => {
      const video = webcamRef.current.video;

    const outputCanvas = outputCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    const updateCanvasLoop = async () => {

      const segmentations = await segmentation.segmentPeople(video);

      const subject = segmentations[0];

      const foregroundColor = {r: 0, g: 0, b: 0, a: 0};
      const backgroundColor = {r: 0, g: 0, b: 0, a: 128};
      const drawContour = false;
      const foregroundThreshold = 0.7;
      const opacity = 0.8;
      const maskBlurAmount = 5; // Number of pixels to blur by.
      const flipHorizontal = false;

      const backgroundDarkeningMask = await bodySegmentation.toBinaryMask(segmentations, foregroundColor, backgroundColor, drawContour, foregroundThreshold);

      await bodySegmentation.drawMask(
        outputCanvas, video, backgroundDarkeningMask, opacity, maskBlurAmount, flipHorizontal);
    
      await bodySegmentation.drawBokehEffect(outputCanvas, video, subject, opacity, 8 , maskBlurAmount, flipHorizontal);

      const mask = subject.mask;
      const maskOutput = await createImageBitmap(await mask.toImageData());
      
      const maskCanvasCtx = maskCanvas.getContext("2d");
      maskCanvasCtx.clearRect(0, 0, video.width,  video.height);
      maskCanvasCtx.filter = "blur(-3px)";

      maskCanvasCtx.drawImage(maskOutput, 0, 0);

    };

    setInterval(updateCanvasLoop, 100);
  };

  useLayoutEffect(() => {
    tf.setBackend('webgl');
    loadSegmentation();
  }, []);

  useEffect(() => {
    if (segmentation && webcamRef?.current?.video) {
      processVideo();
    }
  }, [segmentation, webcamRef?.current]);

  
  return (
    <div>
      <Webcam ref={webcamRef} width="640" height="480" />
      <canvas ref={maskCanvasRef} width="640" height="480" />
      <canvas ref={outputCanvasRef} width="640" height="480" />
    </div>
  );
};

export default BlurryCamDemo;