import React, { useEffect, useState, useRef } from "react";
import { Group, Rect, Text, Image as KonvaImage } from "react-konva";
import { UICameraItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";

interface CameraUIItemProps {
  item: UICameraItem;
  isRunMode: boolean;
}

export const CameraUIItem: React.FC<CameraUIItemProps> = ({
  item,
  isRunMode,
}) => {
  const [isActive, setIsActive] = useState(item.hasSignal);
  const [deviceName, setDeviceName] = useState(item.deviceName);
  const [captureError, setCaptureError] = useState(false);

  // 视频流相关状态和引用
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const renderIntervalRef = useRef<number | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 视频尺寸状态
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [adjustedDimensions, setAdjustedDimensions] = useState({
    width: 0,
    height: 0,
  });

  // 计算保持比例的尺寸
  const calculateProportionalDimensions = (
    srcWidth: number,
    srcHeight: number,
    maxWidth: number,
    maxHeight: number
  ) => {
    if (srcWidth === 0 || srcHeight === 0)
      return { width: maxWidth, height: maxHeight };

    // 计算比例
    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

    return {
      width: Math.floor(srcWidth * ratio),
      height: Math.floor(srcHeight * ratio),
    };
  };

  // 初始化并清理视频捕获资源
  useEffect(() => {
    // 创建视频元素用于实时捕获
    const video = document.createElement("video");
    video.style.display = "none";
    document.body.appendChild(video);
    videoRef.current = video;

    // 创建canvas用于处理视频帧
    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    // 创建图像对象用于Konva显示
    const img = new window.Image();
    imageRef.current = img;

    // 清理函数
    return () => {
      // 停止视频流
      if (videoRef.current && videoRef.current.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      // 停止动画帧
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      // 清除渲染定时器
      if (renderIntervalRef.current) {
        clearInterval(renderIntervalRef.current);
        renderIntervalRef.current = null;
      }

      // 移除创建的DOM元素
      if (videoRef.current) document.body.removeChild(videoRef.current);
      if (canvasRef.current) document.body.removeChild(canvasRef.current);
    };
  }, []);

  // 开始捕获摄像头 - 使用Electron API
  const startCapturingCamera = async (deviceId: string) => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      // 首先通过Electron API获取摄像头信息
      const response = await window.electronAPI.startCameraCapture(deviceId);

      if (!response.success) {
        setCaptureError(true);
        setIsActive(false);
        console.error("摄像头捕获失败:", response.error);
        return;
      }

      // 获取摄像头视频流 - 这部分仍需要浏览器API
      let stream;
      try {
        // 首先尝试使用指定的deviceId
        const constraints = {
          video: {
            deviceId: { exact: deviceId },
          },
          audio: false,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (deviceError) {
        console.warn(
          `指定设备(${deviceId})不可用，尝试使用默认摄像头:`,
          deviceError
        );

        // 如果指定设备失败，尝试使用任何可用的摄像头
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (fallbackError) {
          // 所有摄像头都不可用
          console.error("所有摄像头都不可用:", fallbackError);
          throw fallbackError;
        }
      }

      const video = videoRef.current;
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play();

        // 获取视频的实际尺寸
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        setVideoDimensions({ width: videoWidth, height: videoHeight });

        // 计算保持比例的尺寸
        const maxHeight = item.height - 20; // 减去标题栏高度
        const adjusted = calculateProportionalDimensions(
          videoWidth,
          videoHeight,
          item.width,
          maxHeight
        );
        setAdjustedDimensions(adjusted);

        setVideoReady(true);
        setCaptureError(false);
        setIsActive(true);

        // 开始渲染循环
        startRenderLoop(adjusted.width, adjusted.height);
      };

      // 设置视频错误处理
      video.onerror = () => {
        console.error("视频播放错误");
        setCaptureError(true);
        setIsActive(false);
      };
    } catch (error) {
      console.error("启动摄像头捕获失败:", error);
      setCaptureError(true);
      setIsActive(false);
    }
  };

  // 视频渲染循环
  const startRenderLoop = (width: number, height: number) => {
    if (!videoRef.current || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置canvas大小与适应后的视频尺寸匹配
    canvas.width = width;
    canvas.height = height;

    // 清除旧的渲染循环
    if (renderIntervalRef.current) {
      clearInterval(renderIntervalRef.current);
      renderIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 计算渲染间隔，默认为1帧/秒
    const fps = item.frames || 1;
    const interval = Math.floor(1000 / fps);

    // 渲染函数
    const renderFrame = () => {
      const video = videoRef.current;

      if (!video || !ctx || !imageRef.current) return;

      try {
        // 清除之前的内容
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制视频帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 将canvas转换为图像数据
        imageRef.current.src = canvas.toDataURL("image/webp");
      } catch (err) {
        console.error("渲染视频帧错误:", err);
      }
    };

    // 设置定时渲染
    renderIntervalRef.current = window.setInterval(renderFrame, interval);

    // 立即执行一次渲染
    renderFrame();
  };

  // 初始化摄像头捕获
  useEffect(() => {
    if (item.deviceId && item.hasSignal) {
      setIsActive(item.hasSignal);
      setDeviceName(item.deviceName);

      // 开始捕获
      startCapturingCamera(item.deviceId);
    } else {
      setIsActive(false);
    }
  }, [item.deviceId, item.hasSignal]);

  // 处理设备名称变化
  useEffect(() => {
    setDeviceName(item.deviceName);
  }, [item.deviceName]);

  // 当帧率变化时重新启动渲染循环
  useEffect(() => {
    if (videoReady && isActive) {
      startRenderLoop(adjustedDimensions.width, adjustedDimensions.height);
    }
  }, [item.frames]);

  // 当组件尺寸变化时重新计算视频尺寸
  useEffect(() => {
    if (videoDimensions.width > 0 && videoDimensions.height > 0) {
      const maxHeight = item.height - 20; // 减去标题栏高度
      const adjusted = calculateProportionalDimensions(
        videoDimensions.width,
        videoDimensions.height,
        item.width,
        maxHeight
      );
      setAdjustedDimensions(adjusted);

      // 如果视频已经准备好，重新开始渲染
      if (videoReady) {
        startRenderLoop(adjusted.width, adjusted.height);
      }
    }
  }, [item.width, item.height, videoDimensions.width, videoDimensions.height]);

  return (
    <BaseUIItem item={item} isRunMode={isRunMode}>
      <Group>
        {/* 背景 */}
        <Rect
          width={item.width}
          height={item.height}
          fill="transparent"
          stroke={isActive ? "#3498db" : "#555"}
          strokeWidth={1}
        />

        {/* 显示实时捕获内容 */}
        {isActive && videoReady && imageRef.current && (
          <KonvaImage
            image={imageRef.current}
            width={adjustedDimensions.width}
            height={adjustedDimensions.height}
            x={(item.width - adjustedDimensions.width) / 2}
            y={(item.height - 20 - adjustedDimensions.height) / 2}
            listening={false}
          />
        )}

        {/* 无信号提示 */}
        {!isActive && (
          <Text
            text="无信号"
            fontSize={18}
            fontFamily="Arial"
            fill="#ff4d4d"
            width={item.width}
            height={item.height}
            align="center"
            verticalAlign="middle"
          />
        )}

        {/* 捕获错误提示 */}
        {isActive && captureError && (
          <Text
            text="捕获失败"
            fontSize={16}
            fontFamily="Arial"
            fill="#ffcc00"
            width={item.width}
            height={item.height}
            align="center"
            verticalAlign="middle"
          />
        )}

        {/* 摄像头名称 */}
        {isActive && (
          <Text
            text={deviceName || "未知设备"}
            fontSize={12}
            fontFamily="Arial"
            fill="#000000"
            width={item.width}
            height={20}
            y={item.height - 20}
            align="center"
            verticalAlign="middle"
          />
        )}
      </Group>
    </BaseUIItem>
  );
};
