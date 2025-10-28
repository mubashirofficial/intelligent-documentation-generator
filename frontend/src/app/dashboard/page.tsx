"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import apiService from "@/services/api";
import { Project, Documentation, Message } from "@/types";
import toast from "react-hot-toast";
import { copyToClipboard, generateAndDownloadDocumentation, DocumentationItem } from "@/utils";
import ProgressModal from "@/components/ProgressModal";

export default function DashboardPage() {
  const router = useRouter();
  const { currentProject, setCurrentProject } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [docs, setDocs] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLanguage, setNewProjectLanguage] = useState("typescript");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "editor" | "docs" | "chat" | "search"
  >("editor");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [selectedDownloadFile, setSelectedDownloadFile] = useState<string>('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [analysisSessionId, setAnalysisSessionId] = useState<string>('');

  // Add this function inside your DashboardPage component
  const formatChatResponseLikeDocs = (content: string) => {
    // Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts
      .map((part, index) => {
        // Handle code blocks
        if (part.startsWith("```") && part.endsWith("```")) {
          const codeMatch = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (codeMatch) {
            const [, language, code] = codeMatch;
            return (
              <div
                key={index}
                className="relative group bg-gray-900 rounded-lg p-4 mb-3"
              >
                <button
                  onClick={() => copyToClipboard(code.trim())}
                  className="absolute top-3 right-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-opacity opacity-0 group-hover:opacity-100"
                >
                  Copy
                </button>
                <pre className="text-xs text-gray-300 overflow-x-auto font-mono">
                  <code>{code.trim()}</code>
                </pre>
              </div>
            );
          }
        }

        // Handle headers (### Header)
        if (part.startsWith("### ")) {
          const headerText = part.replace("### ", "").trim();
          return (
            <h4
              key={index}
              className="text-white font-semibold text-base mt-4 mb-2"
            >
              {headerText}
            </h4>
          );
        }

        // Handle regular text - apply the same cleaning as docs tab
        const cleanText = part
          .replace(/```[\s\S]*?\n|```/g, "") // Remove code blocks
          .replace(/\*\*/g, "") // Remove bold markers
          .replace(/\*/g, "") // Remove asterisks
          .replace(/\(.*?\)/g, "") // Remove type annotations like (int, float)
          .replace(/@param|@returns|@example/g, "") // Remove JSDoc tags
          .trim();

        if (!cleanText) return null;

        return (
          <p
            key={index}
            className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-3"
          >
            {cleanText
              .split("\n")
              .map((line: string) => line.trim())
              .join("\n")}
          </p>
        );
      })
      .filter(Boolean);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (currentProject) loadDocumentation();
  }, [currentProject]);

  useEffect(() => {
    if (activeTab === "docs") loadDocumentation();
  }, [activeTab]);

  // Close download dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDownloadDropdown && !target.closest('.download-dropdown-container')) {
        setShowDownloadDropdown(false);
        setSelectedDownloadFile('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProjects();
      setProjects(data);
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return toast.error("Enter project name");
    try {
      const newProject = await apiService.createProject({
        name: newProjectName,
        language: newProjectLanguage,
      });
      setProjects([...projects, newProject]);
      setCurrentProject(newProject);
      setNewProjectName("");
      setNewProjectLanguage("typescript");
      setSelectedLanguage("");
      setShowCreateForm(false);
      toast.success("Project created!");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target?.result as string);
      };
      reader.readAsText(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target?.result as string);
      };
      reader.readAsText(file);
      toast.success(`File dropped: ${file.name}`);
    }
  };

  const handleAnalyze = async () => {
    if (!currentProject) return toast.error("Select a project first");
    if (!code.trim() && !selectedFile)
      return toast.error("Enter code or upload file");

    // Generate session ID for progress tracking
    const sessionId = Date.now().toString();
    setAnalysisSessionId(sessionId);
    setShowProgressModal(true);
    setAnalyzing(true);

    // Fire-and-forget API call - don't wait for response
    // The progress modal will handle completion via SSE stream
    try {
      if (selectedFile) {
        //await apiService.analyzeFile(currentProject._id, selectedFile);
        apiService.analyzeCode(currentProject._id, code, fileName, sessionId).catch(error => {
          console.log('Analysis API error:', error);
          // Don't show error here - let SSE stream handle it
        });
      } else {
        apiService.analyzeCode(currentProject._id, code, fileName, sessionId).catch(error => {
          console.log('Analysis API error:', error);
          // Don't show error here - let SSE stream handle it
        });
      }
    } catch (error) {
      console.error('Analysis setup error:', error);
      toast.error("Failed to start analysis");
      setShowProgressModal(false);
      setAnalyzing(false);
    }
  };

  const loadDocumentation = async () => {
    if (!currentProject) return;
    try {
      const data = await apiService.getDocumentation(currentProject._id);
      setDocs(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Then use it in handleSendMessage
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentProject) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };
    setMessages([...messages, userMsg]);
    setChatInput('');
    setIsThinking(true);
    try {
      let finalQuestion = chatInput;

      const response = await apiService.askQuestion(currentProject._id, finalQuestion);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data?.answer || response.answer || 'No response',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      toast.error('Failed to get answer');
    } finally {
      setIsThinking(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentProject) return;
    try {
      const results = await apiService.searchDocs(
        currentProject._id,
        searchQuery
      );
      setSearchResults(results.data || results);
    } catch (error) {
      toast.error("Search failed");
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await apiService.deleteProject(projectToDelete._id);
      setProjects(projects.filter((p) => p._id !== projectToDelete._id));

      // If the deleted project was the current project, clear it
      if (currentProject?._id === projectToDelete._id) {
        setCurrentProject(null);
      }

      setShowDeleteModal(false);
      setProjectToDelete(null);
      toast.success("Project deleted successfully");
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const cancelDeleteProject = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const handleDownloadDocument = async () => {
    if (!selectedDownloadFile || !docs?.data?.documentation) {
      toast.error('Please select a file to download');
      return;
    }

    const fileData = docs.data.documentation[selectedDownloadFile];
    if (!fileData || !Array.isArray(fileData)) {
      toast.error('No documentation found for selected file');
      return;
    }

    try {
      await generateAndDownloadDocumentation(
        currentProject?.name || 'Unknown Project',
        selectedDownloadFile,
        fileData as DocumentationItem[],
        currentProject?.language || 'typescript'
      );

      setShowDownloadDropdown(false);
      setSelectedDownloadFile('');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleAnalysisComplete = async () => {
    setShowProgressModal(false);
    setAnalysisSessionId('');
    setAnalyzing(false);
    setSelectedFile(null);
    setFileName('');
    setCode('');
    await loadDocumentation();
    setActiveTab('docs');
    toast.success("Analysis complete! Documentation is ready.");
  };

  const handleProgressModalClose = () => {
    setShowProgressModal(false);
    setAnalysisSessionId('');
    setAnalyzing(false);
  };

  const handleUploadNewFile = () => {
    // Reset file selection
    setSelectedFile(null);
    setFileName('');
    setCode('');
    // Stay on editor tab
    setActiveTab('editor');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col">
        <div className="p-4 border-b border-dark-border">
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80"
          >
            DocuGen AI
          </button>
          <p className="text-xs text-gray-400 mt-1">Multi-Language Docs</p>
        </div>

        <div className="p-4">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            + New Project
          </button>

          {showCreateForm && (
            <form onSubmit={handleCreateProject} className="mt-4 space-y-3">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded text-white text-sm"
              />
              <select
                value={selectedLanguage == "other" ? selectedLanguage : newProjectLanguage}
                onChange={(e) => {
                  setNewProjectLanguage(e.target.value)
                  setSelectedLanguage(e.target.value)
                }}
                className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded text-white text-sm"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="other">Other</option>
              </select>

              {/* Show text input when "Other" is selected */}
              {selectedLanguage === "other" && (
                <input
                  type="text"
                  value={newProjectLanguage == "other" ? '' : newProjectLanguage}
                  onChange={(e) => setNewProjectLanguage(e.target.value)}
                  placeholder="Enter language name"
                  required
                  className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded text-white text-sm"
                />
              )}

              <button
                type="submit"
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              >
                Create
              </button>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {projects.map((project) => (
            <div
              key={project._id}
              className={`relative group w-full p-3 rounded-lg transition-all ${currentProject?._id === project._id
                  ? "bg-blue-600 text-white"
                  : "bg-dark-elevated hover:bg-dark-border text-gray-300"
                }`}
            >
              <button
                onClick={() => setCurrentProject(project)}
                className="w-full text-left"
              >
                <div className="font-medium text-sm">{project.name}</div>
                <div className="text-xs opacity-70">{project.language}</div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(project);
                }}
                className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete project"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-dark-surface border-b border-dark-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {currentProject ? (
                <>
                  <h2 className="text-xl font-semibold text-white">
                    {currentProject.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Language: {currentProject.language}
                  </p>
                </>
              ) : (
                <h2 className="text-xl font-semibold text-white">
                  Select a project
                </h2>
              )}
            </div>
            {currentProject && (
              <div className="flex gap-2">
                {["editor", "docs", "chat", "search"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-lg capitalize ${activeTab === tab
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {!currentProject ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                No project selected
              </h2>
              <p className="text-gray-400">
                Create or select a project to get started
              </p>
            </div>
          ) : (
            <>
              {/* Editor Tab */}
              {activeTab === "editor" && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="glass p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Code Editor
                    </h3>

                    {/* File Upload Area */}
                    <div
                      className={`drop-zone p-8 rounded-lg mb-4 text-center ${dragOver ? "drag-over" : ""
                        }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="text-4xl mb-2">📁</div>
                      <p className="text-gray-400 mb-2">
                        Drag & drop file here or
                      </p>
                      <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer inline-block">
                        Choose File
                        <input
                          type="file"
                          accept=".ts,.tsx,.js,.jsx,.py"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      {selectedFile && (
                        <p className="text-green-400 mt-2 text-sm">
                          ✓ {selectedFile.name}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 mb-4">
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="filename"
                        readOnly
                        className="flex-1 px-4 py-2 bg-dark-elevated border border-dark-border rounded text-white"
                      />
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded"
                      >
                        {analyzing ? "Analyzing..." : "Analyze"}
                      </button>
                    </div>

                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Upload your TypeScript/JavaScript/Python file here..."
                      readOnly
                      className="w-full h-96 p-4 bg-dark-bg border border-dark-border rounded text-white font-mono text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Docs Tab - Enhanced Design */}
              {activeTab === "docs" && (
                <div className="max-w-6xl mx-auto py-8">
                  {/* Download Section */}
                  {docs?.data?.documentation && Object.keys(docs.data.documentation).length > 0 && (
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">Documentation</h2>
                      <div className="relative download-dropdown-container">
                        <button
                          onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Documentation
                        </button>

                        {showDownloadDropdown && (
                          <div className="absolute right-0 top-full mt-2 w-64 bg-dark-surface border border-dark-border rounded-lg shadow-lg z-10">
                            <div className="p-3">
                              <h3 className="text-sm font-medium text-white mb-2">Select file to download:</h3>
                              <select
                                value={selectedDownloadFile}
                                onChange={(e) => setSelectedDownloadFile(e.target.value)}
                                className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded text-white text-sm mb-3"
                              >
                                <option value="">Choose a file...</option>
                                {Object.keys(docs.data.documentation).map((fileName) => (
                                  <option key={fileName} value={fileName}>
                                    {fileName}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleDownloadDocument}
                                  disabled={!selectedDownloadFile}
                                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm transition-colors"
                                >
                                  Download
                                </button>
                                <button
                                  onClick={() => {
                                    setShowDownloadDropdown(false);
                                    setSelectedDownloadFile('');
                                  }}
                                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!docs?.data?.documentation || Object.keys(docs.data.documentation).length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-4">📚</div>
                      <p>No documentation yet. Upload a file or paste code!</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {Object.entries(docs.data.documentation).map(
                        ([fileName, items]: [string, any]) => (
                          <div
                            key={fileName}
                            className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-700"
                          >
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                              📄 {fileName}
                            </h3>

                            <div className="space-y-6">
                              {Array.isArray(items) &&
                                items.map((doc: any) => (
                                  <div
                                    key={doc._id}
                                    className="bg-gray-800 rounded-lg p-5 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded uppercase font-semibold">
                                          {doc.type}
                                        </span>
                                        <h4 className="text-white font-medium text-lg">
                                          {doc.name}
                                        </h4>
                                      </div>
                                    </div>

                                    {/* Summary */}
                                    {doc.summary && (
                                      <div className="mb-4 text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                        {doc.summary
                                          .replace(/```[\s\S]*?\n|```/g, "") // remove code blocks
                                          .replace(/\*\*/g, "") // remove bold
                                          .replace(/\*/g, "") // remove asterisks
                                          .replace(
                                            /\([^)]*[a-zA-Z][^)]*\)/g,
                                            ""
                                          ) // remove type annotations like (int, float)
                                          .replace(
                                            /@param|@returns|@example/g,
                                            ""
                                          ) // remove JSDoc tags
                                          .replace(/^##\s?/gm, "")
                                          .replace(/^#\s?/gm, "")
                                          .trim()
                                          .split("\n")
                                          .map((line: string) => line.trim())
                                          .join("\n")}
                                      </div>
                                    )}

                                    {/* Code Snippet */}
                                    {doc.codeSnippet && (
                                      <div className="relative group mb-3">
                                        <button
                                          onClick={() =>
                                            copyToClipboard(doc.codeSnippet)
                                          }
                                          className="absolute top-2 right-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          Copy
                                        </button>
                                        <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-green-300 shadow-inner">
                                          <code>{doc.codeSnippet}</code>
                                        </pre>
                                      </div>
                                    )}

                                    {/* Parameters Notice */}
                                    {/* {(!doc.parameters || doc.parameters.length === 0) && (
                                  <div className="text-xs text-gray-500 italic">
                                    No parameters extracted
                                  </div>
                                )} */}

                                    {/* Examples */}
                                    {doc.examples &&
                                      doc.examples.length > 0 && (
                                        <div className="mt-3 bg-gray-800 rounded-lg p-3 border border-gray-700 text-sm text-yellow-300 font-mono whitespace-pre-line">
                                          {doc.examples.join("\n")}
                                        </div>
                                      )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Chat Tab - MODIFIED SECTION */}
              {activeTab === "chat" && (
                <div className="max-w-4xl mx-auto h-full flex flex-col">
                  <div className="flex-1 glass rounded-xl p-6 mb-4 overflow-y-auto">
                    {messages.length === 0 && !isThinking ? (
                      <div className="text-center py-12 text-gray-400">
                        <p>Ask me anything about your code!</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-4 rounded-lg ${msg.role === "user"
                                ? "bg-blue-600 text-white ml-12"
                                : "bg-dark-elevated text-gray-200 mr-12"
                              }`}
                          >
                            <div className="text-xs font-medium mb-2 opacity-70">
                              {msg.role === "user" ? "You" : "AI"}
                            </div>

                            {msg.role === "assistant" ? (
                              // Format AI response like docs tab
                              <div className="space-y-4">
                                {formatChatResponseLikeDocs(msg.content)}
                              </div>
                            ) : (
                              // User message (simple text)
                              <div className="text-sm">{msg.content}</div>
                            )}
                          </div>
                        ))}
                        {isThinking && (
                          <div className="p-4 rounded-lg bg-dark-elevated text-gray-200 mr-12">
                            <div className="text-xs font-medium mb-2 opacity-70">
                              AI
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-400">
                                Thinking...
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Ask about your code..."
                      className="flex-1 px-4 py-3 bg-dark-elevated border border-dark-border rounded text-white"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              {/* Search Tab */}
              {activeTab === "search" && (
                <div className="max-w-6xl mx-auto py-8">
                  <div className="flex gap-2 mb-8">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search documentation..."
                      className="flex-1 px-4 py-3 bg-dark-elevated border border-dark-border rounded text-white"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      Search
                    </button>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="space-y-8">
                      {/* Group results by file */}
                      {Object.entries(
                        searchResults.reduce((acc: any, result: any) => {
                          const fileName = result.fileName || "Unknown File";
                          if (!acc[fileName]) {
                            acc[fileName] = [];
                          }
                          acc[fileName].push(result);
                          return acc;
                        }, {})
                      ).map(([fileName, results]: [string, any]) => (
                        <div
                          key={fileName}
                          className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-700"
                        >
                          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            🔍 {fileName}
                          </h3>

                          <div className="space-y-6">
                            {results.map((result: any) => (
                              <div
                                key={result._id}
                                className="bg-gray-800 rounded-lg p-5 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow"
                              >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded uppercase font-semibold">
                                      {result.type}
                                    </span>
                                    <h4 className="text-white font-medium text-lg">
                                      {result.name}
                                    </h4>
                                  </div>
                                </div>

                                {/* Summary */}
                                {result.summary && (
                                  <div className="mb-4 text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                    {result.summary
                                      .replace(/```[\s\S]*?\n|```/g, "") // remove code blocks
                                      .replace(/\*\*/g, "") // remove bold
                                      .replace(/\*/g, "") // remove asterisks
                                      .replace(/\([^)]*[a-zA-Z][^)]*\)/g, "") // remove type annotations like (int, float)
                                      .replace(/@param|@returns|@example/g, "") // remove JSDoc tags
                                      .replace(/^##\s?/gm, "")
                                      .replace(/^#\s?/gm, "")
                                      .trim()
                                      .split("\n")
                                      .map((line: string) => line.trim())
                                      .join("\n")}
                                  </div>
                                )}

                                {/* Code Snippet */}
                                {result.codeSnippet && (
                                  <div className="relative group mb-3">
                                    <button
                                      onClick={() =>
                                        copyToClipboard(result.codeSnippet)
                                      }
                                      className="absolute top-2 right-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      Copy
                                    </button>
                                    <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-green-300 shadow-inner">
                                      <code>{result.codeSnippet}</code>
                                    </pre>
                                  </div>
                                )}

                                {/* Examples */}
                                {result.examples &&
                                  result.examples.length > 0 && (
                                    <div className="mt-3 bg-gray-800 rounded-lg p-3 border border-gray-700 text-sm text-yellow-300 font-mono whitespace-pre-line">
                                      {result.examples.join("\n")}
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    searchQuery && (
                      <div className="text-center py-12 text-gray-400">
                        <div className="text-4xl mb-4">🔍</div>
                        <p>No results found for "{searchQuery}"</p>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Delete Project
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {projectToDelete?.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteProject}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={showProgressModal}
        sessionId={analysisSessionId}
        onComplete={handleAnalysisComplete}
        onClose={handleProgressModalClose}
        onUploadNew={handleUploadNewFile}
      />
    </div>
  );
}
