"use client";

import { useEffect, useState } from "react";
import apiService from "@/services/api";

interface ProgressData {
  progress: number;
  status: string;
  message: string;
}

interface ProgressModalProps {
  isOpen: boolean;
  sessionId: string;
  onComplete: () => void;
  onClose: () => void;
  onUploadNew?: () => void;
}

export default function ProgressModal({ isOpen, sessionId, onComplete, onClose, onUploadNew }: ProgressModalProps) {
  const [progressData, setProgressData] = useState<ProgressData>({
    progress: 0,
    status: 'starting',
    message: 'Initializing analysis...'
  });
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen || !sessionId) {
      setIsCompleted(false); // reset when modal closes
      setProgressData({
        progress: 0,
        status: 'starting',
        message: 'Initializing analysis...'
      });
      return;
    }

    const eventSource = apiService.subscribeToProgress(sessionId, (data: ProgressData) => {
      setProgressData(data);

      if (data.status === 'completed') {
        setIsCompleted(true);
        // Don't auto-close, let user choose action
      } else if (data.status === 'error') {
        // Close on error
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [isOpen, sessionId, onComplete, onClose]);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'generating':
        return 'text-blue-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      case 'generating':
        return '🤖';
      case 'parsing':
        return '🔍';
      case 'updating':
        return '📝';
      case 'finalizing':
        return '⚡';
      default:
        return '⏳';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-surface border border-dark-border rounded-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="text-6xl mb-4">
            {isCompleted ? '🎉' : getStatusIcon(progressData.status)}
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-2">
            {isCompleted ? 'Analysis Complete!' : 'Analyzing Your Code'}
          </h3>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{progressData.message}</span>
              <span>{progressData.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressData.progress}%` }}
              />
            </div>
          </div>

          {/* Status */}
          <div className={`text-sm font-medium ${getStatusColor(progressData.status)} mb-6`}>
            {progressData.status.charAt(0).toUpperCase() + progressData.status.slice(1)}
          </div>

          {/* Action Buttons */}
          {isCompleted ? (
            <div className="space-y-3">
              <button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                View Documentation
              </button>
              <button
                onClick={() => {
                  if (onUploadNew) {
                    onUploadNew();
                  }
                  onClose();
                }}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Upload New File
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
