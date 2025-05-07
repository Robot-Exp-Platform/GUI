import React, { useState } from "react";
import { Form, Label, Input, Button } from "semantic-ui-react";
import { UIMonitorItem } from "~/types/UI";
import { useUIDesigner } from "~/components/contexts/UIDesignerContext";
import "./styles.css";

interface MonitorUIItemEditorProps {
  item: UIMonitorItem;
}

export const MonitorUIItemEditor: React.FC<MonitorUIItemEditorProps> = ({
  item,
}) => {
  const { updateItem } = useUIDesigner();
  const [port, setPort] = useState<number>(item.port);
  const [filterTag, setFilterTag] = useState<string>(item.filterTag);
  const [drawField, setDrawField] = useState<string>(item.drawField);
  const [duration, setDuration] = useState<number>(item.duration);
  const [minValue, setMinValue] = useState<number>(item.minValue);
  const [maxValue, setMaxValue] = useState<number>(item.maxValue);

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1024 && value <= 65535) {
      setPort(value);
      updateItem(item.id, { port: value });
    }
  };

  const handleFilterTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterTag(value);
    updateItem(item.id, { filterTag: value });
  };

  const handleDrawFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDrawField(value);
    updateItem(item.id, { drawField: value });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setDuration(value);
      updateItem(item.id, { duration: value });
    }
  };

  const handleMinValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setMinValue(value);
      updateItem(item.id, { minValue: value });
    }
  };

  const handleMaxValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > minValue) {
      setMaxValue(value);
      updateItem(item.id, { maxValue: value });
    }
  };

  return (
    <Form>
      <Form.Field>
        <label>端口号 (1024-65535)</label>
        <Input
          type="number"
          min={1024}
          max={65535}
          value={port}
          onChange={handlePortChange}
          placeholder="输入监听端口号"
        />
      </Form.Field>

      <Form.Field>
        <label>筛选标签</label>
        <Input
          value={filterTag}
          onChange={handleFilterTagChange}
          placeholder="输入要筛选的node值"
        />
        <Label pointing>匹配fields.node字段的值</Label>
      </Form.Field>

      <Form.Field>
        <label>绘制字段</label>
        <Input
          value={drawField}
          onChange={handleDrawFieldChange}
          placeholder="输入要绘制的字段"
        />
        <Label pointing>指定fields中要绘制的字段名</Label>
      </Form.Field>

      <Form.Field>
        <label>时间窗口(秒)</label>
        <Input
          type="number"
          min={1}
          value={duration}
          onChange={handleDurationChange}
          placeholder="显示最近多少秒的数据"
        />
      </Form.Field>

      <Form.Field>
        <label>Y轴范围</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Input
            type="number"
            value={minValue}
            onChange={handleMinValueChange}
            placeholder="最小值"
            style={{ marginRight: "10px" }}
          />
          <span>至</span>
          <Input
            type="number"
            value={maxValue}
            onChange={handleMaxValueChange}
            placeholder="最大值"
            style={{ marginLeft: "10px" }}
          />
        </div>
      </Form.Field>
    </Form>
  );
};