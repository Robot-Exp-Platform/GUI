import { FC, useState } from "react";
import {
  Button,
  Header,
  Form,
  Modal,
  Message,
  Segment,
  Divider,
  Tab,
} from "semantic-ui-react";
import { useProject } from "~/components/contexts/ProjectContext";

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Page: FC<HomeProps> = ({ onNavigate }) => {
  const { loadProject } = useProject();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [parentDir, setParentDir] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTaskDesignerClick = () => {
    setShowProjectModal(true);
  };

  const handleOpenProject = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.selectProjectDirectory();

      if (result.success && result.projectPath && result.projectName) {
        const success = await loadProject(
          result.projectPath,
          result.projectName,
        );

        if (success) {
          setShowProjectModal(false);
          onNavigate("TaskDesigner");
        } else {
          setError("加载项目失败");
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (_) {
      setError("选择项目失败");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProjectFile = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.selectProjectFile();

      if (result.success && result.projectPath && result.projectName) {
        const success = await loadProject(
          result.projectPath,
          result.projectName,
        );

        if (success) {
          setShowProjectModal(false);
          onNavigate("TaskDesigner");
        } else {
          setError("加载项目失败");
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (_) {
      setError("选择项目文件失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectParentDir = async () => {
    try {
      const result = await window.electronAPI.selectParentDirectory();

      if (result.success && result.directoryPath) {
        setParentDir(result.directoryPath);
      }
    } catch (err) {
      console.error("选择目录失败", err);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("请输入项目名称");
      return;
    }

    if (!parentDir) {
      setError("请选择父目录");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.createProject({
        projectPath: parentDir,
        projectName: projectName.trim(),
      });

      if (result.success && result.projectPath && result.projectName) {
        const success = await loadProject(
          result.projectPath,
          result.projectName,
        );

        if (success) {
          setShowProjectModal(false);
          onNavigate("TaskDesigner");
        } else {
          setError("加载项目失败");
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (_) {
      setError("创建项目失败");
    } finally {
      setLoading(false);
    }
  };

  const projectManagementTabs = [
    {
      menuItem: "打开已有项目",
      render: () => (
        <Tab.Pane>
          <Segment>
            <Button primary fluid onClick={handleOpenProject} loading={loading}>
              选择项目文件夹
            </Button>
            <Divider horizontal>或</Divider>
            <Button
              primary
              fluid
              onClick={handleOpenProjectFile}
              loading={loading}
            >
              选择项目配置文件（.roplat）
            </Button>
          </Segment>
        </Tab.Pane>
      ),
    },
    {
      menuItem: "创建新项目",
      render: () => (
        <Tab.Pane>
          <Form>
            <Form.Input
              label="项目名称"
              placeholder="输入项目名称"
              value={projectName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setProjectName(e.target.value)
              }
              required
            />
            <Form.Group>
              <Form.Input
                label="项目位置"
                placeholder="选择父目录"
                value={parentDir}
                width={13}
                readOnly
                required
              />
              <Form.Button
                label="&nbsp;"
                icon="folder open"
                onClick={handleSelectParentDir}
                width={3}
              />
            </Form.Group>
            <Button
              primary
              fluid
              onClick={handleCreateProject}
              loading={loading}
            >
              创建项目
            </Button>
          </Form>
        </Tab.Pane>
      ),
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Header
        as="h1"
        content="さあ始めましょう。今宵のマスカレードを！"
        textAlign="center"
      />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "10%",
          width: "100%",
        }}
      >
        <Button primary onClick={handleTaskDesignerClick}>
          任务设计器
        </Button>
        <div style={{ width: "10%" }}></div>
        <Button primary onClick={() => onNavigate("UIDesigner")}>
          界面设计器
        </Button>
      </div>

      <Modal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        size="small"
      >
        <Modal.Header>项目管理</Modal.Header>
        <Modal.Content>
          {error && (
            <Message negative>
              <Message.Header>操作失败</Message.Header>
              <p>{error}</p>
            </Message>
          )}

          <Tab panes={projectManagementTabs} />
        </Modal.Content>
      </Modal>
    </div>
  );
};
