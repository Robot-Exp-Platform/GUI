import React, { useEffect, useState, useRef } from "react";
import { Group, Rect, Text, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { UICaptureItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";

interface CaptureUIItemProps {
  item: UICaptureItem;
}

// 窗口捕获组件，实时显示另一个窗口的画面，类似OBS
export const CaptureUIItem: React.FC<CaptureUIItemProps> = ({ item }) => {
  const [isActive, setIsActive] = useState(item.hasSignal);
  const [windowTitle, setWindowTitle] = useState(item.windowTitle);
  const [captureError, setCaptureError] = useState(false);

  // 视频流相关状态和引用
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const checkWindowIntervalRef = useRef<number | null>(null);
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

      // 清除检查窗口状态的定时器
      if (checkWindowIntervalRef.current) {
        clearInterval(checkWindowIntervalRef.current);
        checkWindowIntervalRef.current = null;
      }

      // 移除创建的DOM元素
      if (videoRef.current) document.body.removeChild(videoRef.current);
      if (canvasRef.current) document.body.removeChild(canvasRef.current);
    };
  }, []);

  // 开始捕获指定窗口
  const startCapturingWindow = async (sourceId: string) => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      // 先获取源的详细信息
      const response = await window.electronAPI.startWindowCapture(sourceId);

      if (!response.success) {
        console.error("获取窗口捕获源失败:", response.error);
        setCaptureError(true);
        setIsActive(false);
        return;
      }

      // 为媒体获取创建约束
      const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
            // 减少最大宽高限制，避免性能问题
            minWidth: 100,
            maxWidth: 1920,
            minHeight: 100,
            maxHeight: 1080,
          },
        },
      };

      // 注意：由于TypeScript类型约束，这里使用断言来处理特定的Electron约束
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints as any
      );

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
      console.error("启动窗口捕获失败:", error);
      setCaptureError(true);
      setIsActive(false);
    }
  };

  // 视频渲染循环
  const startRenderLoop = (width: number, height: number) => {
    if (!videoRef.current || !canvasRef.current || !imageRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: true });
    if (!ctx) return;

    // 设置canvas大小与适应后的视频尺寸匹配
    canvas.width = width;
    canvas.height = height;

    // 设置渲染循环
    const renderFrame = () => {
      if (!video || !ctx || !imageRef.current) return;

      try {
        // 清除之前的内容，使用透明背景
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 计算源视频绘制区域，避免拉伸
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;

        let sx = 0,
          sy = 0,
          sw = video.videoWidth,
          sh = video.videoHeight;

        // 保持原始比例，居中绘制
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        // 将canvas转换为图像数据 - 使用PNG格式以保持透明度
        imageRef.current.src = canvas.toDataURL("image/png");

        // 继续渲染下一帧
        animFrameRef.current = requestAnimationFrame(renderFrame);
      } catch (err) {
        // 捕获任何绘制错误，但继续尝试渲染
        console.error("渲染视频帧错误:", err);
        animFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    // 开始渲染
    renderFrame();
  };

  // 检查窗口是否还存在
  const checkWindowExists = async (sourceId: string) => {
    if (!sourceId) return;

    try {
      const response = await window.electronAPI.checkWindowExists(sourceId);

      if (response.success) {
        // 更新窗口状态
        if (response.exists !== item.hasSignal) {
          setIsActive(!!response.exists);

          // 如果窗口重新出现，尝试重新开始捕获
          if (response.exists && !isActive) {
            startCapturingWindow(sourceId);
          }
        }
      }
    } catch (error) {
      console.error("检查窗口状态失败:", error);
      setIsActive(false);
      setCaptureError(true);
    }
  };

  // 初始化窗口捕获
  useEffect(() => {
    if (item.windowId && item.hasSignal) {
      setIsActive(item.hasSignal);
      setWindowTitle(item.windowTitle);

      // 开始捕获
      startCapturingWindow(item.windowId);

      // 定期检查窗口是否仍然存在，减少检查频率以降低CPU使用率
      checkWindowIntervalRef.current = window.setInterval(() => {
        checkWindowExists(item.windowId);
      }, 10000); // 每10秒检查一次
    } else {
      setIsActive(false);
    }

    return () => {
      if (checkWindowIntervalRef.current !== null) {
        clearInterval(checkWindowIntervalRef.current);
        checkWindowIntervalRef.current = null;
      }
    };
  }, [item.windowId, item.hasSignal]);

  // 处理窗口标题变化
  useEffect(() => {
    setWindowTitle(item.windowTitle);
  }, [item.windowTitle]);

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
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
        startRenderLoop(adjusted.width, adjusted.height);
      }
    }
  }, [item.width, item.height, videoDimensions.width, videoDimensions.height]);

  return (
    <BaseUIItem item={item}>
      <Group>
        {/* 背景 - 使用透明背景 */}
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
            // 使用适应后的尺寸，而不是组件的尺寸
            width={adjustedDimensions.width}
            height={adjustedDimensions.height}
            // 居中放置
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

        {/* 窗口标题栏 - 改为黑色文字 */}
        {isActive && (
          <Text
            text={windowTitle || "未知窗口"}
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
