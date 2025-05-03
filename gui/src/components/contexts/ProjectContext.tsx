import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ProjectInfo {
  projectPath: string;
  projectName: string;
}

interface ProjectContextType {
  projectInfo: ProjectInfo | null;
  setProjectInfo: (info: ProjectInfo | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  return (
    <ProjectContext.Provider value={{ projectInfo, setProjectInfo }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};