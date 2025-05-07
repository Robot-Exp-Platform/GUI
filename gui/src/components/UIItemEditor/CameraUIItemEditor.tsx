import React, { useEffect, useState } from "react";
import { Form, Dropdown, Button, Message, Icon } from "semantic-ui-react";
import { UICameraItem } from "~/types/UI";
import { useUIDesigner } from "~/components/contexts/UIDesignerContext";
import "./styles.css";

interface CameraUIItemEditorProps {
  item: UICameraItem;
}

interface CameraOption {
  key: string;
  text: string;
  value: string;
}

interface CameraSource {
  id: string;
  name: string;
  deviceId: string;
}

export const CameraUIItemEditor: React.FC<CameraUIItemEditorProps> = ({
  item,
}) => {
  const { updateItem } = useUIDesigner();
  const [cameraOptions, setCameraOptions] = useState<CameraOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cameraSources, setCameraSources] = useState<CameraSource[]>([]);

  // 加载可用摄像头列表
  useEffect(() => {
    loadAvailableCameras();
  }, []);

  // 获取可用摄像头列表
  const loadAvailableCameras = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 首先尝试使用Electron API获取摄像头列表
      if (window.electronAPI?.getCameraSources) {
        const response = await window.electronAPI.getCameraSources();

        if (response.success && response.sources) {
          setCameraSources(response.sources);

          // 转换为下拉框选项格式
          const options: CameraOption[] = response.sources.map((source) => ({
            key: source.id,
            text: source.name,
            value: source.deviceId,
          }));

          setCameraOptions(options);
          setIsLoading(false);
          return;
        }
      }

      // 如果Electron API不可用或失败，则使用浏览器API
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const sources = videoDevices.map((device, index) => ({
        id: device.deviceId,
        name: device.label || `摄像头 ${index + 1}`,
        deviceId: device.deviceId
      }));
      
      setCameraSources(sources);
      
      // 转换为下拉框选项格式
      const options: CameraOption[] = sources.map((source) => ({
        key: source.id,
        text: source.name,
        value: source.deviceId,
      }));
      
      setCameraOptions(options);
      
    } catch (error) {
      console.error("获取摄像头列表出错:", error);
      setErrorMessage("获取摄像头列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 更新选中的摄像头
  const handleCameraChange = async (_e: any, data: any) => {
    const deviceId = data.value;
    if (!deviceId) return;

    setIsLoading(true);

    try {
      // 获取摄像头详细信息并开始捕获
      const selectedCamera = cameraSources.find(cam => cam.deviceId === deviceId);
      
      if (selectedCamera) {
        updateItem(item.id, {
          deviceId: deviceId,
          deviceName: selectedCamera.name,
          hasSignal: true,
        });
      } else {
        setErrorMessage("未找到选中的摄像头设备");
        
        // 设置为无信号状态
        updateItem(item.id, {
          deviceId: deviceId,
          hasSignal: false,
        });
      }
    } catch (error) {
      console.error("摄像头捕获出错:", error);
      setErrorMessage("摄像头捕获失败");

      // 设置为无信号状态
      updateItem(item.id, {
        hasSignal: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新摄像头列表
  const handleRefresh = () => {
    loadAvailableCameras();
  };

  return (
    <Form>
      <Form.Field>
        <label>选择要捕获的摄像头</label>
        <div className="dropdown-with-refresh">
          <Dropdown
            placeholder="选择摄像头设备"
            fluid
            selection
            options={cameraOptions}
            value={item.deviceId || ""}
            onChange={handleCameraChange}
            loading={isLoading}
            disabled={isLoading}
          />
          <Button icon onClick={handleRefresh} disabled={isLoading}>
            <Icon name="refresh" />
          </Button>
        </div>
      </Form.Field>

      {errorMessage && (
        <Message negative>
          <Message.Header>错误</Message.Header>
          <p>{errorMessage}</p>
        </Message>
      )}

      <Message info>
        <Message.Header>摄像头捕获</Message.Header>
        <p>选择一个摄像头设备进行实时捕获。如果摄像头不可用或被其他应用占用，将显示"无信号"。</p>
      </Message>
    </Form>
  );
};