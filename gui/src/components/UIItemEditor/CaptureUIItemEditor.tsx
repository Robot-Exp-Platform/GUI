import React, { useEffect, useState } from "react";
import { Form, Dropdown, Button, Message, Icon } from "semantic-ui-react";
import { UICaptureItem } from "~/types/UI";
import { useUIDesigner } from "~/components/contexts/UIDesignerContext";
import "./styles.css";

interface CaptureUIItemEditorProps {
  item: UICaptureItem;
}

interface WindowOption {
  key: string;
  text: string;
  value: string;
  image?: {
    avatar: boolean;
    src: string;
  };
}

interface WindowSource {
  id: string;
  name: string;
  thumbnail: string;
  appIcon?: string;
  display_id: string;
}

// 需要过滤的无效源名称列表
const FILTERED_SOURCE_NAMES = ["AsHotplugCtrl", "AsHDRControl"];

export const CaptureUIItemEditor: React.FC<CaptureUIItemEditorProps> = ({
  item,
}) => {
  const { updateItem } = useUIDesigner();
  const [windowOptions, setWindowOptions] = useState<WindowOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [windowSources, setWindowSources] = useState<WindowSource[]>([]);

  // 加载可用窗口列表
  useEffect(() => {
    loadAvailableWindows();
  }, []);

  // 获取可用窗口列表
  const loadAvailableWindows = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await window.electronAPI.getWindowSources();

      if (response.success && response.sources) {
        // 过滤掉无效的源
        const filteredSources = response.sources.filter(
          (source) => !FILTERED_SOURCE_NAMES.includes(source.name)
        );

        setWindowSources(filteredSources);

        // 转换为下拉框选项格式
        const options: WindowOption[] = filteredSources.map((source) => ({
          key: source.id,
          text: source.name,
          value: source.id,
          image: source.appIcon
            ? {
                avatar: true,
                src: source.appIcon,
              }
            : undefined,
        }));

        setWindowOptions(options);
      } else {
        setErrorMessage(response.error || "加载窗口列表失败");
      }
    } catch (error) {
      console.error("获取窗口列表出错:", error);
      setErrorMessage("获取窗口列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 更新选中的窗口
  const handleWindowChange = async (_e: any, data: any) => {
    const sourceId = data.value;
    if (!sourceId) return;

    setIsLoading(true);

    try {
      // 获取窗口详细信息并开始捕获
      const response = await window.electronAPI.startWindowCapture(sourceId);

      if (response.success && response.source) {
        const selectedWindow = windowOptions.find((w) => w.value === sourceId);

        updateItem(item.id, {
          windowId: sourceId,
          windowTitle: selectedWindow?.text || response.source.name,
          hasSignal: true,
        });
      } else {
        setErrorMessage(response.error || "开始窗口捕获失败");

        // 设置为无信号状态
        updateItem(item.id, {
          windowId: sourceId,
          hasSignal: false,
        });
      }
    } catch (error) {
      console.error("窗口捕获出错:", error);
      setErrorMessage("窗口捕获失败");

      // 设置为无信号状态
      updateItem(item.id, {
        hasSignal: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新窗口列表
  const handleRefresh = () => {
    loadAvailableWindows();
  };

  return (
    <Form>
      <Form.Field>
        <label>选择要捕获的窗口</label>
        <div className="dropdown-with-refresh">
          <Dropdown
            placeholder="选择窗口"
            fluid
            selection
            options={windowOptions}
            value={item.windowId || ""}
            onChange={handleWindowChange}
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
        <Message.Header>窗口捕获</Message.Header>
        <p>选择一个窗口进行实时捕获。如果窗口被关闭，将显示"无信号"。</p>
      </Message>
    </Form>
  );
};
