import React, { useEffect, useRef, useState } from "react";
import { Group, Rect, Text } from "react-konva";
import { UIMonitorItem } from "~/types/UI";
import { BaseUIItem } from "./BaseUIItem";
import { Line as KonvaLine, Circle } from "react-konva";
import Konva from "konva";

interface MonitorUIItemProps {
  item: UIMonitorItem;
  isRunMode: boolean;
}

// 定义数据点类型
interface DataPoint {
  timestamp: number; // 时间戳
  values: number[];  // 值数组
  rawData: any;      // 原始数据
}

// 定义颜色数组
const COLORS = [
  "#FF5252", // 红色
  "#4CAF50", // 绿色
  "#2196F3", // 蓝色
  "#FF9800", // 橙色
  "#9C27B0", // 紫色
  "#00BCD4", // 青色
  "#FFEB3B", // 黄色
  "#795548", // 棕色
  "#607D8B", // 蓝灰色
  "#E91E63"  // 粉色
];

export const MonitorUIItem: React.FC<MonitorUIItemProps> = ({ item, isRunMode }) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [maxDataValues, setMaxDataValues] = useState(0); // 数据中最大的数组长度
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<DataPoint[]>([]);
  const serviceIdRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(false); // 添加连接状态标记

  // 绘制折线图
  const renderLineChart = () => {
    if (!isRunMode) return null;

    const now = Date.now();
    const timeWindow = item.duration * 1000;
    const startTime = now - timeWindow;

    // 计算坐标
    const chartWidth = item.width;
    const chartHeight = item.height;
    const yRange = item.maxValue - item.minValue;

    // 绘制网格
    const gridLines = [];
    const gridCount = 5;
    
    // 水平网格线
    for (let i = 0; i <= gridCount; i++) {
      const y = (i / gridCount) * chartHeight;
      const value = item.maxValue - (i / gridCount) * yRange;
      gridLines.push(
        <KonvaLine
          key={`h-grid-${i}`}
          points={[0, y, chartWidth, y]}
          stroke="#ccc"
          strokeWidth={0.5}
          dash={[5, 5]}
        />
      );
      gridLines.push(
        <Text
          key={`h-label-${i}`}
          x={5}
          y={y - 10}
          text={value.toFixed(1)}
          fontSize={12}
          fill="#888"
        />
      );
    }
    
    // 垂直网格线 - 时间刻度
    const timeIntervals = 5;
    for (let i = 0; i <= timeIntervals; i++) {
      const x = (i / timeIntervals) * chartWidth;
      const timeAgo = ((timeIntervals - i) / timeIntervals) * item.duration;
      gridLines.push(
        <KonvaLine
          key={`v-grid-${i}`}
          points={[x, 0, x, chartHeight]}
          stroke="#ccc"
          strokeWidth={0.5}
          dash={[5, 5]}
        />
      );
      gridLines.push(
        <Text
          key={`v-label-${i}`}
          x={x - 10}
          y={chartHeight - 20}
          text={`${timeAgo.toFixed(1)}s`}
          fontSize={12}
          fill="#888"
        />
      );
    }

    // 如果有数据点，绘制折线
    let lines = [];
    let points = [];

    // 过滤出时间窗口内的数据点
    const visiblePoints = dataPoints.filter(p => p.timestamp >= startTime);

    if (visiblePoints.length > 0) {
      // 为每个数据系列绘制折线
      for (let seriesIdx = 0; seriesIdx < maxDataValues; seriesIdx++) {
        const seriesColor = COLORS[seriesIdx % COLORS.length];
        const seriesPoints = [];
  
        // 收集该系列的所有点
        for (let i = 0; i < visiblePoints.length; i++) {
          const point = visiblePoints[i];
          if (seriesIdx < point.values.length) {
            const value = point.values[seriesIdx];
            // 计算x和y坐标
            const x = ((point.timestamp - startTime) / timeWindow) * chartWidth;
            const y = chartHeight - ((value - item.minValue) / yRange) * chartHeight;
            seriesPoints.push(x, y);
          }
        }
  
        // 如果有足够的点，绘制折线
        if (seriesPoints.length >= 4) { // 至少需要两个点(4个坐标)
          lines.push(
            <KonvaLine
              key={`line-${seriesIdx}`}
              points={seriesPoints}
              stroke={seriesColor}
              strokeWidth={2}
              tension={0.3}
            />
          );
        }
  
        // 为每个系列在最新点位置添加一个圆点
        if (seriesPoints.length >= 2) {
          const lastX = seriesPoints[seriesPoints.length - 2];
          const lastY = seriesPoints[seriesPoints.length - 1];
          points.push(
            <Circle
              key={`point-${seriesIdx}`}
              x={lastX}
              y={lastY}
              radius={4}
              fill={seriesColor}
            />
          );
        }
      }
    }

    return (
      <Group>
        {/* 绘制背景 */}
        <Rect
          width={chartWidth}
          height={chartHeight}
          fill="#f9f9f9"
          stroke="#ddd"
          strokeWidth={1}
        />
        
        {/* 绘制网格 */}
        {gridLines}
        
        {/* 绘制所有折线 */}
        {lines}
        
        {/* 绘制最新点 */}
        {points}
        
        {/* 如果没有数据点且已连接，显示等待数据的提示 */}
        {visiblePoints.length === 0 && isConnected && (
          <Text
            text={`等待数据: ${item.port}端口 [${item.filterTag || '所有'}]`}
            fontSize={14}
            fill="#666"
            width={chartWidth}
            height={chartHeight}
            align="center"
            verticalAlign="middle"
          />
        )}
        
        {/* 如果没有数据且未连接，显示连接中的提示 */}
        {visiblePoints.length === 0 && !isConnected && (
          <Text
            text={`正在连接端口 ${item.port}...`}
            fontSize={14}
            fill="#666"
            width={chartWidth}
            height={chartHeight}
            align="center"
            verticalAlign="middle"
          />
        )}
      </Group>
    );
  };

  // 启动和停止TCP监控
  useEffect(() => {
    if (!isRunMode) return;

    const startMonitor = async () => {
      try {
        // 开始TCP监控
        setIsConnected(false); // 重置连接状态
        const response = await window.electronAPI.startTcpMonitor({ port: item.port });
        
        if (response.success && response.serverId) {
          serviceIdRef.current = response.serverId; // 确保serverId存在
          console.log(`TCP监控已启动，服务ID: ${response.serverId}`);
          setError(null);
          setIsConnected(true); // 标记连接成功
        } else {
          console.error(`启动TCP监控失败: ${response.error}`);
          setError(response.error || "启动TCP监控失败");
        }
      } catch (err) {
        console.error("启动TCP监控出错:", err);
        setError("启动TCP监控出错");
      }
    };

    // TCP数据处理
    const handleTcpData = (event: any, tcpData: { serverId: string, data: any[] }) => {
      if (!serviceIdRef.current || tcpData.serverId !== serviceIdRef.current) return;

      const { filterTag, drawField } = item;
      const now = Date.now();

      // 处理接收到的每个JSON对象
      tcpData.data.forEach(data => {
        try {
          if (data && data.fields && data.fields.node === filterTag) {
            // 找到匹配的字段
            if (drawField && data.fields[drawField]) {
              const fieldValue = data.fields[drawField];
              
              // 尝试解析字段值，它应该是一个数字数组的字符串表示
              let values: number[] = [];
              
              try {
                // 如果是字符串形式的数组 "[0.35, 1.1, 0.55]"
                if (typeof fieldValue === 'string') {
                  // 尝试解析字符串形式的数组
                  const match = fieldValue.match(/\[(.*)\]/);
                  if (match && match[1]) {
                    values = match[1].split(',').map(v => parseFloat(v.trim()));
                  }
                }
                // 如果已经是数组
                else if (Array.isArray(fieldValue)) {
                  values = fieldValue.map(v => typeof v === 'number' ? v : parseFloat(v));
                }
                // 如果是单个数字
                else if (typeof fieldValue === 'number') {
                  values = [fieldValue];
                }
                
                // 验证所有值都是有效数字
                if (values.some(v => isNaN(v))) {
                  throw new Error("无效的数值");
                }
                
                // 更新最大数组长度
                if (values.length > maxDataValues) {
                  setMaxDataValues(values.length);
                }
              } catch (error) {
                console.error("解析数据字段失败:", error);
                return;
              }
              
              // 添加新的数据点
              const newPoint: DataPoint = {
                timestamp: now,
                values,
                rawData: data
              };
              
              const updatedPoints = [...dataRef.current, newPoint];
              
              // 保留最近时间窗口内的数据点
              const timeWindow = item.duration * 1000;
              const filteredPoints = updatedPoints.filter(p => now - p.timestamp <= timeWindow);
              
              // 更新数据
              dataRef.current = filteredPoints;
              setDataPoints(filteredPoints);
            }
          }
        } catch (error) {
          console.error("处理TCP数据异常:", error);
        }
      });
    };

    // 注册TCP数据监听器
    window.electronAPI.onTcpData(handleTcpData);
    
    // 启动监控
    startMonitor();

    return () => {
      // 清理函数，停止监控
      window.electronAPI.offTcpData(handleTcpData);
      setIsConnected(false); // 重置连接状态
      
      if (serviceIdRef.current) {
        window.electronAPI.stopTcpMonitor({ serverId: serviceIdRef.current })
          .then(response => {
            if (response.success) {
              console.log("TCP监控已停止");
            } else {
              console.error("停止TCP监控失败:", response.error);
            }
          })
          .catch(err => {
            console.error("停止TCP监控出错:", err);
          });
      }
    };
  }, [isRunMode, item.port, item.filterTag, item.drawField, item.duration]);

  // 定期刷新图表以确保动画效果
  useEffect(() => {
    if (!isRunMode) return;
    
    // 设置定时器，每100ms刷新一次数据点
    const timer = setInterval(() => {
      setDataPoints([...dataRef.current]);
    }, 100);
    
    return () => clearInterval(timer);
  }, [isRunMode]);

  // 在组件加载时，即使运行模式下暂无数据，也需要显示监视器
  return (
    <BaseUIItem item={item} isRunMode={isRunMode}>
      {isRunMode ? (
        error ? (
          <Group>
            <Rect
              width={item.width}
              height={item.height}
              fill="#f8d7da"
              stroke="#dc3545"
              strokeWidth={1}
            />
            <Text
              text={`错误: ${error}`}
              fontSize={14}
              fill="#721c24"
              width={item.width}
              height={item.height}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        ) : (
          renderLineChart()
        )
      ) : (
        <Group>
          <Rect
            width={item.width}
            height={item.height}
            fill="#f0f8ff"
            stroke="#b8daff"
            strokeWidth={1}
          />
          <Text
            text={`监视器 [端口: ${item.port}]`}
            fontSize={14}
            fill="#000"
            width={item.width}
            padding={5}
          />
          <Text
            text={`筛选: ${item.filterTag || '未设置'}`}
            fontSize={12}
            fill="#333"
            y={20}
            width={item.width}
            padding={5}
          />
          <Text
            text={`字段: ${item.drawField || '未设置'}`}
            fontSize={12}
            fill="#333"
            y={40}
            width={item.width}
            padding={5}
          />
        </Group>
      )}
    </BaseUIItem>
  );
};